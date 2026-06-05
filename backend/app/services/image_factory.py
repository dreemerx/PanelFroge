"""图像服务工厂 — 根据配置选择 OpenAI 或 Fake 图像服务。"""

from __future__ import annotations

from typing import Any, Protocol

from app.config import Settings


class ImageServiceProtocol(Protocol):
    """图像服务协议（接口定义）。"""

    async def generate(self, **kwargs: Any) -> dict[str, Any]:
        ...

    async def generate_url(
        self,
        *,
        prompt: str,
        size: str = "1024x1024",
        image_bytes: bytes | None = None,
        **kwargs: Any,
    ) -> str:
        ...

    async def cache_external_image(self, url: str) -> str:
        ...


def create_image_service(settings: Settings) -> ImageServiceProtocol:
    """根据配置创建图像服务实例。

    Args:
        settings: 应用配置

    Returns:
        图像服务实例（OpenAI 或 Fake）

    Raises:
        ValueError: 不支持的 Provider
    """
    provider = settings.image_provider.lower()
    if provider == "openai":
        from app.services.image import ImageService

        return ImageService(settings)
    if provider == "fake":
        from app.services.fake_image import FakeImageService

        return FakeImageService(settings)
    raise ValueError(f"Unsupported image provider: {settings.image_provider}")
