"""页眉像素级复核：滚动后，页眉带里除胶囊本身以外的区域必须仍是页面底色。

用法：先跑 `node verify-header.cjs`（会生成三档截图与 verification/header-metrics.json），
     再 python verify-header-pixels.py

采样区：两胶囊之间的横向间隙（左右各让开 30px 避开胶囊投影）× 从页眉顶端到胶囊下沿。
断言两组：
  A. 开启遮罩时 —— 采样区整片仍是页面底色，说明内容没有从页眉透出；
  B. 关掉遮罩的对照组 —— 同一片区域明显不是底色，说明内容确实从下面滚过。
A 与 B 同时成立，才说明「遮罩真的在挡内容」，而不是恰好那里什么都没有。
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
CANVAS = (238, 244, 253)
SHADOW_KEEPOUT = 30          # 避开胶囊投影的横向安全距离
TOLERANCE = 8                # 与底色的允许色差
CONTRAST_DELTA = 12          # 对照组里算作「明显不是底色」的色差
CONTRAST_RATIO = 0.2         # 对照区至少有这么大比例不是底色


def deviation(px):
    return max(abs(px[i] - CANVAS[i]) for i in range(3))


def band(stuck):
    brand = stuck['brand']['box']
    tools = stuck['tools']['box']
    head = stuck['header']['box']
    left = brand[0] + brand[2] + SHADOW_KEEPOUT
    right = tools[0] - SHADOW_KEEPOUT
    top = head[1]
    bottom = brand[1] + brand[3] - 2
    if right - left < 12 or bottom - top < 12:
        raise AssertionError(f'采样区太小，无法判定：{(left, top, right, bottom)}')
    return left, top, right, bottom


def scan(pixels, box):
    left, top, right, bottom = box
    total = off = 0
    worst = (0, None)
    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            total += 1
            d = deviation(pixels[x, y])
            if d > TOLERANCE:
                off += 1
            if d > worst[0]:
                worst = (d, (x, y, pixels[x, y]))
    return total, off, worst


def main():
    metrics_path = ROOT / 'verification' / 'header-metrics.json'
    if not metrics_path.exists():
        raise SystemExit('缺少 verification/header-metrics.json，请先运行 node verify-header.cjs')
    metrics = json.loads(metrics_path.read_text(encoding='utf-8'))

    for tag, states in metrics.items():
        box = band(states['stuck'])
        masked = Image.open(ROOT / 'verification' / f'header-{tag}-scrolled.png').convert('RGB').load()
        control = Image.open(ROOT / 'verification' / f'header-{tag}-nomask.png').convert('RGB').load()

        total, off, worst = scan(masked, box)
        if off:
            raise AssertionError(f'{tag} 有内容透过页眉：{box} 里 {total} 个采样点中有 {off} 个不是底色，最差 {worst}')

        c_total, c_off, _ = scan(control, box)
        if c_off / c_total < CONTRAST_RATIO:
            raise AssertionError(
                f'{tag} 对照区只有 {c_off}/{c_total} 个像素不是底色，说明该处本来就没有内容滚过，'
                f'这条像素断言没有实际约束力，请换个滚动位置再测')

        print(f'{tag}  遮罩开：{total} 像素全部等于底色 rgb{CANVAS}；'
              f'遮罩关（对照）：{c_off}/{c_total} 像素被内容顶出来')

    print('PASS 页眉像素复核通过（滚动内容未透过页眉，且对照组证明内容确实在下面）')


if __name__ == '__main__':
    main()
