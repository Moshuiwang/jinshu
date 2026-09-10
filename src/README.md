# 程序目录

当前可运行内容是[编号工作流演示大屏](dashboard/README.md)。其 HTML、CSS、JavaScript 与本地 Logo 统一放在 `dashboard/dist/`，文件直接维护并受 Git 管理，不是可删除的构建缓存。

真实状态服务的 `src/jinshu/` 及其 API、领域、应用、存储、适配器和 worker 模块仍为规划，按[工程设计](../docs/engineering/大屏状态服务与数据库设计.md)在实施时建立，不预建空模块冒充功能。大屏的虚构模型不能充当生产调度器。

新实现配套更新[测试](../tests/README.md)、[配置模板](../config/README.md)和[内网部署](../deploy/README.md)。早期图稿和样式对比保存在[本地实验索引](../outputs/README.md)，不在源码中另存重复大屏。
