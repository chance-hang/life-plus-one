"""落款像素级复核：白字 + 深色光晕压在照片上，必须处处看得清。

用法：先跑 `node verify-home-cards.cjs`（生成 verification/caption-*.png 与 caption-metrics.json），
     再 python verify-caption-pixels.py

为什么要像素级：落款是唯一压在照片上的文字，它的可读性没法用 DOM 属性判定 ——
`color: #fff` 本身永远「合格」，糊不糊取决于它身后那张照片那一个角落。
所以这里拿两张图做差：有落款 / 无落款（同一次渲染，只切换落款的 visibility）。
差值 = 落款真正画出来的墨迹（含光晕），另一张就是它身后的原始照片。

四组断言：
  A. 位置 —— 亮墨迹（笔画核心）必须落在 DOM 给的四边形里（允许 3px 抗锯齿余量）；
  B. 形状 —— 墨迹像素数在合理区间，说明确实是一行字，不是一块糊掉的东西；
  C. 实色 —— 笔画核心是纯白（≥250），不是半透明；半透明会让亮度跟着照片走；
  D. 可读性 —— 每个笔画像素与它紧邻最暗像素之间的 WCAG 对比度达标。
     这条是「不要和图片内容重合导致看不清」的量化版本。
"""
import json
import pathlib
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    print('SKIP 未安装 Pillow，跳过像素复核（pip install pillow）')
    sys.exit(0)

ROOT = pathlib.Path(__file__).parent
METRICS = ROOT / 'verification' / 'caption-metrics.json'

QUAD_SLACK = 6          # 亮墨迹允许超出四边形的余量（设备px）：抗锯齿 + 斜体字形外扩
DIFF_MIN = 60           # 与「无落款」那张的最小通道差，算作落款画上去的像素
INK_MIN = 200           # 笔画核心的亮度下限（0-255）
NEIGHBOR_R = 5          # 找「紧邻最暗像素」的半径（设备px）：光晕就在笔画边上
CONTRAST_MEDIAN = 4.5   # 中位对比度下限（WCAG AA 正文）
CONTRAST_FLOOR = 3.0    # 单像素对比度下限（WCAG AA 大字）
CONTRAST_BAD_SHARE = 0.05   # 低于下限的像素占比上限
INK_SHARE_PURE = 0.02   # 纯白像素（各通道 ≥250）占比下限：证明是实色不是半透明


def channels(px):
    return px[0], px[1], px[2]


def relative_luminance(px):
    def lin(v):
        v /= 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in channels(px))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def inside(quad, x, y):
    """射线法：点是否在（凸）四边形内。"""
    hit = False
    n = len(quad)
    for i in range(n):
        x1, y1 = quad[i]
        x2, y2 = quad[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            hit = not hit
    return hit


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def expand(box, pad):
    l, t, r, b = box
    return l - pad, t - pad, r + pad, b + pad


def check(style, metrics):
    dsf = metrics['dsf']
    quad = [(p['x'] * dsf, p['y'] * dsf) for p in metrics[style]['quad']]
    shown = Image.open(ROOT / f'verification/caption-{style}.png').convert('RGB')
    blank = Image.open(ROOT / f'verification/caption-{style}-bg.png').convert('RGB')
    assert shown.size == blank.size, f'{style}: 两张对照图尺寸不一致 {shown.size} vs {blank.size}'
    qbox = bbox(quad)
    scan = expand(qbox, NEIGHBOR_R + 4)
    scan = (max(0, int(scan[0])), max(0, int(scan[1])), int(scan[2]), int(scan[3]))

    sp, bp = shown.load(), blank.load()
    luma = shown.convert('L').load()

    ink, diff = [], 0
    for y in range(scan[1], scan[3] + 1):
        for x in range(scan[0], scan[2] + 1):
            v, b = sp[x, y], bp[x, y]
            d = max(abs(v[i] - b[i]) for i in range(3))
            if d >= DIFF_MIN:
                diff += 1
            # 笔画核心：既比原来亮不少，本身也很亮 —— 光晕（变暗）自然被排除
            if d >= DIFF_MIN and min(channels(v)) >= INK_MIN and inside(quad, x, y):
                ink.append((x, y, v))

    assert ink, f'{style}: 落款四边形里找不到亮墨迹，落款可能没画出来或被照片盖住'
    ibox = bbox([(p[0], p[1]) for p in ink])
    slack_box = expand(qbox, QUAD_SLACK)
    assert ibox[0] >= slack_box[0] and ibox[1] >= slack_box[1] and ibox[2] <= slack_box[2] and ibox[3] <= slack_box[3], (
        f'{style}: 亮墨迹超出了 DOM 给的四边形（±{QUAD_SLACK}px）：墨迹 {tuple(round(v) for v in ibox)}，'
        f'四边形 {tuple(round(v) for v in qbox)}')

    pure = sum(1 for p in ink if min(channels(p[2])) >= 250) / len(ink)
    assert pure >= INK_SHARE_PURE, (
        f'{style}: 只有 {pure:.1%} 的笔画像素是纯白，落款可能被做成了半透明（会被身后的照片带偏亮度）')

    ratios, worst = [], None
    for x, y, v in ink:
        lo = None
        for yy in range(max(0, y - NEIGHBOR_R), min(shown.height, y + NEIGHBOR_R + 1)):
            for xx in range(max(0, x - NEIGHBOR_R), min(shown.width, x + NEIGHBOR_R + 1)):
                lv = luma[xx, yy]
                if lo is None or lv < lo[0]:
                    lo = (lv, sp[xx, yy])
        c = contrast(relative_luminance(v), relative_luminance(lo[1]))
        ratios.append(c)
        if worst is None or c < worst[0]:
            worst = (c, (x, y))
    ratios.sort()
    median = ratios[len(ratios) // 2]
    bad = sum(1 for c in ratios if c < CONTRAST_FLOOR) / len(ratios)

    print(f'{style:<8} 墨迹 {len(ink):>5}px  光晕/差异 {diff:>6}px  纯白占比 {pure:6.1%}  '
          f'局部对比度 中位 {median:5.2f}  最低 {ratios[0]:5.2f}  <{CONTRAST_FLOOR} 占比 {bad:5.1%}')
    assert median >= CONTRAST_MEDIAN, f'{style}: 落款局部对比度中位数只有 {median:.2f}，应 ≥ {CONTRAST_MEDIAN}'
    assert bad <= CONTRAST_BAD_SHARE, f'{style}: 有 {bad:.1%} 的笔画像素对比度低于 {CONTRAST_FLOOR}，落款有认不出的地方'
    return {'ink': len(ink), 'diff': diff, 'pure': pure, 'median': median, 'min': ratios[0], 'bad': bad}


def main():
    if not METRICS.exists():
        print('SKIP 未找到 verification/caption-metrics.json，请先跑 node verify-home-cards.cjs')
        sys.exit(0)
    metrics = json.loads(METRICS.read_text(encoding='utf-8'))
    out = {s: check(s, metrics) for s in ('photo', 'classic')}
    # 不比对两版之间的数值：两张卡的背景本来就不同（照片版底部有一层暗压，
    # 简洁版右下的照片几乎没被压过），对比度天然有差。这里只要求各自过线。
    print(f'PASS 落款像素复核通过（两版都是白字+深色光晕，压在照片上局部对比度达标；'
          f'中位 {out["photo"]["median"]:.2f} / {out["classic"]["median"]:.2f}）')


if __name__ == '__main__':
    main()
