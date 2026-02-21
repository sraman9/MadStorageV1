"""Playwright-based scraper for JS-heavy storage sites. Modular: add URLs in config, adapters here."""

from __future__ import annotations

import re
from typing import Iterator, Union

from playwright.sync_api import sync_playwright, Frame, Page, TimeoutError as PlaywrightTimeout

from .base import StorageListing, BaseStorageScraper
from .registry import register
from .utils import (
    parse_price_to_float,
    extract_listings_from_body_text,
    extract_listings_same_line_only,
    _monthly_prices_from_text,
)


@register("public_storage")
class PublicStorageScraper(BaseStorageScraper):
    """Scrape Public Storage for Madison (or URL from config). Extracts Price and Unit Size."""

    name = "public_storage"

    def scrape(self, url: str, source_name: str | None = None, **kwargs) -> Iterator[StorageListing]:
        name = source_name or self.name
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=_STEALTH_LAUNCH_ARGS)
            context = browser.new_context(
                ignore_https_errors=True,
                user_agent=_USER_AGENT,
                viewport=_VIEWPORT,
            )
            page = context.new_page()
            page.set_default_timeout(15000)
            try:
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_load_state("networkidle", timeout=12000)
            except PlaywrightTimeout:
                pass
            page.wait_for_timeout(2000)  # JS-rendered prices (reduce if extraction fails)
            yield from self._extract_listings(page, url, name)
            context.close()
            browser.close()

    def _extract_listings(self, page: Page, base_url: str, source_name: str) -> Iterator[StorageListing]:
        # Public Storage often shows units in cards with size and price. Selectors may need
        # adjustment if their DOM changes; keeping multiple fallbacks.
        selectors = [
            # Common patterns: unit size in text, price in data or specific class
            ("[data-testid='unit-size'], .unit-size, [class*='size']", "[data-testid='price'], .price, [class*='price']"),
            ("[class*='UnitCard']", "[class*='price']"),
        ]
        seen = set()
        for size_sel, price_sel in selectors:
            try:
                size_els = page.query_selector_all(size_sel)
                price_els = page.query_selector_all(price_sel)
            except Exception:
                continue
            # If we get a list of cards, pair by index; otherwise try to find size/price in same container
            for i, (se, pe) in enumerate(zip(size_els, price_els)):
                if se is None or pe is None:
                    continue
                size_text = (se.inner_text() or "").strip()
                price_text = (pe.inner_text() or "").strip()
                if not size_text or not price_text:
                    continue
                size_norm = self._normalize_unit_size(size_text)
                key = (size_norm, price_text)
                if key in seen:
                    continue
                seen.add(key)
                yield StorageListing(
                    source=source_name,
                    unit_size=size_norm or size_text,
                    price=price_text,
                    price_value=parse_price_to_float(price_text),
                    url=base_url,
                )
            if seen:
                return
        # Fallback: find any text that looks like "5x5" / "10x10" and nearby price
        yield from self._fallback_extract(page, base_url, source_name)

    def _normalize_unit_size(self, raw: str) -> str:
        """Normalize to e.g. 5x5, 10x10."""
        m = re.search(r"(\d+)\s*[x×]\s*(\d+)", raw, re.IGNORECASE)
        if m:
            return f"{m.group(1)}x{m.group(2)}"
        return raw.strip()

    def _fallback_extract(self, page: Page, base_url: str, source_name: str) -> Iterator[StorageListing]:
        """Fallback: scan full page text for sizes and prices (they may be on different lines)."""
        try:
            body = page.locator("body").inner_text()
        except Exception:
            return
        size_pattern = re.compile(r"(\d+)\s*[x×]\s*(\d+)", re.IGNORECASE)
        price_pattern = re.compile(r"\$\s*(\d+\.?\d*)")
        # 1) Same-line matches
        seen: set[tuple[str, str]] = set()
        for line in body.splitlines():
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
                        source=source_name,
                        unit_size=size_str,
                        price=price_str,
                        price_value=float(prices[0]),
                        url=base_url,
                    )
        # 2) Full-page: find all sizes and all prices, pair by order (size and price often in different elements)
        if seen:
            return
        all_sizes = [f"{m[0]}x{m[1]}" for m in size_pattern.findall(body)]
        all_prices = price_pattern.findall(body)
        # Keep only storage-like sizes (e.g. 5x5, 10x10, 5x10)
        storage_sizes = [s for s in all_sizes if s in ("5x5", "10x10", "5x10", "10x15", "10x20")]
        if not storage_sizes:
            storage_sizes = list(dict.fromkeys(all_sizes))[:10]
        for i, size_str in enumerate(storage_sizes):
            if i >= len(all_prices):
                break
            price_val = all_prices[i]
            price_str = f"${price_val}/mo"
            key = (size_str, price_str)
            if key not in seen:
                seen.add(key)
                yield StorageListing(
                    source=source_name,
                    unit_size=size_str,
                    price=price_str,
                    price_value=float(price_val),
                    url=base_url,
                )


