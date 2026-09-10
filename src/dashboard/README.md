# 编单工作流演示大屏

对外名称：四达传媒智能编单系统。版本：v0.1 演示版。全部频道名、任务、耗时、接收与对比结果均为虚构，不能用于判断真实运行状态。

## 本机查看

从仓库根目录启动：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory src/dashboard/dist
```

浏览器打开 http://127.0.0.1:8765/ 。顶部按钮切换深浅主题并记住本机偏好，也可使用 `?theme=light` 或 `?theme=dark`。关闭启动终端中的服务（Ctrl+C）即可停止预览；不安装常驻服务。

默认是 20 个虚构频道、24 份今日任务与 2 份遗留。`?channels=40` 用于未来容量验证，不作为日常操作入口。单屏按 16:9 等比适配，20 频道基准 1920×1080，40 频道使用相同结构的 2560×1440 画布；窄预览窗会缩小整屏。正式观看应使用匹配比例的大屏，远距可读性仍须实际屏幕确认。

## 行为与边界

- 任务状态保存在当前页面的模拟记录中，每 12 秒产生一次模拟事件，节点及统计读取同一份记录；刷新页面会重新建立演示场景。
- 主线为 EPG 接收、素材匹配、智能编排、检查产出、编单员和 Playbox；流转时下一节点及到达任务高亮。回读／对比是独立优化旁支。
- 工作日期与播出日期分离；同频道多单、跨午夜遗留、提前 24 小时截止和接收完成判定由 `model.js` 统一处理。
- 今日状态数相加等于今日任务数；遗留单独计数。未回读不当作无差异，对比不反向改变交付状态。
- 系统耗时截至 Output，不包含编单员处理或最终接收等待。进度条仅表示所处阶段，不是完成工作量的精确百分比。
- 未接入真实 Agent、EPG、服务器、Playbox 或最终执行文件；没有生产写入、声音、业务操作或持续监控服务。

## 验证与发布

```sh
node --check src/dashboard/dist/app.js
node --check src/dashboard/dist/model.js
node --test tests/dashboard-model.test.cjs
python3 scripts/check_repository.py
```

`dist/` 是手工维护、受版本控制的纯静态资产，无需依赖安装或构建。Sites 的静态清单位于 `.openai/hosting.json`；只有在可用的 Sites 连接器实际注册并发布后，才能记录站点编号与在线地址，不填造值。仓库 CI 执行同一份模型测试；浏览器验证和实际大屏验收分别记录在工作项。

## 标识来源

- 公司 Logo 来自 [StarTimes 官方网站](https://www.startimes.com.cn/)，使用首页引用的 [原始 PNG](https://www.startimes.com.cn/wp-content/themes/startimes/assets/images/ST-logo.png)，未重绘或改变品牌。
- 系统 Logo：内置 imagegen 生成，保存于 [jinshu-mark.png](dist/assets/jinshu-mark.png)。提示词：Create one original compact corporate software logo symbol for 锦书, an intelligent broadcast playlist scheduling system. Abstract open book made of three neatly interwoven ribbon-like programme strips, representing brocade, careful composition and reliable handover. Flat vector-like bold geometry, medium cobalt blue with small amber accent, transparent alpha background, square centered symbol only, clear at 32px. No letters, no wordmark, no mockup, no glow, no shadows, no gradients, no robot, no circuit decoration. Do not reproduce StarTimes logo.

两份标识均随页面保存在本地，运行时不请求外部图片或字体。
