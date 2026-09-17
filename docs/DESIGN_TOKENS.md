# 设计令牌（Design Tokens）

`tokens.css` 是全站唯一的取值来源。改一个变量，全站跟着变；组件里不许再写死颜色和随意像素。

## 一、取值从哪来

**每一个数字都是从已通过验收的首页量出来的，不是设计的。**

量法：`.workbuddy/probe-home.cjs`（Playwright 取 computed style，跑一次输出 30 多个元素的实际取值）。
所以「首页什么样，令牌就是什么样」——其它页面向令牌对齐，就是向首页对齐。

这么做是因为：首页已经验收过了，把它作为基准去反推规范，比另起一套设计稿要靠谱——
后者一定会和已验收的东西打架，然后又得回头改首页。

## 二、为什么会有这份文件

本轮之前，项目里同时存在**五套**变量体系：

| 来源 | 例子 | 问题 |
| --- | --- | --- |
| `life.css`（codex 原版） | `--blue` `--ink` `--muted` | `--muted` 被后面的层覆盖成另一个值 |
| `life.css` 尾部 | `--radius-md:18px` `--radius-lg:23px` `--content-max` | 第五套半径，写在后面会把令牌盖掉 |
| `experience.css` | `--type-*` `--space-*` `--radius-*` | 与首页实测值对不上（`--shadow-card` 是 `0 4px 16px`，首页是 `0 2px 10px`） |
| `experience.css` 末尾 "Final token lock" | `--color-brand:#4a90e2` `--color-bg:#f7fafd` `--space-page:16px` | **第四套完整配色**，因为写在最后会盖掉一切 |
| `prototype.css` | `--pro-*` | 与上面几套并存 |

结果是「首页一个样、其它页一个样」。最典型的三处：

- 统计数字：`22/28`、`20/27`、`26/34`、`46/52` 四种字号，来自四个不同页面；
- 卡片圆角：名义 16px，实际量出来 18px（被 `life.css` 尾部那套盖住）；
- 品牌蓝：`#3286ee` 与 `#3a8cf7` 两版并存，另加一个 `#4a90e2`。

现在：旧名字全部保留为**指向新令牌的别名**（见 `tokens.css` 末段），所以调用点不用改；
但取值统一由令牌决定，改一处即可全站生效。

## 三、令牌清单

### 颜色

```
品牌     --color-brand / -bright / -deep / -wash / -wash-2
中性     --color-ink-1…5（1 最深 5 最浅）、--color-canvas、--color-surface、--color-surface-2
线条     --color-line、--color-line-soft
反色面   --color-on-dark / -faint / -soft / -signature / -strong
语义     --color-star（评分）--color-heart（收藏）--color-heart-off（未收藏）
         --color-success / --color-danger / --color-focus
玻璃     --color-glass / -soft / -solid（压在照片上的浅色底）
遮罩     --scrim-strong / -mid / -deep（照片底部压暗用）
分类     --cat-place / -food / -movie / -number / -wish / -done（各带 -wash、-surface）
         --cat-rating、--cat-danger
```

**两个品牌蓝并存是有意的**：`--color-brand`（`#3286ee`）是 codex 原版，用在 logo；
`--color-brand-bright`（`#3a8cf7`）是原型图那版，用在按钮和选中态。
两者只差 8/6/9，单看几乎一样，但混用会让品牌色显得"飘"，所以分开锁死，不要互相替换。

### 字体

```
--font-ui          PingFang SC 等系统字体栈
--font-signature   Georgia 衬线（落款签名，与侧边栏 .aside-script 同一语言）

--text-display   46/52  首页大数字        --text-card       15/23  卡片标题
--text-title     34/42  页面大标题        --text-body       14/23  正文
--text-brand     28/28  logo "+1"        --text-strong     14/20  强调正文
--text-heading   26/34  年份/分组标题     --text-secondary  13/20  次级
--text-stat      22/28  统计数字(3列)     --text-meta       12/19  元信息
--text-stat-sm   20/27  统计数字(4列)     --text-micro      11/16  最小字
--text-section   20/28  区块标题 h2       --text-signature  italic 600 12/20 落款
```

