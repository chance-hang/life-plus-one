# +1 体验系统与扩展说明

沿用天蓝、湖景、生活照片。`experience.css` 是语义 token 与组件校准层；`life.css` 保留既有封面、素材裁切和响应式壳体。外部字体与新依赖均为零。

- 字体：PingFang SC / HarmonyOS Sans SC / Apple system / Segoe UI / Microsoft YaHei / sans-serif。
- Typography：display 36/43、hero 26/35、page 24/32、section 18/26、card 16/23、body 14/21、secondary 13/20、metadata 12/18、nav 11/16；数据等宽数字。
- Spacing：4、8、12、16、20、24、32、40、48；页面16，桌面内容460。
- Radius：compact12、card14、hero18、pill999；浅色边框优先。
- Input：52px高；文本标签、轻分割线，更多信息折叠。
- Navigation：首页/足迹/+记录/时间轴/我的；82px基准、底部safe-area、48px新增图标。
- 图片：旧 `photo` 兼容；`media: [{type:'image',src,alt}]` 支持最多3图；大图仅在详情/预览加载。

## 代码边界

`life.js`：基础数据读取/持久化、既有壳体、路由、图标、首页、城市与时间分组。
`experience.js`：统一记录/愿望编辑器、媒体读入、详情、状态反馈、配置化统计。被替代的旧编辑器/CRUD主体已移除。

扩展入口：
- `RecordTypes`：名称、提示和评分字段能力；新增类型同时向 `kinds` / `labels` 注册首页/类型入口文案。
- `Media`：媒体兼容与验证；后续媒体类型在此扩展，不复制各分类CRUD。
- `Stats`：标签/计算器/目标页面/说明四元组。
- `details`：统一Detail Shell；按记录类型扩展其内容，复用头部、媒体、操作栏。
- `results`：关键词/年份/分类/城市/排序管道；后续标签/评分筛选在此添加。
- `groupedRecords`：年/月分组，新的记录类型自动进入时间轴。
- 愿望：`recordId` / `wishId` / `completedAt`；删除愿望保留记录与 `wishSnapshot`，删除记录重算愿望状态。
- 保存旧记录时先展开原对象，保留未识别字段及原ID/创建时间；新增更新时间。

年度报告、分享卡片、地图坐标聚合只保留接口方向；未增加虚假地图、云端服务或迁移Prod数据。

## 验收数据隔离

固定键 `life-plus-one-review-experience-v1`；不读取任何Prod旧键，不通过URL参数切换到Prod。
读取异常阻止保存并允许导出原始内容；保存失败保留编辑器；未保存关闭二次确认。
无账号、网络API、远端数据写入或正式部署配置。本分支不能直接作为Prod发布版本。

## 测试

`node serve.cjs`（默认127.0.0.1:4186）后运行 `node verify-experience.cjs`。
可用 `PLAYWRIGHT_PATH` / `BROWSER_PATH` / `REVIEW_URL` 环境变量覆盖本机测试依赖。
旧 `verify.cjs` / `verify-ui.cjs` 是基线历史测试，本版以 `verify-experience.cjs` 为准。
截图在 `verification/experience/`，测试只使用临时浏览器上下文。