@register("uhaul")
class UHaulScraper(BaseStorageScraper):
    """Scrape U-Haul self-storage for Madison. Extracts Price and Unit Size."""

    name = "uhaul"

    def scrape(self, url: str, source_name: str | None = None, **kwargs) -> Iterator[StorageListing]:
        name = source_name or self.name
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=_STEALTH_LAUNCH_ARGS)
            context = browser.new_context(
                ignore_https_errors=True,
                user_agent=_USER_AGENT,
                viewport=_VIEWPORT,
            )
            page = context.new_page()
            page.set_default_timeout(15000)
            try:
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_load_state("networkidle", timeout=12000)
            except PlaywrightTimeout:
                pass
            page.wait_for_timeout(2000)
            yield from self._extract_listings(page, url, name)
            context.close()
            browser.close()

    def _extract_listings(self, page: Page, base_url: str, source_name: str) -> Iterator[StorageListing]:
        # U-Haul unit cards: adapt selectors if their DOM changes
        size_sel = "[class*='unit-size'], [class*='size'], [data-unit-size]"
        price_sel = "[class*='price'], [data-price]"
        try:
            size_els = page.query_selector_all(size_sel)
            price_els = page.query_selector_all(price_sel)
        except Exception:
            size_els, price_els = [], []
        seen = set()
        for se, pe in zip(size_els, price_els):
            if se is None or pe is None:
                continue
            size_text = (se.inner_text() or "").strip()
            price_text = (pe.inner_text() or "").strip()
            if not size_text or not price_text or "$" not in price_text:
                continue
            size_norm = re.sub(r"(\d+)\s*[x×]\s*(\d+)", r"\1x\2", size_text, flags=re.I)
            if not re.search(r"\d+x\d+", size_norm):
                continue
            key = (size_norm, price_text)
            if key in seen:
                continue
            seen.add(key)
            yield StorageListing(
                source=source_name,
                unit_size=size_norm,
                price=price_text,
                price_value=parse_price_to_float(price_text),
                url=base_url,
            )
        if not seen:
            yield from self._fallback_extract(page, base_url, source_name)

    def _fallback_extract(self, page: Page, base_url: str, source_name: str) -> Iterator[StorageListing]:
        """Fallback: full-page scan for sizes and prices (often in different elements)."""
        try:
            body = page.locator("body").inner_text()
        except Exception:
            return
        size_pattern = re.compile(r"(\d+)\s*[x×]\s*(\d+)", re.IGNORECASE)
        price_pattern = re.compile(r"\$\s*(\d+\.?\d*)")
        seen: set[tuple[str, str]] = set()
        for line in body.splitlines():
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
                        source=source_name,
                        unit_size=size_str,
                        price=price_str,
                        price_value=float(prices[0]),
                        url=base_url,
                    )
        if seen:
            return
        all_sizes = [f"{m[0]}x{m[1]}" for m in size_pattern.findall(body)]
        all_prices = price_pattern.findall(body)
        storage_sizes = [s for s in all_sizes if s in ("5x5", "10x10", "5x10", "10x15", "10x20")]
        if not storage_sizes:
            storage_sizes = list(dict.fromkeys(all_sizes))[:10]
        for i, size_str in enumerate(storage_sizes):
            if i >= len(all_prices):
                break
            price_val = all_prices[i]
            price_str = f"${price_val}/mo"
            key = (size_str, price_str)
            if key not in seen:
                seen.add(key)
                yield StorageListing(
                    source=source_name,
                    unit_size=size_str,
                    price=price_str,
                    price_value=float(price_val),
                    url=base_url,
                )


def _collect_frames(frame: Frame) -> list[Frame]:
    """Recursively collect frame and all child frames (Playwright Python uses child_frames, not page.frames())."""
    out: list[Frame] = [frame]
    for child in getattr(frame, "child_frames", []):
        out.extend(_collect_frames(child))
    return out


# Stealth / bot mitigation: realistic browser profile for major chains (Extra Space, CubeSmart, Public Storage).
_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
_VIEWPORT = {"width": 1920, "height": 1080}
# Disable AutomationControlled so navigator.webdriver and automation flags are not set
_STEALTH_LAUNCH_ARGS = ["--disable-blink-features=AutomationControlled"]

