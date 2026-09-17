# 一张表：我的渲染 vs 用户截图，用相同阈值量「文字到卡片边缘」的距离（CSS px）
from PIL import Image
S = 1.25
def lum(p): return 0.299*p[0]+0.587*p[1]+0.114*p[2]
WHITE = lambda p: lum(p) > 236 and (max(p)-min(p)) < 26
WASH  = lambda p: lum(p) < 224 or (p[2]-p[0]) > 45

def lines(im, x0, y0, w, h, ink, xa, xb, minh=4):
    out, cur = [], None
    for y in range(y0, min(y0+h, im.height)):
        xs = [x for x in range(x0+xa, min(x0+xb, x0+w)) if ink(im.getpixel((x,y)))]
        if len(xs) >= 3:
            cur = cur or [y,y,min(xs),max(xs)]; cur[1]=y; cur[2]=min(cur[2],min(xs)); cur[3]=max(cur[3],max(xs))
        elif cur:
            if cur[1]-cur[0] >= minh: out.append(cur)
            cur = None
    if cur and cur[1]-cur[0] >= minh: out.append(cur)
    return out

def show(tag, im, x0, y0, w, h, ink, xa, xb, tags):
    got = lines(im, x0, y0, w, h, ink, xa, xb)
    print(f'  {tag}')
    for i, (a,b,mn,mx) in enumerate(got):
        name = tags[i] if i < len(tags) else f'行{i}'
        print(f'     {name:<6} 高{(b-a+1)/S:5.1f} | 距卡片左 {(mn-x0)/S:5.1f}  右 {(x0+w-1-mx)/S:6.1f} | 距卡片上 {(a-y0)/S:5.1f}  下 {(y0+h-1-b)/S:6.1f}')

print('【我的渲染 · deviceScaleFactor 1.25】卡片 475x245 设备px')
p = Image.open('.workbuddy/panel-photo.png').convert('RGB')
show('瞬间卡', p, 25, 122, 475, 245, WHITE, 10, 420, ['首行','数字行','结语'])
c = Image.open('.workbuddy/panel-classic.png').convert('RGB')
show('天数卡', c, 25, 122, 475, 245, WASH, 10, 400, ['首行','数字行','结语'])
print()
print('【用户截图】A 卡片框 x1..475 y6..250 ｜ B 卡片框 x16..490 y1..245')
a = Image.open('C:/Users/13403/AppData/Local/Temp/ScreenShot_2026-09-17_094130_660.png').convert('RGB')
show('A 瞬间卡', a, 1, 6, 475, 245, WHITE, 10, 420, ['首行','数字行','结语'])
b = Image.open('C:/Users/13403/AppData/Local/Temp/ScreenShot_2026-09-17_094221_411.png').convert('RGB')
show('B 天数卡', b, 16, 1, 475, 245, WASH, 10, 400, ['首行','数字行','结语'])
