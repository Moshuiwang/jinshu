# 锦书 · 智能编单系统

内部项目名称：**锦书**｜对外名称：**四达传媒智能编单系统**｜拼音及英文标识：**jinshu**。后续仓库、程序和部署标识统一采用 `jinshu`。

当前阶段：真实样本研究与模型评估准备，先用 Codex＋OpenAI 建立业务与耗时基准。项目文档、后续代码、数据及运行结果统一保存在本目录。

产品边界：自动取得 EPG → 锦书完成编单、检查并放入约定 Output → 人员导入原系统、检查和修改，按原流程执行 → 锦书事后只读取得最终执行文件，与 EPG 及原产出一起保留历史并对比。人工改后无需回锦书复检或放行；实际取单与最终执行文件读取能力均待验证。网盘固定目录是 EPG 来源的优先候选，具体位置尚未确定。首期 Playbox 完整 MVP、大洋独立能力验证的顺序保持不变。

运行交付包含可自动刷新的浏览器状态页，可用于大屏展示。当前主指标只有锦书自身生成耗时与最终执行单的一致／差异情况，暂不评估人工节省率；指标定义见验证计划，当前进度见台账。

## 大屏独立模块

[大屏文档](docs/dashboard/README.md)集中维护需求、视觉、工程、部署、核查和验收。当前可运行的是 [20 个虚构频道的静态演示](src/dashboard/README.md)，真实状态服务与现场接入尚未完成。展示演示不证明“20 多频道／2 小时”的编单目标已经达到。

## 先看这两份

- [项目行动计划](docs/planning/08-项目行动计划.md)：说明当前评估顺序及进入采购、部署和试运行的条件。
- [调研报告及资料准备附录](docs/research/09-传媒项目立项前调研与基础分析报告.md)：直接提供现成资料，项目侧先整理；Playbox 与大洋按本轮用途分别准备。

## 目录规划

| 目录 | 放什么 | Git 管理 |
|---|---|---|
| docs/product/ | 产品定位、范围和专项需求 | 是 |
| [docs/dashboard/](docs/dashboard/README.md) | 大屏独立模块：需求、视觉、工程、部署、核查和验收 | 是 |
| docs/engineering/ | 项目通用工程与验收约定 | 是 |
| docs/planning/ | 行动计划、验证计划、资料清单和当前决策台账 | 是 |
| docs/research/ | 格式、Agent 和模型硬件调研；历史外部资料保留核验日期 | 是 |
| [src/](src/README.md) | 程序入口；已有大屏，真实业务模块实施时建立 | 是 |
| [scripts/](scripts/README.md) | 仓库检查及后续开发／实验辅助工具 | 是 |
| [tests/](tests/README.md) | 自动验证；fixtures/ 只放构造或获准的小样 | 是 |
| [config/](config/README.md) | 配置模板与规则；本机配置和预览记录分开 | 是，local/ 除外 |
| [deploy/](deploy/README.md) | 后续部署脚本入口；大屏部署正文归 docs/dashboard/ | 是 |
| data/production/ | 真实环境参考文件、素材信息及本批检查记录 | 否，仅保留本地 |
| data/intermediate/、data/evaluations/ | 后续中间数据和模型评测数据，使用时创建 | 否 |
| [models/](models/README.md) | 本地模型权重与缓存 | 否，说明文件除外 |
| [outputs/](outputs/README.md) | 按日期／任务留存图稿、样式实验、编单和运行报告 | 否，说明文件除外 |
| [archive/](archive/README.md) | 既有审核记录及历史文档快照 | 否，说明文件除外 |

根目录只放项目入口和工程配置，不堆放业务文件。已有目录提供用途说明；`src/jinshu/`、`db/migrations/` 等规划目录在首次实际实现时建立，不创建空服务或空迁移冒充交付。数据按系统、频道、日期／批次和用途区分；不覆盖原件，不把不同系统资料配对成同一任务。

## 当前文档

| 模块 | 入口 |
|---|---|
| 编单 Agent 与项目 | [产品需求](docs/product/01-产品需求文档.md) · [任务拆解](docs/product/03-编单动作与交接设计.md) · [模型评估](docs/planning/09-模型评估与本地选型.md) · [权限与密钥](docs/product/04-生产保护与权限密钥边界.md) |
| 大屏独立模块 | [大屏文档目录](docs/dashboard/README.md)，集中需求、视觉、工程、部署、核查和验收 |
| 共用计划与资料 | [行动计划](docs/planning/08-项目行动计划.md) · [验证计划](docs/planning/02-前期探索与验证计划.md) · [调研报告及资料准备附录](docs/research/09-传媒项目立项前调研与基础分析报告.md) · [台账](docs/planning/07-产品决策与验证台账.md) |
| 全部文档及维护分工 | [文档总索引](docs/README.md) |

已收真实资料从[data 索引](data/README.md)进入，再打开仅本机的生产资料入口。历史审核从[archive 索引](archive/README.md)进入，设计草稿与样式实验从[outputs 索引](outputs/README.md)进入。纯 Git 克隆带目录说明和正式文档，不带这些本地材料。

## 版本与数据边界

Git 管理现行文档及后续代码、测试和配置模板。生产资料、模型和运行结果留在本地，不随普通提交进入版本库；Git 不承担这些目录的备份。任何后续远程发布单独确定目标与资料范围。

远程仓库：[Moshuiwang/jinshu](https://github.com/Moshuiwang/jinshu)。GitHub 操作和提交身份遵守用户指定的 Desktop 机器身份入口，不回退到个人登录。

## 协作入口

代理从 [AGENTS.md](AGENTS.md) 按任务读取；文档职责见[文档索引](docs/README.md)，工作领取、Issue／PR／Discussions 和授权边界见[协作约定](docs/协作约定.md)。产品验证继续使用既有 E 编号，证据要求见[工程与验收约定](docs/engineering/工程与验收约定.md)。连续跨任务交付按需使用 [Trace](docs/traces/README.md)，不把行动计划当作已经开工或验收完成。
