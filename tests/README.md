# 验证代码与样例

当前 [dashboard-model.test.cjs](dashboard-model.test.cjs) 使用 Node.js 自带测试运行器，无额外测试框架依赖。从仓库根目录执行：

```sh
node --test tests/dashboard-model.test.cjs
```

它验证演示模型中的播出日期、截止、六态、回退、接收依据、历史连线、工作动效条件及扩展频道结构；不证明真实 Agent、数据库、Playbox 或现场大屏已经通过。

可公开的构造小样放[fixtures/](fixtures/README.md)。后续 API 契约、数据库并发、离线部署与恢复测试随相应实现建立，验收场景统一见[验证计划](../docs/planning/02-前期探索与验证计划.md)。真实原件留在[data/](../data/README.md)，详细运行结果留在[outputs/](../outputs/README.md)。
