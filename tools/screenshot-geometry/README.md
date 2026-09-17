# 截图几何核对工具

用途：用户发来截图说「位置不对 / 距离不一致 / 看着歪」时，**不靠肉眼**把距离量出来。
背景：这个项目已经出现过两次「量着对、看着不对」——页眉胶囊、首页卡片落款。
根因都是「元素的盒子几何」和「用户看到的墨迹几何」不是一回事（旋转、自带边距、行内盒子）。

## 步骤

```bash
# 0. 先起本地服务（默认 4186，工具里按 4173 写，二选一都行）
node serve.cjs

# 1. 以用户截图的同比例渲染两种卡片，并记录卡片在各面板图里的位置
#    → 产出 .workbuddy/panel-{photo,classic}.png 与 .workbuddy/panel-info.json
node tools/screenshot-geometry/render-125.cjs

# 2. 把「我的渲染」模板匹配到「用户截图」上，反推用户截图里的卡片框
#    改 USER 里的路径为用户的截图；输出 .workbuddy/tmatch.json
C:/Users/13403/.workbuddy/binaries/python/envs/default/Scripts/python.exe tools/screenshot-geometry/match-card.py

# 3. 按卡片框逐像素量每行文字到卡片四边的距离（换算成 CSS px）
C:/Users/13403/.workbuddy/binaries/python/envs/default/Scripts/python.exe tools/screenshot-geometry/measure.py

# 4. 出图：把卡片裁出来叠对比 + 画 20px 内边距基准线
node tools/screenshot-geometry/annotate.cjs
```

Python 只用 PIL（本机没有 numpy）；Node 侧走 Codex 运行时里的 playwright。

## 已踩过的坑

- **Blobs 里的图看不了**：`~/.workbuddy/blobs/**` 的图按内容去重，Read 会说
  "Same image content as previously loaded"。用户截图的原件在
  `C:\Users\13403\AppData\Local\Temp\ScreenShot_*.png`，去那里读。
- **跨截图比绝对像素是无效的**：两张截图的裁剪范围与比例都可能不同。
  只有「同一张图内部的比值」或「换算成 CSS px 后」才可比。
  所以必须先反推卡片框（步骤 2），不能直接拿图左上角当原点。
- **模板匹配会被平滑区域带偏**：卡片四周是渐变或纯色时，纵向能差 3~4 设备px。
  用「同一卡片内部多行文字的相对位置」反校（正文三行的距左/距上应逐项相同）。
- **`transform` 不参与布局**：给元素写了 `rotate`，量未旋转的盒子会漏掉
  `宽度 × sinθ` 的下沉。要么在量之前临时把 `transform` 清掉（盒子几何），
  要么按 `transform-origin` 真的把四个角转一遍（看得到的几何）——**两个都要量**。
- **行内元素（`<span>`）的右边距没有意义**：盒子宽度跟着文字走，
  第一行这种行内盒子只能比 `left / top`。
