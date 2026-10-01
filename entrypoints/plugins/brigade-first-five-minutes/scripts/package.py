"""Create a deterministic, allowlisted plugin ZIP. Never includes eval data or local outputs."""

import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def members(root):
    result = [root / name for name in ("plugin.json", "mcp.json", "LICENSE")]
    for directory in ("skills", "assets"):
        base = root / directory
        if base.is_symlink():
            raise ValueError("Package symlinks are forbidden")
        for item in sorted(base.rglob("*")):
            if item.is_symlink():
                raise ValueError("Package symlinks are forbidden")
            if item.is_file():
                result.append(item)
    for item in result:
        if item.is_symlink() or not item.is_file() or not item.resolve().is_relative_to(root.resolve()):
            raise ValueError("Unsafe package member")
    return sorted(result)


def package(root, destination):
    selected = members(root)
    destination = destination.resolve()
    if destination.is_relative_to(root.resolve()):
        raise ValueError("Write ZIPs outside the plugin source directory")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for item in selected:
            name = item.relative_to(root).as_posix()
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, item.read_bytes())
    return {"sha256": hashlib.sha256(destination.read_bytes()).hexdigest(), "members": len(selected), "rootManifest": True}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/package.py /output/brigade-first-five-minutes.zip")
    check = subprocess.run(["node", str(ROOT / "scripts" / "validate.mjs")], capture_output=True, text=True)
    if check.returncode:
        raise SystemExit(check.stderr)
    print(json.dumps(package(ROOT, Path(sys.argv[1])), indent=2))
