"""Registry of scraper adapters. Add new scrapers here to support more URLs."""

from typing import Type

from .base import BaseStorageScraper

_REGISTRY: dict[str, Type[BaseStorageScraper]] = {}


def _load_adapters() -> None:
    """Import scraper modules so their @register decorators run."""
    try:
        from . import playwright_scraper  # noqa: F401
    except ImportError:
        pass
    try:
        from . import beautifulsoup_scraper  # noqa: F401
    except ImportError:
        pass


def register(adapter_name: str):
    """Decorator to register a scraper class under an adapter name (e.g. 'uhaul', 'public_storage')."""

    def decorator(cls: Type[BaseStorageScraper]):
        _REGISTRY[adapter_name] = cls
        return cls

    return decorator


def get_scraper(adapter_name: str) -> BaseStorageScraper | None:
    """Get a scraper instance by adapter name from config."""
    _load_adapters()
    if adapter_name not in _REGISTRY:
        return None
    return _REGISTRY[adapter_name]()


def list_adapters() -> list[str]:
    """Return registered adapter names for config validation."""
    _load_adapters()
    return list(_REGISTRY.keys())
