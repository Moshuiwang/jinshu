# PlayBox 与 Codex 操作路径调研

文档修订：2026-09-10｜版本：v0.4｜公开资料核验仍为 2026-09-08；未在目标设备实测

本轮已收到 Playbox 3 份与大洋 5 份真实日单。两套系统分管不同频道，导入导出验证分别按[验证计划 E17](../planning/02-前期探索与验证计划.md)执行；当前未取得双向客户端验证。资料统一按[交接清单](../planning/03-传媒资料准备清单.md)，已有文件不重复索取。下文公开产品能力为历史调研，不作为现场版本支持证明。

> 后续决定更新：Codex 已从固定载体调整为优先候选。本记录保留当时的调研对象及证据；其他 Agent 的适用性见[载体候选调研](05-Agent载体候选调研.md)。本篇中的 Codex 路线不是排他选型。

> 首轮审核意见已由产品负责人指示纳入：按人工总投入评价路线；样本研究时并行做最小断网验证；补充有效播出时长、必要事件和交接环境访问验证。公开资料的当前核验状态见[核验记录](../../archive/reviews/2026-09-08/外部事实核验记录.md)。

## 1. 调研问题与结论

本轮研究：PlayBox 编单软件的产品构成、PLY 是否可以外部生成、Codex 在 Windows 上的操作能力，以及 Mac 中的 Codex 能否通过浏览器远程桌面操作装有加密狗的 Windows 编单电脑。

初步结论：直接生成 PLY 仍是优先方向；官方资料还提供了批量导入 CSV／文本的线索，应在逐条操作界面之前检查。Mac 经浏览器远程操作 Windows 在架构上成立，但目标软件授权、会话和 Codex 操作稳定性尚未验证。

路线是否成立，要同时看输出正确性、人员确认与审核返工投入、交单时限和离线条件；不以“软件能打开”或操作演示完成作为全部结论。最小断网实验与样本研究并行，最终完整离线验收保留。

本轮未安装软件、未连接目标 Windows、未操作生产系统、未提交厂家支持请求。以下“官方文档支持”不等同于“本公司安装版本已支持”。

## 2. 产品辨识

| 模块 | 文档描述的职责 | 与现场流程的对应 |
|---|---|---|
| ListBox | 提前创建、编辑节目单 | 编单人员查找、添加素材、编排并保存 |
| AirBox | 读取节目单执行播出 | 下游播出，不是本期自动化操作目标 |
| SafeBox | 迁移素材、节目单等内容 | 保存到指定位置后的下游流转 |