`--text-stat` 与 `--text-stat-sm` 不是两套字号：4 列时格子只有约 82px，22px 的四位数会顶到边，
所以退一档。这是同一档的窄版。

### 间距 / 圆角 / 阴影

```
--space-half 2  --space-1 4  --space-2 8  --space-3 12  --space-4 16
--space-5 20  --space-6 24  --space-8 32  --space-10 40  --space-12 48

--radius-sm 13  --radius-md 16  --radius-lg 20  --radius-pill 999
--radius-sheet 29（弹层顶部两角，比卡片大一档，是有意的区别）  --radius-full 50%

--shadow-hairline  0 2px 8px  rgba(43,86,135,.04)   贴地：小控件、下拉
--shadow-card      0 2px 10px rgba(43,86,135,.06)   卡片常态
--shadow-raised    0 8px 22px rgba(43,86,135,.1)    抬起：页眉、浮层
--shadow-brand     0 8px 22px rgba(59,136,215,.17)  主按钮光晕
--shadow-shell / --shadow-scrim
```

阴影统一用同一个色，只调模糊与透明度。本产品底色很浅，**阴影一重就显得脏** ——
卡片常态那一档要"几乎看不见"。

### 动效 / 层级 / 尺寸

```
--ease-out（全站统一曲线，页眉收拢用的那条）
--dur-fast .18s  --dur-base .28s  --dur-slow .34s
--z-caption 2  --z-header 4  --z-nav 5  --z-overlay 10  --z-toast 20
--tap-min 44  --control-height 52  --nav-height 82  --nav-clear 108
--layout-page-pad 20  --layout-width 460  --layout-gap 12
```

## 四、使用规约

1. **组件里不写死取值**。颜色一律 `var(--color-*)`，字号一律 `var(--text-*)`，
   间距一律 `var(--space-*)`，圆角一律 `var(--radius-*)`，阴影一律 `var(--shadow-*)`。
2. **不要为一次性需求加令牌**。先在现有档位里找最接近的；真的缺一档，先确认它会在第二处用到。
3. **不要替换两个品牌蓝**，理由见上。
4. **旧变量名（`--pro-*`、`--blue`、`--type-*`…）是过渡别名**，新代码别用；
   等调用点清完，`tokens.css` 末段整体删掉。
5. **改令牌之后跑 `node verify-tokens.cjs`**，它会告诉你哪个页面掉了队。

## 五、守卫

`node verify-tokens.cjs` 查四件事：

1. `tokens.css` 是否真的加载（**样式表 404 是静默失效**，页面照常渲染、变量全空）；
2. 42 个关键令牌能否解析出值；旧变量别名是否指对（`--pro-canvas` 必须是 `rgb(238,244,253)`）；
3. 7 个路由上「统计数字 / chip / 卡片」的取值是否一致、是否落在令牌档位内；
4. 页面实际渲染出的颜色有没有令牌色板之外的。

白名单目前是**空的** —— 页面上出现的每种颜色都已在 `tokens.css` 登记。
想加新颜色要先问自己是不是真的需要，而不是顺手写个值。

## 六、本轮实测

| 项目 | 令牌化之前 | 现在 |
| --- | --- | --- |
| 变量体系 | 5 套并存 | 1 套令牌 + 过渡别名 |
| 硬编码色值（`prototype.css`） | 25 处 | 0 处（全在 `tokens.css`） |
| 令牌色板 | — | 116 个颜色 |
| 统计数字字号 | 4 种 | 2 种（3 列 / 4 列） |
| 卡片圆角 | 名义 16、实际 18 | 16（`--radius-md`） |
| 野颜色 | 6 项 | 0 项 |
| 首页像素复核 | 落款中位 10.06 / 3.17 | **完全一致**（视觉零变化） |
| 自查 | 8 套 | 9 套全绿 |

## 七、跑法

```bash
node serve.cjs                 # 默认 127.0.0.1:4186
node verify-tokens.cjs         # 令牌守卫
node verify-home-cards.cjs     # 首页卡片（含落款）
node verify-ui.cjs             # 54 组路由×视口
node verify-experience.cjs     # 77 组 + 编辑器
python verify-caption-pixels.py  # 落款像素复核
python verify-header-pixels.py   # 页眉像素复核
```
