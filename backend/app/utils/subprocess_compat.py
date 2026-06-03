"""跨平台子进程工具

Windows 上 SelectorEventLoop 不支持 asyncio.create_subprocess_exec，
改用 subprocess.run + asyncio.to_thread 兼容。
"""
from __future__ import annotations

import asyncio
import logging
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


def ensure_ffmpeg_in_path() -> None:
    """确保 ffmpeg 在 PATH 中（Windows 上 winget 安装的 ffmpeg 可能不在 PATH 里）"""
    if shutil.which("ffmpeg") is not None:
        return
    search_roots = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages",
        Path("C:/ffmpeg"),
        Path("C:/Program Files/ffmpeg"),
    ]
    for root in search_roots:
        if not root.is_dir():
            continue
        for exe_path in root.rglob("ffmpeg.exe"):
            bin_dir = exe_path.parent
            os.environ["PATH"] = str(bin_dir) + os.pathsep + os.environ.get("PATH", "")
            logger.info("Added FFmpeg to PATH: %s", bin_dir)
            return


@dataclass
class SubprocessResult:
    returncode: int
    stdout: bytes
    stderr: bytes

    def decode_stdout(self, errors: str = "replace") -> str:
        return self.stdout.decode(errors=errors)

    def decode_stderr(self, errors: str = "replace") -> str:
        return self.stderr.decode(errors=errors)


def _run_sync(*args: str, timeout: int | None = None) -> SubprocessResult:
    """同步执行子进程命令"""
    result = subprocess.run(
        list(args),
        capture_output=True,
        timeout=timeout,
    )
    return SubprocessResult(
        returncode=result.returncode,
        stdout=result.stdout,
        stderr=result.stderr,
    )


async def run_subprocess(*args: str, timeout: int | None = None) -> SubprocessResult:
    """异步执行子进程命令（兼容 SelectorEventLoop）

    使用 asyncio.to_thread 在线程池中运行 subprocess.run，
    避免 Windows SelectorEventLoop 不支持 create_subprocess_exec 的问题。
    """
    # 确保 ffmpeg 在 PATH 中（首次调用时检测）
    if args and "ffmpeg" in args[0].lower():
        ensure_ffmpeg_in_path()
    return await asyncio.to_thread(_run_sync, *args, timeout=timeout)
