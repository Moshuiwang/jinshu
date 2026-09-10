# 数据目录

production/ 保存真实环境参考资料，按收到日期／主题分批、按系统和频道区分。已收资料索引见 [production/README.md](production/README.md)。该目录内文件默认不纳入 Git，保留原始解压文件，不保留压缩包，不覆盖旧版本，不复制完整视频。

以后中间数据放 intermediate/，模型评测数据放 evaluations/，均默认不纳入 Git。可公开、人工构造且适合回归的微型样例放 tests/fixtures/；不要把生产原件挪过去规避忽略规则。

Git 不备份这里的资料；需要备份时另按选定存储方式处理。目录和忽略规则不等于数据访问权限控制。
