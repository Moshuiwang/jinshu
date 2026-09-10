# Codex 主界面与严格业务流程调研

核查日期：2026-09-10。范围：官方文档、公开仓库元数据、指定提交的相关源码及测试文件。未安装或执行第三方项目，未运行模型对照实验；源码阅读为作者自审。工作项：[Issue #17](https://github.com/Moshuiwang/jinshu/issues/17)。

## 1. 已确定什么，本轮回答什么

产品负责人已确定 Codex 为工作人员主要界面，Skill／Plugin 承载业务协作与配套工具。大屏保持只读，人员仍在 Playbox 审核、修改和执行。必需步骤缺失、失败或无法确认时，任务保持未完成，不能产生正常交付。现行要求见[产品需求 4.0](../product/01-产品需求文档.md#40-工作入口与流程完整性已确认待实现验证)、台账 D17／D18。

本轮研究“怎样做到严格”，不重新比较工作人员入口，不以 Windows 或部署条件争论替代流程研究。以下第三方项目只作机制参考，未批准安装、整体引入或作为锦书生产依赖。

结论：现成 Agent App 可以继续作为操作入口。被调查项目采用的机制从流程提示、文件交接、执行拦截，逐步扩展到程序化状态流转和持久恢复。提示词完整、声明 mandatory、拥有高星数或提供固定 JSON，均不能单独证明业务流程完整。锦书应验证的是“必经步骤有实际结果、结果属于当前版本、缺条件不能正常交付”。

## 2. 官方机制的实际边界

| 官方能力 | 已核对的行为 | 对锦书的含义 |
|---|---|---|
| Skill | 可自动匹配或明确调用，包含流程、模板和工具；官方要求用真实请求试验并改进遗漏与格式偏移 | 固定调用入口和交接格式有价值；不会自动把文字步骤变成不可跳过的程序 |
| Plugin | 可以打包 Skill、MCP 服务与生命周期 Hooks | 可作为锦书能力的安装单位；严谨程度取决于其中工具、状态与检查的实现 |
| Codex PreToolUse | 能阻止支持范围内的工具调用，或改写参数 | 可提前发现不合规调用，属于辅助拦截 |
| Codex PostToolUse／Stop | 前者在工具执行后提供反馈；后者可追加继续工作的提示 | 已发生的操作不能靠事后反馈撤销；继续对话不等于保证任务成功 |
| Codex Hook 覆盖与失败 | 官方说明部分工具路径不覆盖，现有交互进程的后续输入不重新触发 PreToolUse；MCP Hook 的服务缺失、工具不可用或错误不会阻止原操作 | 不应把 Hook 设为唯一交付约束；实际业务工具也要自行检查前置条件，检查故障时拒绝交付 |
| Claude Code Hooks（参照） | 官方把事件触发的命令执行与模型判断区分；也说明事后 Hook 无法撤销操作、Stop 不在用户中断时触发 | 可以借鉴事件驱动的检查方式；不同宿主的事件和失败语义必须分别验证 |

来源：[Skills & Plugins](https://learn.chatgpt.com/docs/skills-and-plugins)、[Plugins](https://learn.chatgpt.com/docs/plugins)、[Codex 工具覆盖](https://learn.chatgpt.com/docs/hooks#tool-coverage)、[MCP Hook 失败语义](https://learn.chatgpt.com/docs/hooks#mcp-tool-hooks)、[Stop](https://learn.chatgpt.com/docs/hooks#stop)、[Claude Code Hooks](https://code.claude.com/docs/en/hooks-guide)。这些是核查时的文档能力，不证明当前锦书环境已配置或覆盖对应路径。

## 3. 高星项目与相关机制项目

星数来自本轮 GitHub REST API 的 `stargazers_count`，为 2026-09-10 分别查询的快照，非长期排名。前四项为万星级项目；后两项因恢复机制和业务相关性补充，明确不借用其他仓库的星数。软件研发项目作为跨领域流程参考，不冒称已经用于电视编单。

| 项目 | 星数 | 类型与当前状态 | 本轮查看的关键内容 |
|---|---:|---|---|
| [Superpowers](https://github.com/obra/superpowers) | 284,416 | 面向 Agent 的 Skill／插件流程，未归档 | 启动注入、完成前核验、Skill 行为测试 |
| [GSD 旧版](https://github.com/gsd-build/get-shit-done) | 64,565 | 提示与工具结合的研发流程，**已归档** | 阶段执行、文件状态恢复、产物检查辅助函数 |
| [BMad Method](https://github.com/bmad-code-org/BMAD-METHOD) | 52,852 | Agent 研发工作方法，未归档 | 单任务执行、按状态恢复、审核与终态输出 |
| [LangGraph](https://github.com/langchain-ai/langgraph) | 41,382 | 可在 Agent 背后使用的流程框架，未归档；不是桌面 App | 显式流程、持久检查点、人工中断与恢复 |
| [Lobster](https://github.com/openclaw/lobster) | 1,263 | Agent 可调用的流程执行工具，未归档 | 固定多步流水线、业务输入／确认、恢复标识 |
| [GSD Pi](https://github.com/open-gsd/gsd-pi) | 1,216 | 具有执行状态与核验能力的 Agent 运行环境，未归档 | 数据库状态、执行尝试与核验结果绑定 |

### Superpowers：先把 Agent 的工作习惯做扎实

它用启动 Hook 注入技能使用指引，用完成前核验 Skill 要求先取得新证据，再报告完成。其 Skill 编写文档要求通过压力场景观察漏步，并明确建议把可机械校验的约束自动化。适合借鉴业务指引、简洁交接与压力测试方法。

**源码判断：**本轮读取的通用 `hooks/hooks.json` 只有 SessionStart 入口，`session-start` 的实际工作是注入上下文；这不是每一步的执行许可证。其他宿主扩展未全面审计，不据此断言项目所有路径都只有提示词。

依据：[启动配置](https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/hooks/hooks.json)、[启动脚本](https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/hooks/session-start)、[完成前核验](https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/verification-before-completion/SKILL.md)、[Skill 测试方法](https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/writing-skills/SKILL.md)。

### GSD：把任务进度从聊天中取出来，但要检查“通过”的真实含义

旧版通过阶段计划、状态文件和交接记录恢复工作，配有程序化检查。恢复流程读取状态并寻找没有总结的计划及中断记录，适合借鉴“回来就知道停在哪里”。

**源码判断：**`cmdVerifySummary` 会抽查文件、读取自检文字；其通过表达式允许 `self_check` 为 `not_found`，并没有把所有诊断项都纳入通过条件。这说明“有验证工具”仍须逐项看通过规则。这里只判断该辅助函数，不推定整个 GSD 没有其他检查。

依据：[恢复指引](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/get-shit-done/workflows/resume-project.md)、[verify.cjs](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/get-shit-done/bin/lib/verify.cjs#L15)。旧版已经归档；另查的 [GSD 2 原仓库](https://github.com/gsd-build/gsd-2)声明后续开发移至 GSD Pi，不将不同仓库热度或版本混为一体。

### BMad：任务状态、产物和交接约定比一段聊天更明确

官方 `bmad-build-auto` 定义单次任务从澄清到计划、实现、审核及终态写回；按已有状态恢复，无法继续时输出阻塞。可选调度器按清单顺序派发，官方明确它不会推导依赖图。

**源码判断：**读取的 `workflow.md` 和审核步骤仍以 Agent 遵循指令、写回文件为主。状态格式便于外部程序检查，但不能独自证明状态真实或不可修改。锦书可借鉴明确的阶段与交接，不照搬研发多代理分工或自动修复策略。

依据：[官方自主执行说明](https://docs.bmad-method.org/build/autonomous-development-loops/)、[流程指引](https://github.com/bmad-code-org/BMAD-METHOD/blob/abe4eb1bce919c9d22cd18b3519353d5824c4b75/skills/bmad-build-auto/workflow.md)、[审核步骤](https://github.com/bmad-code-org/BMAD-METHOD/blob/abe4eb1bce919c9d22cd18b3519353d5824c4b75/skills/bmad-build-auto/step-04-review.md)。

### LangGraph：用程序明确下一步，并保存等待中的任务

官方提供显式流程和检查点；人工问题可暂停，之后带同一任务标识恢复。需要选用适当持久存储，不能用进程内示例证明重启恢复。恢复时可能重跑节点，所以有写入效果的操作要单独处理重复执行，不能把检查点等同于任何操作都“只执行一次”。

适合借鉴任务状态、补料／业务选择等待、恢复与重试。它是执行框架参考；本轮未核对其全部源码，也未验证与 Codex 的接入，不据此决定引入整个框架。

依据：[检查点](https://docs.langchain.com/oss/python/langgraph/checkpointers)、[人工中断与重复执行限制](https://docs.langchain.com/oss/python/langgraph/interrupts)。仓库查询提交为 `e539ac122f4126f6dd850581c1494948cf620e31`；以上在线文档可能独立更新。

### Lobster：最贴近“人员用 Agent，固定流程由工具执行”的参考

官方用邮件分类、拟稿和确认演示：Agent 发起一次流程，多步任务由执行器推进；需要人员时返回明确状态和恢复标识。工作人员无需另开业务客户端来指挥每个工具。

**源码判断：**流程文件执行器实现条件、恢复记录及可选确认身份检查；测试文件覆盖连续两次确认及完成后的恢复记录清理，本轮仅阅读测试。`on_error` 可配置继续，循环重试可能重复已完成子项；因此必须审查具体流程，框架存在并不意味着任意流程都符合锦书“失败不可交付”。确认身份来自宿主提供的上下文，不能让 Agent 自填身份成为授权证据。

适合借鉴固定流程、结构化业务问题和恢复。锦书只使用已有必要业务确认，不照搬邮件发送批准来新增一次 Playbox 审核后的放行。嵌入 OpenClaw 的插件与独立执行器存在不同接入限制，尚无本轮 Codex 接入验证。

依据：[官方业务示例及接入限制](https://docs.openclaw.ai/tools/lobster)、[固定版本执行器](https://github.com/openclaw/lobster/blob/6285ef6d50b5e4a23b176753336d8d2c46cb67c1/src/workflows/file.ts)、[恢复入口](https://github.com/openclaw/lobster/blob/6285ef6d50b5e4a23b176753336d8d2c46cb67c1/src/resume.ts)、[连续确认测试](https://github.com/openclaw/lobster/blob/6285ef6d50b5e4a23b176753336d8d2c46cb67c1/test/multi_approval_resume.test.ts)、[重复执行限制](https://github.com/openclaw/lobster/blob/6285ef6d50b5e4a23b176753336d8d2c46cb67c1/README.md)。

### GSD Pi：执行完成与核验通过分别记录

本轮读取的核验操作先查执行尝试是否已结算成功且处于允许的核验阶段，再接收带环境信息的核验结果，并检查是否已有权威结果；接口还包含重复请求标识与版本条件。检查依据漂移时有使旧通过结果失效的操作。

这是“程序检查状态和证据”的具体参考。只读到这些局部实现不能证明全系统不可绕过，也不能证明核验内容充分；不将它当作现成可用的 Codex 插件。

依据：[核验操作源码](https://github.com/open-gsd/gsd-pi/blob/53b6821b9f2b857c1dc8a6ddecfd1d8bd415d6de/src/resources/extensions/gsd/task-verification-domain-operation.ts#L87)、[项目说明](https://github.com/open-gsd/gsd-pi)。

## 4. 对锦书的建议组合

以下是调研建议，具体实现仍待后续合同：

1. **一个明确业务入口。**工作人员在 Codex 中进入锦书任务；Skill 定义业务语言、必要选择和固定交接摘要。一般任务无需人反复说明频道规则，也不要求每天手动启动已自动取得的 EPG。
2. **程序维护必经流程。**每一步记录实际输入、输出、版本与状态；只有允许的状态才能推进。已确认规则、检查器和记录由受保护组件管理。
3. **关键交付使用受控工具。**正常 Output 的写入能力放在受控交付组件；业务 Agent 不能通过通用文件工具、命令或修改记录绕过它。每次交付都重新确认前置结果属于本次文件。
4. **业务确认与恢复有记录。**歧义返回可理解的问题，回答关联当前条目和版本；退出或长对话整理后重新读取实际任务状态。旧选择仍有效才复用，重试先查上一次实际结果。
5. **Hooks 辅助提醒、拦截和补查。**核对真实宿主的启用、信任和覆盖情况；Hook 缺失或故障不能成为正常交付的放行理由。后台状态决定完成，大屏与交接摘要引用同一结果。

这套分工符合已经批准的 Codex 主界面选择。优先借鉴 Lobster 的固定流程与暂停恢复、GSD Pi 的结果绑定、Superpowers 的 Skill 行为测试；是否采用现成框架，待小规模验证其依赖、拒绝路径与恢复成本后决定。

## 5. 下一步怎样验证

完整场景与记录方式写入[验证计划 E21](../planning/02-前期探索与验证计划.md#14-codex-工作入口与必经流程e21)，避免本页维护第二套标准。先以构造任务验证缺步骤、错误与未知不能交付，再验证中断、重复、过期选择、修改检查结果及直接写 Output 的绕过路径。通过表述限定为指定版本和已覆盖场景；记录全部失败，不只保留最好一次。

本轮已完成公开来源与局部源码核查，尚无锦书插件、流程执行器、目标宿主 Hook 覆盖或真实编单鲁棒性的通过结论。发现的项目均不能直接作为“行业已有百分之百不漏步”的证明。