依据：[ListBox 手册，S01](https://cdn2.hubspot.net/hubfs/5962653/Manuals/listbox_user_manual.pdf)、[SafeBox 介绍，S04](https://playboxneo.com/automated-media-management)。

公开资料分别来自 PlayBox Technology 与 PlayBox Neo，并跨越多个年份。必须取得现场“关于”页面，确认厂商、模块、精确版本和许可证类型；不能默认两者及各版本完全等同。ListBox 手册提及“关于”页包含模块版本、WIBU Box 编号和授权类型，但这不能确认现场加密狗的具体型号。

## 3. 直接生成 PLY：有外部生成先例，尚无本项目兼容性结论

2026-09-08 样例补充：产品负责人已确认桌面的 `TEST.ply` 为 ListBox 样例、`TEST.xml` 为大洋样例，均是专门生成的研究用节目单。已完成文本和条目对照，尚未完成新生成文件的客户端回读；不能将该 XML 作为 ListBox 的另一种导出格式或互通证据。样例来源、视频读取结果及限制见[台账第 8 节](../planning/07-产品决策与验证台账.md#8-桌面样例的来源与已知结果)。

Etere 官方在线指南的搜索索引描述了 PLAYBOXPLY 导出功能：输出扩展名为 .ply 的文本节目单。它提供外部程序生成 PlayBox 节目单的线索。[S05 原始链接](https://guide.etere.com/Chapter/Index?chapternumber=84.4.4.29)

**证据限制：本次只取得搜索索引内容，尝试打开正文多次失败。**未核对完整导出规范，不把其中字段片段作为本项目实现依据。它也不能证明现场 PLY 一定采用同样格式、编码或版本。

下一步用真实 PLY 与对应 Excel／素材信息解读，生成受控小样本，再由目标 ListBox 读取、保存和重新打开，检查编排语义。能打开文件不等于片目、路径、时长和定时事件正确。

即便直接生成成立，输出中的素材路径仍须采用目标 Windows／播出环境可识别的表示，不能把 Mac 挂载路径写成下游可用路径。路径对应需要现场验证。

### 3.1 需要从样本中补证的时长与事件

ListBox 手册第 9 页说明，列表中的 Duration 显示剪辑后的实际时长；Neo 产品资料列有等待、停止、定时及其他事件。由此需核对现场是否使用剪入／剪出点、分段及非视频条目，区分文件完整时长与节目单有效播出时长。使用的事件必须正确表达和检查，未支持时明确阻止交付。此项不增加自动裁剪正片或视频编辑功能。[S01](https://cdn2.hubspot.net/hubfs/5962653/Manuals/listbox_user_manual.pdf)、[S03](https://playboxneo.com/sites/default/files/2022-12/ListBoxNeo_01_23.pdf)

### 3.2 交接环境验证

建立生成、人工审核与下游约定路径的对应，记录目标软件及配置。试运行前，在隔离测试环境或由播出技术负责人执行的只读检查中，验证同一 PLY 引用的素材可访问且身份一致；不能用生成电脑本机可读替代。手册中缺素材可能被 AirBox 跳过的描述说明该检查有必要，具体行为仍按现场版本确认。[S01，第 9 页](https://cdn2.hubspot.net/hubfs/5962653/Manuals/listbox_user_manual.pdf)

文件报告绑定输出内容与检查时间；v0.5 要求人工改后候选重新独立校验，并取得生产侧最终文件，与原产出和审核候选对比。E12 验证兼容与交接路径，E14—E16 验证来源、独立验收及实际采用；不操作实际播出来证明兼容性。

## 4. 新发现：批量导入可能减少界面操作

ListBox Neo 官方 2018 年及修订标识为 01/23 的产品资料明确列出第三方排播数据导入，支持 CSV、制表符分隔及固定宽度文本。[S02](https://playboxneo.com/sites/default/files/2018-11/ListBoxNeo.pdf)、[S03](https://playboxneo.com/sites/default/files/2022-12/ListBoxNeo_01_23.pdf)

因此提出新增候选：

> Excel＋素材信息 → 技能完成准确匹配与时间编排 → 生成符合导入要求的文件 → ListBox 批量导入 → 保存待审核 PLY。

这是基于产品能力的工程推断，尚未在目标版本验证。原始 Excel 有歧义，仍需处理，不能直接导入就视为编单完成。

需确认菜单入口、字段映射、路径、精确时间、定时事件和导入错误处理是否满足试点要求，也需确认现场授权是否包含该功能。若可用，界面操作可能收敛为导入、核对、保存，不必逐条插入。

## 5. Windows 原生操作：官方有能力，旧环境仍待验证

官方 OpenAI 文档说明，在支持地区，Codex 可在 macOS 和 Windows 使用 Computer Use；Windows 工作在当前活动桌面，需目标程序可见，并占用前台输入。[S06](https://learn.chatgpt.com/docs/computer-use)

同页的 Windows 使用说明要求设备保持解锁与联网。该公开使用方式不能被当成最终封闭内网方案的证明，应在早期核实所需入口和组件的离线运行条件；不能由本地模型配置入口直接推断 Desktop 图形操作也可离线。[S06](https://learn.chatgpt.com/docs/computer-use)

因此不能预设“Windows 不支持”或“Mac 一定更强”。需要检查现场 Windows 版本、安装条件、权限和实际 ListBox 控件表现。该资料未证明现场旧系统满足安装要求，也未证明全部操作能够离线运行。

ListBox 手册列有插入、追加、移动、保存等快捷键。可优先验证菜单与键盘，以减少精细拖拽；具体按键以目标版本为准，不能盲目照用旧手册。[S01，第 12—15 页](https://cdn2.hubspot.net/hubfs/5962653/Manuals/listbox_user_manual.pdf)

## 6. Mac 经浏览器远程桌面操作 Windows

### 6.1 候选架构

```text
Mac 上的 Codex
  → 浏览器中的远程桌面页面
  → 内网远程桌面服务
  → 原 Windows 编单电脑上的 ListBox
  → 保存待审核 PLY

加密狗保持连接原 Windows 电脑；软件也仍在原机运行。
```

候选组件：

- Apache Guacamole：提供浏览器入口，通过服务端连接 RDP／VNC 等远程桌面。[S07 架构](https://guacamole.apache.org/doc/gug/guacamole-architecture.html)、[S08 配置](https://guacamole.apache.org/doc/gug/configuring-guacamole.html)
- noVNC：浏览器 VNC 客户端，通常配合 VNC 服务和 WebSocket 代理。[S09](https://novnc.com/info.html)

按上述架构，可把相关服务部署在局域网内，远程桌面链路不必经过外部中继。Windows 端仍需对应远程服务，具体部署方式尚未选定。这里只论证远程画面和输入传递的架构可能性，不代表 Codex 已实际完成此链路。

### 6.2 加密狗与会话

远程方案保留原机软件和硬件授权，不需要为了 Mac 操作而先迁移加密狗。但这不保证授权在所有远程会话下有效。需实际验证软件能否启动、打开素材、保存文件，以及断开重连后的状态。

要区别共享原有桌面与建立远程登录会话。不能认定 RDP 一定等于原控制台，也不能认定所有 VNC 部署行为一致。Guacamole 文档有 RDP 会话和键盘布局配置说明，但没有证明 PlayBox 加密狗兼容性。Wibu 相关资料只作为后续调查线索，现场许可产品和策略需确认。

### 6.3 图形操作的限制

工程判断：远程桌面在浏览器中主要呈现画面，远端 ListBox 控件不会自动变为普通网页按钮。Codex 可能需要依赖截图和坐标，不能预设可获得 Windows 控件结构。

需要测试画面清晰度、分辨率缩放、窗口焦点、快捷键转发、文件选择框、弹窗、断线重连和保存结果。Mac 平台优势不必然抵消远程链路新增变量。浏览器内拖拽表示操作远端桌面，不应误用为从 Mac 向 Windows 上传文件。

### 6.4 离线模型是另一项约束

内网远程桌面能工作，不证明 Codex Desktop、Computer Use 插件和本地模型能完整离线协同。最终仍须独立验证身份／启动依赖、模型适配、视觉判断和工具执行。CLI 存在本地模型配置入口，也不能替代 Desktop 离线能力验收。

首次最小验证提前到样本研究阶段：用现有或借测条件断网冷启动，调用本地工具，显示并保存一次人员选择，恢复后读回；需要远程图形操作时追加画面、输入与保存验证。至少一条对应拟交付路径的组合通过后再进入工程建设，完整任务离线验收仍在后续进行。

## 7. 建议探索顺序

| 优先级 | 候选路径 | 最小验证 |
|---|---|---|
| 1 | 直接生成 PLY | 一份真实样本解读，新生成文件的实际读取及编排核对 |
| 2 | 批量导入，由 ListBox 保存 | 目标版本导入菜单、字段映射和少量条目导入保存 |
| 3 | Windows 原生 Codex 操作 | 插入、编排、保存与失败停止的完整小流程 |
| 4 | Mac Codex 经浏览器远程操作 | 同一小流程，加上授权、会话与重连检查 |

以上是已采纳的探索顺序，不是部署定选。最小离线验证 E10 与样本研究并行；若现场 Windows 无法安装 Codex，可提前检查远程路径。比较同时记录扫描、匹配、编排、确认、审核及返工投入。所有路径都须证明输出含义正确，试验仅在获准环境和待审核目录开展，按[台账](../planning/07-产品决策与验证台账.md)记录证据与转备选理由。

现场资料一次按交接清单 M01—M07 汇总，包括已收真实日单的配套输入、准确媒体时间及使用区段，两套系统的版本、打开／导入／导出／另存为选项与测试条件；不另列分批索取顺序，不索取联系人或原始视频。远程方案仍需 Windows 获准运行 ListBox，不能替代软件授权。

## 8. 原始来源与读取状态

下列为有保留价值的原始链接；已结合 2026-09-08 首轮审核更新读取状态。资料修订年份与网页抓取日期不是同一概念，目标版本仍未确认。

| 编号 | 来源 | 本次获取状态／适用边界 |
|---|---|---|
| S01 | [PlayBox Technology ListBox 用户手册](https://cdn2.hubspot.net/hubfs/5962653/Manuals/listbox_user_manual.pdf) | PDF 正文读取成功，16 页；含编单、授权信息入口和快捷键；目标版本未确认 |
| S02 | [ListBox Neo 产品说明，2018](https://playboxneo.com/sites/default/files/2018-11/ListBoxNeo.pdf) | 首轮审核取得 PDF 正文，2 页；批量导入描述得到复核；现场版本待验 |
| S03 | [ListBox Neo-20 产品说明，修订 01/23](https://playboxneo.com/sites/default/files/2022-12/ListBoxNeo_01_23.pdf) | PDF 正文读取成功，2 页；明确 CSV／文本导入 |
| S04 | [SafeBox 自动素材管理](https://playboxneo.com/automated-media-management) | 获取到官方页面详细内容；说明模块分工，不作为本期操作范围 |
| S05 | [Etere PLAYBOXPLY 导出指南](https://guide.etere.com/Chapter/Index?chapternumber=84.4.4.29) | 仅搜索索引可读，正文打开失败；外部导出先例线索，不是已核对格式规范 |
| S06 | [OpenAI Computer Use 官方说明](https://learn.chatgpt.com/docs/computer-use) | 正文读取成功；支持平台及 Windows 前台使用限制，不能据此保证离线部署 |
| S07 | [Apache Guacamole 架构](https://guacamole.apache.org/doc/gug/guacamole-architecture.html) | 正文读取成功；浏览器与远程服务架构 |
| S08 | [Apache Guacamole 配置手册](https://guacamole.apache.org/doc/gug/configuring-guacamole.html) | 正文读取成功；RDP／VNC、会话、键盘等配置 |
| S09 | [noVNC 官方介绍与部署入口](https://novnc.com/info.html) | 正文读取成功；浏览器、VNC 服务及代理关系 |
| S10 | [PlayBox Neo 下载申请页](https://playboxneo.com/download) | 正文读取成功；可申请手册／软件并填写授权信息；未提交申请 |
| S11 | [PlayBox Neo 技术支持](https://playboxneo.com/support) | 获取到官方页面详细内容；后续咨询渠道，未联系厂家 |
| S12 | [PlayBox Technology AirBox 手册入口](https://playboxtechnology.com/download/playbox-technology-airbox-user-manual/) | 页面可读，手册下载要求登录；未取得该入口的手册正文 |
| S13 | [OpenAI Windows 桌面说明](https://learn.chatgpt.com/zh-Hans/docs/windows/windows-app) | 页面读取成功；本轮未取得现场旧 Windows 适配结论 |
| S14 | [OpenAI 更新记录](https://learn.chatgpt.com/docs/changelog) | Web 页面可读，专用文档读取入口失败；最终能力结论优先依据 S06 |
| S15 | [Wibu CodeMeter Networking FAQ](https://www.wibu.com.cn/cn/技术支持/faq/codemeter-networking.html) | 页面可访问，未核定现场加密狗与授权条件；仅后续线索 |
| S16 | [Wibu 虚拟环境白皮书旧链接](https://cdn.wibu.com/fileadmin/wibu_downloads/White_Papers/CodeMeter_in_virtual_environments/CodeMeter_in_virtual_Environments_web_Final.pdf) | 搜索有索引，正文返回 404；不得作为已读取证据 |

没有取得完整、适配现场版本的 PLY 格式规范；没有证据表明现场软件一定支持 XML、特定 API 或无界面调用。公开资料中的这些可能方向不写成已具备能力。


## 9. v0.5 对三条路径的共同要求

直接生成、批量导入和图形操作都须使用可核验的执行版本，并保留原产出、审核候选和生产侧取证文件。客户端保存可能改变编号、编码或路径表示，应通过目标版本样例确认哪些是非业务变化，不能一律计为人工纠错。图形操作链路还要保存实际使用的工具与操作组件版本，不能只标记 Skill 名称。方案细节以产品需求第 12 节为准，当前均待实现验证。
