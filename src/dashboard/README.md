# 编号工作流演示大屏

对外名称：四达传媒智能编单系统。版本：v0.2演示版。频道、任务、耗时和接收结果均为虚构；没有真实Agent、Playbox或现场文件接入。

## 本机查看

从仓库根目录启动：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory src/dashboard/dist
```

打开 http://127.0.0.1:8765/ 。默认浅色、明天的播出准备；可切换深浅背景、暂停动效、停止日期自动切换。服务只绑定本机，预览需要时保留；不再需要时在启动终端Ctrl+C停止，不安装常驻服务。

使用 `?theme=dark` 可指定深色，`?channels=40` 用于未来容量验证。默认每个播出日期20频道，工作流6节点各有完整001—020，底部给出频道名称。40频道使用同一结构，编号延伸至040。

页面为1920×1080逻辑画布，使用HTML和SVG，在3840×2160视口按2倍呈现，非PNG拉伸；其他尺寸按16:9等比适配。实际远距可读性仍须现场大屏确认。

## 本轮选定体验

- 汇总、今天、明天、后天四个标签；汇总仅占位、禁用且不参与轮播，其他三页按播出日期归组，每30秒自动切换，默认明天。
- 顶部紧凑，六节点横向，编号竖向整齐、横向错位。节点内部没有线；仅跨相邻节点连接同一编号，没有箭头。
- C双环留白：未用灰色，正确通过绿圈灰心，告警通过橙圈灰心，回退故障红圈灰心，处理中彩色微闪，当前故障红圈红心。
- 处理色使用蓝、紫、青蓝，与绿／橙／红结果色分开。微闪周期2.6秒，故障约0.68秒，数字不跟随闪烁。
- 单点沿线：正在处理向前，回退反向，故障停留不流动。已完成线路保留为淡绿色静态线；正在运行的线和光点跟随频道图例色，故障／回退为红色。Agent图标仅在任务状态为实际running时轻微闪烁（2.8秒一轮），空闲、等待、回退途中及故障停留不触发。减少动态与暂停动效保留完整状态含义。
- 历史通过环保留，当前任务最多一个正在处理的槽位；节点故障与已回退故障分别记录。此六态替代早期图稿中离开槽位后一律灰白的草案。
- 只有明确的Playbox接收事件才算完成；Output生成与编单员接手独立。回读对比不影响交付状态。

模拟记录每8秒推进一次；刷新重新建立样例。初始明天有6份已接收，并展示未用、通过、告警、处理中、故障与回退样例。演示不会在没有恢复事件时静默清除当前故障。跨午夜保留已有任务记录；主画面只展示当日及未来两日，旧未完成任务保留在模型中，不声称已有汇总页可查看。

## 检查

```sh
node --check src/dashboard/dist/app.js
node --check src/dashboard/dist/model.js
node --test tests/dashboard-model.test.cjs
python3 scripts/check_repository.py
```

模型检查覆盖日期、编号、六态、回退、接收证据、反馈分母、跨日保留与40频道。浏览器检查节点唯一性、同编号线路端点、颜色动效、日期切换及4K布局。检查通过不代表真实Agent或现场验收。

纯静态资产无需安装依赖。Sites静态清单在 `.openai/hosting.json`；当前连接器不可用，尚未在线发布，不虚构站点编号。

## 标识来源

- 公司 Logo 来自 [StarTimes 官方网站](https://www.startimes.com.cn/)，使用首页引用的 [原始 PNG](https://www.startimes.com.cn/wp-content/themes/startimes/assets/images/ST-logo.png)，未重绘或改变品牌。
- 系统 Logo：内置 imagegen 生成，保存于 [jinshu-mark.png](dist/assets/jinshu-mark.png)。提示词：Create one original compact corporate software logo symbol for 锦书, an intelligent broadcast playlist scheduling system. Abstract open book made of three neatly interwoven ribbon-like programme strips, representing brocade, careful composition and reliable handover. Flat vector-like bold geometry, medium cobalt blue with small amber accent, transparent alpha background, square centered symbol only, clear at 32px. No letters, no wordmark, no mockup, no glow, no shadows, no gradients, no robot, no circuit decoration. Do not reproduce StarTimes logo.

两份标识均随页面保存在本地，运行时不请求外部图片或字体。