# Selectors to wait for before extracting (price-related elements).
_PRICE_SELECTORS = ".price, .rate, .amount, [class*='price'], [class*='rate'], [class*='amount'], [data-price], [data-rate]"

# Container selectors: row/unit elements that wrap one unit's details (size + price in same scope).
# Extra Space / CubeSmart often use data-testid or specific class patterns.
_CONTAINER_SELECTORS = [
    "tr",  # table rows
    "[data-testid*='unit'], [data-testid*='row'], [data-testid*='Unit']",
    "[class*='unit-row'], [class*='unit_row'], .unit-row",
    "[class*='pricing-card'], .pricing-card",
    "[class*='UnitCard'], [class*='unit-card']",
    "[class*='storage-unit'], [class*='StorageUnit']",
    "[class*='pricing-row'], [class*='rate-row'], [class*='price-row']",
    "[class*='unit-size']",
    "div[class*='unit']", "div[class*='Unit']",
    "[class*='listing']", "[class*='Listing']",
    "article[class*='unit'], article[class*='price']",
]

# Generic tags to scan for "common parent" that houses both size and price (no class assumed).
_COMMON_PARENT_TAGS = ("div", "tr", "li", "section", "article", "td")

# Max sizes/prices in one container: if more, likely a wrapper not a single unit.
_MAX_IN_CONTAINER = 3

_SIZE_RE = re.compile(r"(\d+)\s*[x×]\s*(\d+)", re.IGNORECASE)


def _extract_one_container(
    text: str, source_name: str, base_url: str, seen: set[tuple[str, str]]
) -> Iterator[StorageListing]:
    """
    From one container's text, extract a single (size, price) pair within the same scope.
    Prefers prices clearly labeled as monthly (/mo, per month) to avoid deposits/fees.
    """
    if len(text.strip()) < 4:
        return
    sizes = _SIZE_RE.findall(text)
    prices = _monthly_prices_from_text(text)  # monthly-labeled first, then any $N
    if not sizes or not prices:
        return
    size_str = f"{sizes[0][0]}x{sizes[0][1]}"
    price_val, price_str = prices[0]
    key = (size_str, price_str)
    if key in seen:
        return
    seen.add(key)
    yield StorageListing(
        source=source_name,
        unit_size=size_str,
        price=price_str,
        price_value=price_val,
        url=base_url,
    )


def _extract_listings_from_containers(
    context: Union[Page, Frame], source_name: str, base_url: str
) -> Iterator[StorageListing]:
    """
    Universal selection: find elements that contain BOTH a size pattern (e.g. 10x10) and
    a price pattern ($). No hardcoded site classes required — works for any location/market.
    Extract size and price within the same element scope to prevent mis-pairing.
    """
    seen: set[tuple[str, str]] = set()

    # 0) Universal heuristic first: any element containing both "NxN" and "$" (portable for any chain)
    try:
        loc = context.locator("tr, div, li, section, article, td").filter(
            has_text=re.compile(r"\d+.*x.*\d+")
        ).filter(has_text="$")
        n = min(loc.count(), 80)
        for i in range(n):
            try:
                text = loc.nth(i).inner_text(timeout=2000) or ""
            except Exception:
                continue
            sizes = _SIZE_RE.findall(text)
            prices = _monthly_prices_from_text(text)
            if not sizes or not prices or len(sizes) > _MAX_IN_CONTAINER or len(prices) > _MAX_IN_CONTAINER:
                continue
            yield from _extract_one_container(text, source_name, base_url, seen)
    except Exception:
        pass

    # 1) Named containers: tr, div.unit-row, etc. (for sites that use common patterns)
    for selector in _CONTAINER_SELECTORS:
        try:
            elements = context.query_selector_all(selector)
        except Exception:
            continue
        for el in elements:
            if el is None:
                continue
            try:
                text = el.inner_text() or ""
            except Exception:
                continue
            sizes = _SIZE_RE.findall(text)
            prices = _monthly_prices_from_text(text)
            if not sizes or not prices or len(sizes) > _MAX_IN_CONTAINER or len(prices) > _MAX_IN_CONTAINER:
                continue
            yield from _extract_one_container(text, source_name, base_url, seen)

    # 2) Common-parent scan: any div/tr/li/section/article that contains both size and price
    for tag in _COMMON_PARENT_TAGS:
        try:
            elements = context.query_selector_all(tag)
        except Exception:
            continue
        for el in elements:
            if el is None:
                continue
            try:
                text = el.inner_text() or ""
            except Exception:
                continue
            sizes = _SIZE_RE.findall(text)
            prices = _monthly_prices_from_text(text)
            if not sizes or not prices:
                continue
            if len(sizes) > _MAX_IN_CONTAINER or len(prices) > _MAX_IN_CONTAINER:
                continue
            yield from _extract_one_container(text, source_name, base_url, seen)

    # 3) Second locator pass with section/table (catches nested layouts)
    try:
        loc2 = context.locator("section, table tbody tr, [role='row']").filter(
            has_text=re.compile(r"\d+.*x.*\d+")
        ).filter(has_text="$")
        n2 = min(loc2.count(), 50)
        for i in range(n2):
            try:
                text = loc2.nth(i).inner_text(timeout=2000) or ""
            except Exception:
                continue
            sizes = _SIZE_RE.findall(text)
            prices = _monthly_prices_from_text(text)
            if not sizes or not prices or len(sizes) > _MAX_IN_CONTAINER or len(prices) > _MAX_IN_CONTAINER:
                continue
            yield from _extract_one_container(text, source_name, base_url, seen)
    except Exception:
        pass


