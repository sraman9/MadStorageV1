"""BeautifulSoup-based scraper for storage sites with static HTML. Add URLs in config."""

from __future__ import annotations

import re
from typing import Iterator

import requests
from bs4 import BeautifulSoup

from .base import StorageListing, BaseStorageScraper
from .registry import register
from .utils import parse_price_to_float


@register("generic_static")
class GenericStaticScraper(BaseStorageScraper):
    """
    Generic scraper for static HTML pages. Configure selectors per URL in config
    via kwargs (e.g. size_selector, price_selector) or use fallback heuristics.
    """

    name = "generic_static"

    def scrape(self, url: str, size_selector: str = "", price_selector: str = "", source_name: str | None = None, **kwargs) -> Iterator[StorageListing]:
        name = source_name or self.name
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 (compatible; StorageScraper/1.0)"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        if size_selector and price_selector:
            size_els = soup.select(size_selector)
            price_els = soup.select(price_selector)
            for se, pe in zip(size_els, price_els):
                size_text = (se.get_text(strip=True) or "").strip()
                price_text = (pe.get_text(strip=True) or "").strip()
                if size_text and price_text and "$" in price_text:
                    size_norm = self._normalize_size(size_text)
                    yield StorageListing(
                        source=name,
                        unit_size=size_norm or size_text,
                        price=price_text,
                        price_value=parse_price_to_float(price_text),
                        url=url,
                    )
            return

        # Fallback: find text that looks like "5x5" / "10x10" and nearby $ price (dedupe by size+price)
        text = soup.get_text()
        size_pattern = re.compile(r"(\d+)\s*[x×]\s*(\d+)", re.IGNORECASE)
        price_pattern = re.compile(r"\$\s*(\d+\.?\d*)")
        seen: set[tuple[str, str]] = set()
        for line in text.splitlines():
            line = line.strip()
            sizes = size_pattern.findall(line)
            prices = price_pattern.findall(line)
            if sizes and prices:
                size_str = f"{sizes[0][0]}x{sizes[0][1]}"
                price_str = f"${prices[0]}/mo"
                key = (size_str, price_str)
                if key not in seen:
                    seen.add(key)
                    yield StorageListing(
                        source=name,
                        unit_size=size_str,
                        price=price_str,
                        price_value=float(prices[0]),
                        url=url,
                    )

    def _normalize_size(self, raw: str) -> str:
        m = re.search(r"(\d+)\s*[x×]\s*(\d+)", raw, re.IGNORECASE)
        return f"{m.group(1)}x{m.group(2)}" if m else raw
