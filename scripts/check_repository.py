"""无业务副作用的仓库基础检查；不验证编单能力或现场可用性。"""

from pathlib import Path, PurePosixPath
import posixpath
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit


LOCAL_ROOTS = {"data", "models", "outputs", "archive"}
TEXT_SUFFIXES = {".md", ".py", ".yml", ".yaml", ".toml", ".json", ".sh"}
LINK = re.compile(r"!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+\"[^\"]*\")?\)")
CONFLICT = re.compile(r"^(?:<{7} |={7}$|>{7} )", re.MULTILINE)


def main():
    root = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())
    paths = set(subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode().split("\0")) - {""}
    errors = []
    local_links = 0
    for name in sorted(paths):
        path = PurePosixPath(name)
        if path.parts[0] in LOCAL_ROOTS and name != f"{path.parts[0]}/README.md":
            errors.append(f"禁止将本地资料纳入 Git：{name}")
        if (name.startswith("config/local/") or path.suffix in {".pem", ".key"}
                or (path.name.startswith(".env") and path.name != ".env.example")):
            errors.append(f"禁止将凭据或本机配置纳入 Git：{name}")
        if path.suffix not in TEXT_SUFFIXES:
            continue
        file = root / name
        if file.is_symlink():
            errors.append(f"需先审核文本符号链接的目标：{name}")
            continue
        try:
            body = file.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"无法读取受控文本：{name}（{type(exc).__name__}）")
            continue
        if CONFLICT.search(body):
            errors.append(f"存在未解决的合并冲突：{name}")
        if path.suffix != ".md":
            continue
        # 代码示例中的占位链接不是实际导航。
        body = re.sub(r"```.*?```", "", body, flags=re.DOTALL)
        for match in LINK.finditer(body):
            target = match.group(1).strip("<>")
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            resolved = posixpath.normpath(posixpath.join(str(path.parent), unquote(parsed.path)))
            if resolved.startswith("../") or resolved.startswith("/"):
                errors.append(f"文档链接越过仓库范围：{name} → {target}")
                continue
            first = resolved.split("/", 1)[0]
            if first in LOCAL_ROOTS and resolved != f"{first}/README.md":
                local_links += 1
                continue
            if resolved not in paths and not any(p.startswith(resolved.rstrip("/") + "/") for p in paths):
                errors.append(f"文档链接没有对应受控文件：{name} → {target}")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"仓库基础检查通过：{len(paths)} 个受控文件；{local_links} 处本地资料链接仅作本机入口。")
    print("覆盖范围：资料路径边界、文本冲突、Markdown 相对文件链接；不检查远端链接或章节锚点，不代表业务验收。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
