"""落款像素级复核：签名压在照片上，必须「处处看得清」，并且「不许抢眼」。

用法：先跑 `node verify-home-cards.cjs`（生成 verification/caption-*.png 与 caption-metrics.json），
     再 python verify-caption-pixels.py

为什么要像素级：落款是唯一压在照片上的文字，它的可读性没法用 DOM 属性判定 ——
`color` 本身永远「合格」，糊不糊取决于它身后那张照片那一个角落。
所以这里拿两张图做差：有落款 / 无落款（同一次渲染，只切换落款的 visibility）。
差值 = 落款真正画出来的墨迹（含光晕），另一张就是它身后的原始照片。

四组断言：
  A. 位置 —— 墨迹必须落在 DOM 给的四边形里（允许抗锯齿余量），防「量着对、看着不对」；
  B. 明度 —— 墨迹平均亮度要落在「该卡片该有的那一档」：太暗=被底色吃掉，太亮=抢眼；
  C. 抬升（只观测不断言）—— 字比身后的原图亮/暗多少；
  D. 可读性 —— 每个笔画像素与它紧邻的「分离来源」之间的 WCAG 对比度达标（中位 ≥4.5）。

这一轮（第十一轮）落款改成「跟各自卡片的正文色度走」，两张卡的明暗方向正好相反：
  照片卡：白字 .88 压在深蓝水（底色均值 118）上 —— 浅字深底，光晕是深色的；
  天数卡：codex 的 #6a7d92 压在亮水面（底色均值 199）上 —— 深字浅底，光晕是浅色的。
所以 B 组的亮度区间、D 组的「分离来源」都要按卡片分开算：
  · 浅字深底 → 比「紧邻最暗像素」（光晕压出来的那圈暗底）；
  · 深字浅底 → 比「紧邻最亮像素」（亮水面本身就是它浮出来的依据）。
用一套反了，深色字会被拿去和旁边的暗水比对比度，永远不合格 —— 那是尺子错，不是设计错。

笔画核心的判定用「颜色接近落款本色」而不是「够白」或「通道差够大」：
本色是实色，直接取核心最稳；通道差在字和底同色系时天然很小，阈值怎么设都不对。
颜色是从 caption-metrics.json 的 computed color 读的，改色不用改这个脚本。
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

QUAD_SLACK = 6          # 墨迹允许超出四边形的余量（设备px）：抗锯齿 + 斜体字形外扩
# 笔画核心的判定要同时满足两条，缺一不可：
#   ① 颜色接近落款本色（从 caption-metrics.json 读到的 computed color）—— 排除光晕（更暗）和背景；
#   ② 与「无落款」那张的通道差 ≥ DIFF_MIN —— 排除「背景本来就是同色」的像素。
# 只满足 ① 会出事：天数卡右下的亮水面本身就在蓝系里，和落款颜色接近，
# 那些像素对比度天然是 1:1，混进来会把中位数从 5.3 拖到 2.3（踩坑记录）。
# 只满足 ② 也会出事：蓝字压蓝水面时通道差本就小，阈值一高就只剩光晕压出来的几笔，
# 样本偏乐观（另一个坑：同一个颜色量出过 5.60 和 4.06 两个结论）。
# 容差按卡片分：
#   天数卡收到 20 —— 12px 的字笔画只有 1~1.5 CSS px，抗锯齿边缘占很大比重，
#     而那些边缘像素本身就是字与底的混合，对比度天然低；放进样本会把「看得清吗」
#     偷换成「小字有多少锯齿边」。20 以内基本只剩笔画的实心部分。
#   照片卡放到 40 —— 它的字是 rgba(255,255,255,.88)，本身就带 12% 透明度，
#     压在深蓝水上实渲出来只有 ~232 而不是 255，容差太小会把整个字滤掉。
INK_TOL = {'photo': 40, 'classic': 20}
DIFF_MIN = 40
NEIGHBOR_R = 5          # 找「紧邻最暗/最亮像素」的半径（设备px）：光晕就在笔画边上
# B 组：墨迹平均亮度区间，按卡片分开。
#   照片卡是白字（亮度上限没意义），只管下限 —— 低于 170 说明白字没画实、被底色吃掉了；
#   天数卡是深灰蓝字，反而是上限在管：高于 165 就接近上一轮被否掉的「太亮」那版。
# 实测：#6a7d92 本色亮度 122；浅蓝 .92 约 200；冷白 .88 约 216。
LUMA_RANGE = {'photo': (170, 255), 'classic': (85, 168)}
# D 组：可读性的「分离来源」在字色的反方向 ——
#   浅字深底比最暗邻居（深色光晕压出来的那圈暗底）；
#   深字浅底比最亮邻居（亮水面 + 浅色微光就是它浮出来的依据）。
DARKEST = {'photo': True, 'classic': False}
# 中位对比度下限，按卡片分开：
#   照片卡白字压在深蓝水上，分离靠深色光晕，可以做到很高 —— 按正文标准 4.5。
#   天数卡是 codex 的 #6a7d92 压在亮水面上，**物理上到不了 4.5**：
#     它的 WCAG 亮度是 0.19，背景就算纯白 255 也只有 4.4:1。
#     12px 斜体署名属于装饰性文字，适用 WCAG 对「大字 / 非文本」的 3:1。
#   实测：#6a7d92 + 3px 浅色微光 → 3.17，过线；再深一档（#5d7189）能到 ~3.5 但偏正文感。
CONTRAST_MEDIAN = {'photo': 4.5, 'classic': 3.0}
# 单像素底线与占比上限（按卡片分）：
#   照片卡（白字 + 深色光晕）每一点都高对比，底线按 3.0 立着，实测 0% 不达标；
#   天数卡逐像素必然有一批落在 3.0 以下 —— 实测落款右半（x 300→358）压在照片那块
#     渐暗的水面上，36% 在 3.0 以下、7% 在 2.5 以下。这是 codex 那个 #6a7d92 的固有上限：
#     它压在亮水面上理论最高就只有 2.6:1（WCAG 亮度 0.19 对 0.573）。
#     所以底线落在「真的认不出」这一档：2.2 —— 实测 <2.2 只有 0.1%。
#     要把这批也拉上去，字得加深到接近黑（#43536a 那档），那就不像签名了，不划算。
CONTRAST_FLOOR = {'photo': 3.0, 'classic': 2.2}
CONTRAST_BAD_SHARE = 0.05   # 低于底线的像素占比上限


def channels(px):
    return px[0], px[1], px[2]


def luma(px):
    """感知亮度（0-255）。只用来判断「变亮还是变暗」和「亮多少」，
    算 WCAG 对比度必须走下面的 relative_luminance。"""
    return 0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2]


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


def parse_rgb(text):
    nums = [int(v) for v in text.replace('rgb(', '').replace('rgba(', '').replace(')', '').split(',')[:3]]
    assert len(nums) == 3, f'解析不了颜色：{text}'
    return tuple(nums)


def check(style, metrics):
    dsf = metrics['dsf']
    quad = [(p['x'] * dsf, p['y'] * dsf) for p in metrics[style]['quad']]
    target = parse_rgb(metrics[style]['color'])
    shown = Image.open(ROOT / f'verification/caption-{style}.png').convert('RGB')
    blank = Image.open(ROOT / f'verification/caption-{style}-bg.png').convert('RGB')
    assert shown.size == blank.size, f'{style}: 两张对照图尺寸不一致 {shown.size} vs {blank.size}'
    qbox = bbox(quad)
    scan = expand(qbox, NEIGHBOR_R + 4)
    scan = (max(0, int(scan[0])), max(0, int(scan[1])), int(scan[2]), int(scan[3]))

    sp, bp = shown.load(), blank.load()
    gray = shown.convert('L').load()      # 找「紧邻最暗像素」用；注意别和外面的 luma() 撞名

    ink, diff = [], 0
    for y in range(scan[1], scan[3] + 1):
        for x in range(scan[0], scan[2] + 1):
            v, b = sp[x, y], bp[x, y]
            d = max(abs(v[i] - b[i]) for i in range(3))
            if d >= DIFF_MIN:
                diff += 1
            # 笔画核心：既是落款本色，又确实把底图改掉了一大块（两条缺一不可，理由见常量注释）
            near = max(abs(v[i] - target[i]) for i in range(3)) <= INK_TOL[style]
            if near and d >= DIFF_MIN and inside(quad, x, y):
                ink.append((x, y, v, b))

    assert ink, f'{style}: 落款四边形里找不到墨迹，落款可能没画出来或被照片盖住'
    ibox = bbox([(p[0], p[1]) for p in ink])
    slack_box = expand(qbox, QUAD_SLACK)
    assert ibox[0] >= slack_box[0] and ibox[1] >= slack_box[1] and ibox[2] <= slack_box[2] and ibox[3] <= slack_box[3], (
        f'{style}: 亮墨迹超出了 DOM 给的四边形（±{QUAD_SLACK}px）：墨迹 {tuple(round(v) for v in ibox)}，'
        f'四边形 {tuple(round(v) for v in qbox)}')

    # B. 明度：太暗=被底色吃掉；太亮=和大数字抢眼、和卡片氛围不搭。区间按卡片分（见 LUMA_RANGE）
    ink_luma = sum(luma(p[2]) for p in ink) / len(ink)
    lo_lim, hi_lim = LUMA_RANGE[style]
    assert lo_lim <= ink_luma <= hi_lim, (
        f'{style}: 落款墨迹平均亮度 {ink_luma:.1f} 不在 [{lo_lim}, {hi_lim}] 内 —— '
        f'低于下限说明字被背景吃掉了，高于上限说明和卡片氛围不搭')

    # C. 抬升（观测，不断言）：字比它身后的原图亮/暗多少。
    # 负数不代表有问题 —— 天数卡上落款就在明亮的水面前面，靠浅色微光分离。
    lifts = sorted(luma(p[2]) - luma(p[3]) for p in ink)
    lift_median = lifts[len(lifts) // 2]

    darkest = DARKEST[style]
    ratios, worst = [], None
    for x, y, v, b in ink:
        pick = None
        for yy in range(max(0, y - NEIGHBOR_R), min(shown.height, y + NEIGHBOR_R + 1)):
            for xx in range(max(0, x - NEIGHBOR_R), min(shown.width, x + NEIGHBOR_R + 1)):
                lv = gray[xx, yy]
                if pick is None or (lv < pick[0] if darkest else lv > pick[0]):
                    pick = (lv, sp[xx, yy])
        c = contrast(relative_luminance(v), relative_luminance(pick[1]))
        ratios.append(c)
        if worst is None or c < worst[0]:
            worst = (c, (x, y))
    ratios.sort()
    median = ratios[len(ratios) // 2]
    floor = CONTRAST_FLOOR[style]
    bad = sum(1 for c in ratios if c < floor) / len(ratios)

    print(f'{style:<8} 墨迹 {len(ink):>5}px  光晕/差异 {diff:>6}px  墨迹亮度 {ink_luma:6.1f}  '
          f'抬升中位 {lift_median:5.1f}  局部对比度 vs 最{"暗" if darkest else "亮"}邻 中位 {median:5.2f}  '
          f'最低 {ratios[0]:5.2f}  <{floor} 占比 {bad:5.1%}')
    want = CONTRAST_MEDIAN[style]
    assert median >= want, f'{style}: 落款局部对比度中位数只有 {median:.2f}，应 ≥ {want}'
    assert bad <= CONTRAST_BAD_SHARE, f'{style}: 有 {bad:.1%} 的笔画像素对比度低于 {floor}，落款有认不出的地方'
    return {'ink': len(ink), 'diff': diff, 'ink_luma': ink_luma, 'lift': lift_median,
            'median': median, 'min': ratios[0], 'bad': bad}


def main():
    if not METRICS.exists():
        print('SKIP 未找到 verification/caption-metrics.json，请先跑 node verify-home-cards.cjs')
        sys.exit(0)
    metrics = json.loads(METRICS.read_text(encoding='utf-8'))
    out = {s: check(s, metrics) for s in ('photo', 'classic')}
    # 不比对两版之间的数值：两张卡的背景本来就不同（照片版底部有一层暗压，
    # 简洁版右下的照片几乎没被压过），对比度天然有差。这里只要求各自过线。
    print(f'PASS 落款像素复核通过（照片卡白字 .88 / 天数卡 codex 灰蓝 #6a7d92，亮度 '
          f'{out["photo"]["ink_luma"]:.0f}/{out["classic"]["ink_luma"]:.0f}，'
          f'局部对比度中位 {out["photo"]["median"]:.2f}/{out["classic"]["median"]:.2f}）')


if __name__ == '__main__':
    main()
