# 开发与检查脚本

当前入口为 [check_repository.py](check_repository.py)，从仓库根目录执行：

```sh
python3 scripts/check_repository.py
```

它检查受 Git 管理文件的资料边界、冲突标记和 Markdown 相对文件链接。本地资料链接单独计数；它不核验外网地址、章节锚点、真实业务行为或现场软件。文档整理时另核对本机材料入口实际存在，不能把“已忽略检查”当成链接有效。

脚本的输入原件只读，运行结果放[outputs/](../outputs/README.md)，不把临时报告写回源码。只在确有需要时加入新的提取、打包或开发辅助脚本；未来现场安装／恢复脚本归[deploy/](../deploy/README.md)。

原型规则检查入口见[tests/](../tests/README.md)。
