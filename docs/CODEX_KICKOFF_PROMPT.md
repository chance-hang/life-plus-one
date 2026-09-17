# 开局语（复制粘贴给 Codex）

> 用法：把下面代码块整段粘给 Codex（家用侧）。它会先读交接文档再动手。

```
接着做 life-plus-one 的界面优化。

背景：WorkBuddy（公司侧）已把设计令牌层建好并推到 review-experience-20260916
（远程头 68257b9）。它做的是"收敛"不是"重设计"——五套变量体系合成一套 tokens.css，
首页视觉像素级零变化。所以"其他页面粗糙简陋"只解决了一半：地基平了，还没装修。

先读这两份，再动手：
  1. docs/HANDOFF_TOKENS_TO_CODEX.md   ← 核心交接：硬红线 + 未清干净的残留清单 + 方法论
  2. docs/DESIGN_TOKENS.md             ← 令牌清单 + 使用规约
  3. tokens.css                        ← 唯一取值来源（300 行，带注释）

你的任务：用 tokens.css 的令牌把首页之外的其他页面（timeline / places / wishes /
mine / numbers / first）做得精致、统一。优先改 components.css（跨页组件统一层，
一处改 7 页受益），不要逐页打补丁。

几条必须守的：
- 取值只能写在 tokens.css，其它 CSS 不许出现 --xxx: <具体值>
- 组件里不写死颜色；新增样式文件必须登记进 serve.cjs 的白名单
  （样式表 404 不报错，只静默失效，上一轮就栽在这）
- 不要动首页已验收的视觉（有像素级的回归脚本在守）
- 改完跑 node verify-tokens.cjs + 全套 9 个自查脚本

注意：守卫报"0 野颜色"是假象——它只扫 .page-content/.bottom-nav/.app-header，
首页 hero 装饰区不在内。实际 life.css/experience.css/prototype.css 还有残留，
清单和处理顺序见交接文档第三节。
```

---

## 如果 Codex 只能拿到本地路径

交接文档已在仓库里并推送到远端，两条路都行：

| 方式 | 路径 |
| --- | --- |
| 读本地（同步盘） | `D:\BaiduSyncdisk\Ai_Station\Codex_Git_Project\Life_Plus_One-review\docs\HANDOFF_TOKENS_TO_CODEX.md` |
| 读远端（GitHub） | `chance-hang/life-plus-one` → 分支 `review-experience-20260916` → `docs/HANDOFF_TOKENS_TO_CODEX.md` |

> 注意：家用机若已 clone 该仓库，先 `git fetch origin review-experience-20260916`
> 再切/合并，确保拿到 `68257b9` 这个提交（交接文档在此提交里）。
> 若家用网络正常而公司网络封 `github.com` 主站——反过来不受影响。
