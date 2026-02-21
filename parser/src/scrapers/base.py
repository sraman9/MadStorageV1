"""Base classes for storage rate scrapers. Add new sites by implementing BaseStorageScraper."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterator


@dataclass
class StorageListing:
    """A single storage unit listing: price and size for comparison."""

    source: str
    unit_size: str  # e.g. "5x5", "10x10"
    price: str      # raw string e.g. "$89/mo" for display
    price_value: float | None  # numeric for calculations, None if unparseable
    url: str = ""
    extra: dict | None = None


class BaseStorageScraper(ABC):
    """Override this to add a new storage website. Register in registry.py."""

    name: str = "base"

    @abstractmethod
    def scrape(self, url: str, **kwargs) -> Iterator[StorageListing]:
        """Fetch the page and yield StorageListing for each unit (at least price + unit_size)."""
        ...
