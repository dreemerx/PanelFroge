"""入口: python -m app"""
from __future__ import annotations

import asyncio
import selectors
import sys

# Windows ProactorEventLoop 不支持 psycopg/asyncpg，必须在 uvicorn 之前切换
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn  # noqa: E402

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=18767, reload=True)
