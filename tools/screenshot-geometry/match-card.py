# 粗到细模板匹配：把「我的卡片渲染」对齐到「用户截图」里，反推用户截图中的卡片框
from PIL import Image, ImageChops, ImageStat
import json, sys

S = 1.25
info = json.load(open('.workbuddy/panel-info.json', encoding='utf-8'))
USER = {'photo': 'C:/Users/13403/AppData/Local/Temp/ScreenShot_2026-09-17_094130_660.png',
        'classic': 'C:/Users/13403/AppData/Local/Temp/ScreenShot_2026-09-17_094221_411.png'}

def rms(a, b):
    d = ImageChops.difference(a.convert('L'), b.convert('L'))
    return ImageStat.Stat(d).rms[0]

results = {}
for style, path in USER.items():
    panel = Image.open(f'.workbuddy/panel-{style}.png').convert('RGB')
    c = info[style]['card']
    # 我在面板图里的卡片位置（设备px）：面板 420 CSS 宽 → 截图 525 设备px
    cx, cy = round(c['x'] * S), round(c['y'] * S)
    cw, ch = round(c['w'] * S), round(c['h'] * S)
    tmpl = panel.crop((cx, cy, cx + cw, cy + ch))
    user = Image.open(path).convert('RGB')

    # 粗搜：1/4 缩放，±100 设备px
    k = 4
    t4 = tmpl.resize((cw // k, ch // k), Image.BILINEAR)
    best, bestv = (0, 0), 1e9
    for dy in range(-200, 61, k):
        for dx in range(-150, 61, k):
            if 0 <= cx + dx and 0 <= cy + dy and cx + dx + cw <= user.width and cy + dy + ch <= user.height:
                u4 = user.crop((cx + dx, cy + dy, cx + dx + cw, cy + dy + ch)).resize((cw // k, ch // k), Image.BILINEAR)
                v = rms(t4, u4)
                if v < bestv: bestv, best = v, (dx, dy)
    # 细搜：原尺度 ±6px
    fx, fy = best
    for dy in range(fy - 6, fy + 7):
        for dx in range(fx - 6, fx + 7):
            if 0 <= cx + dx and 0 <= cy + dy and cx + dx + cw <= user.width and cy + dy + ch <= user.height:
                u = user.crop((cx + dx, cy + dy, cx + dx + cw, cy + dy + ch))
                v = rms(tmpl, u)
                if v < bestv:
                    bestv, best = v, (dx, dy)
    dx, dy = best
    card = {'x': cx + dx, 'y': cy + dy, 'w': cw, 'h': ch}
    results[style] = {'offset': [dx, dy], 'rms': round(bestv, 2), 'card': card, 'userSize': user.size}
    print(f'{style}: 位移 dx={dx:+d} dy={dy:+d} (rms {bestv:.2f}) → 用户截图里卡片 x {card["x"]}..{card["x"]+cw-1} y {card["y"]}..{card["y"]+ch-1}，图 {user.size}')
json.dump(results, open('.workbuddy/tmatch.json', 'w'), indent=2)