@register("playwright_generic")
class GenericPlaywrightScraper(BaseStorageScraper):
    """
    Portable scraper for any location: URLs come from scraper_urls.yaml with no
    location-specific logic. Handles dynamic content, iframes (3rd-party pricing tables),
    and bot mitigation for major chains (Extra Space, CubeSmart, Public Storage).
    """

    name = "playwright_generic"

    def scrape(self, url: str, source_name: str | None = None, **kwargs) -> Iterator[StorageListing]:
        name = source_name or self.name
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=_STEALTH_LAUNCH_ARGS,
            )
            # Stealth: realistic viewport, User-Agent; ignore_https_errors for local sites with bad certs
            context = browser.new_context(
                ignore_https_errors=True,
                user_agent=_USER_AGENT,
                viewport=_VIEWPORT,
                java_script_enabled=True,
            )
            page = context.new_page()
            page.set_default_timeout(20000)
            # Wait for networkidle so JavaScript-heavy tables (Extra Space, CubeSmart) load before extraction
            try:
                page.goto(url, wait_until="networkidle", timeout=25000)
                page.wait_for_load_state("networkidle", timeout=10000)
            except PlaywrightTimeout:
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    page.wait_for_load_state("networkidle", timeout=15000)
                except PlaywrightTimeout:
                    pass
            # Wait for price-related elements so dynamic content has rendered
            try:
                page.wait_for_selector(_PRICE_SELECTORS, timeout=8000)
            except Exception:
                pass
            page.wait_for_timeout(2500)  # JS-heavy sites (Extra Space, CubeSmart); increase if extraction fails
            # Scroll to trigger lazy-loaded content
            try:
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1000)
                page.evaluate("window.scrollTo(0, 0)")
                page.wait_for_timeout(500)
            except Exception:
                pass
            # Dynamic content: iterate ALL frames (main + iframes). Many chains embed pricing from 3rd-party domains.
            all_frames = _collect_frames(page.main_frame)
            container_listings: list[StorageListing] = []
            body_parts: list[str] = []
            for frame in all_frames:
                try:
                    for listing in _extract_listings_from_containers(frame, name, url):
                        container_listings.append(listing)
                except Exception:
                    pass
                try:
                    text = frame.locator("body").inner_text(timeout=3000)
                    if text and len(text.strip()) > 50:
                        body_parts.append(text)
                except Exception:
                    pass
            body = "\n".join(p for p in body_parts if p)
            # Retry: if nothing found, wait longer and try once more (slow JS)
            if not container_listings and len(body.strip()) > 500:
                page.wait_for_timeout(2500)
                try:
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    page.wait_for_timeout(1000)
                except Exception:
                    pass
                for listing in _extract_listings_from_containers(page, name, url):
                    container_listings.append(listing)
                if not container_listings:
                    body = self._get_body_text(page)  # Refresh body after scroll
            context.close()
            browser.close()
        seen: set[tuple[str, str]] = set()
        # Yield container-based results first (contextually correct)
        for listing in container_listings:
            key = (listing.unit_size, listing.price)
            if key not in seen:
                seen.add(key)
                yield listing
        # 2) Fallback: same-line only (no index-pairing). Only when no container had size+price.
        if not container_listings:
            for listing in extract_listings_same_line_only(body, name, url):
                key = (listing.unit_size, listing.price)
                if key not in seen:
                    seen.add(key)
                    yield listing

    def _get_body_text(self, page: Page) -> str:
        try:
            return page.locator("body").inner_text() or ""
        except Exception:
            return ""
