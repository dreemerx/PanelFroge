"""SSRF 防护工具 — 校验外部 URL 是否指向内网/私有地址。"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

# 禁止访问的私有/保留地址段
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


class SSRFError(ValueError):
    """URL 指向被禁止的内网地址。"""


def validate_external_url(url: str) -> str:
    """校验 URL 是否指向合法的外部地址，防止 SSRF。

    Args:
        url: 待校验的 URL。

    Returns:
        校验通过的原始 URL。

    Raises:
        SSRFError: URL 指向内网/私有地址或解析失败。
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SSRFError(f"不允许的 URL 协议: {parsed.scheme}")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFError(f"URL 缺少主机名: {url}")

    # 禁止直接使用 IP 地址访问私有网段
    try:
        ip = ipaddress.ip_address(hostname)
        if any(ip in net for net in _BLOCKED_NETWORKS):
            raise SSRFError(f"禁止访问私有/保留地址: {hostname}")
    except ValueError:
        # hostname 是域名，需要 DNS 解析后检查
        try:
            resolved_ips = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
            for family, _, _, _, sockaddr in resolved_ips:
                ip = ipaddress.ip_address(sockaddr[0])
                if any(ip in net for net in _BLOCKED_NETWORKS):
                    raise SSRFError(f"域名 {hostname} 解析到私有地址: {ip}")
        except socket.gaierror:
            raise SSRFError(f"DNS 解析失败: {hostname}")

    return url
