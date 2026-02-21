"""Shared helpers for scrapers."""

import re
from typing import Iterator

from .base import StorageListing

# --- Storage unit size normalizer (for backend/frontend contract) ---
# Commercial sites use different terms: "Small," "5x5," "Locker," "Closet," "5' x 5'".
# Maps all to canonical unit_size ("5x5", "10x10") + standard_size ("small"|"medium"|"large").

_SIZE_PATTERN = re.compile(r"(\d+)\s*['']?\s*[x×]\s*['']?\s*(\d+)", re.IGNORECASE)
_SMALL_ALIASES = re.compile(r"\b(small|locker|closet|5\s*[x×]\s*5)\b", re.IGNORECASE)
_MEDIUM_ALIASES = re.compile(r"\b(medium|10\s*[x×]\s*10|5\s*[x×]\s*10)\b", re.IGNORECASE)
_LARGE_ALIASES = re.compile(r"\b(large|10\s*[x×]\s*15|10\s*[x×]\s*20|10\s*[x×]\s*25|10\s*[x×]\s*30)\b", re.IGNORECASE)


def normalize_storage_unit_size(raw: str) -> tuple[str, str]:
    """
    Return (canonical_unit_size, standard_size) for backend/frontend.
    - canonical_unit_size: "5x5", "10x10", "5x10", "10x15", etc.
    - standard_size: "small" | "medium" | "large" for grouping / display.
    """
    s = (raw or "").strip()
    m = _SIZE_PATTERN.search(s)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        canonical = f"{a}x{b}"
        if (a, b) <= (5, 5):
            return canonical, "small"
        if (a, b) <= (10, 10):
            return canonical, "medium"
        return canonical, "large"
    if _SMALL_ALIASES.search(s):
        return "5x5", "small"
    if _MEDIUM_ALIASES.search(s):
        return "10x10", "medium"
    if _LARGE_ALIASES.search(s):
        return "10x15", "large"
    return s or "unknown", "medium"

# Restrictive: only prices clearly labeled as monthly (avoids deposits, admin fees).
_MONTHLY_PRICE_RE = re.compile(
    r"\$\s*(\d+\.?\d*)\s*(?:/mo|/month|per\s+month|monthly|mo\.)",
    re.IGNORECASE,
)
# Fallback: any $N when no monthly label in scope.
_ANY_PRICE_RE = re.compile(r"\$\s*(\d+\.?\d*)")


# Skip prices that are clearly not base rate (e.g. "first month $1", "$5 off").
_FIRST_MONTH_RE = re.compile(
    r"(?:first|1st)\s+month\s*\$?\s*(\d+\.?\d*)",
    re.IGNORECASE,
)


def _monthly_prices_from_text(text: str) -> list[tuple[float, str]]:
    """
    Extract prices that are clearly monthly rates. Ignores promo amounts like
    'first month $1' when a higher base rate is present (digit-only check).
    """
    out: list[tuple[float, str]] = []
    for m in _MONTHLY_PRICE_RE.finditer(text):
        try:
            val = float(m.group(1))
            out.append((val, f"${val}/mo"))
        except ValueError:
            continue
    if not out:
        for m in _ANY_PRICE_RE.finditer(text):
            try:
                val = float(m.group(1))
                out.append((val, f"${val}/mo"))
            except ValueError:
                continue
    # Skip promo / non-base rates: "first month $1" or very low when a higher rate exists.
    # Note: in very cheap markets (e.g. $12/mo) this may drop valid prices; relax if needed.
    if len(out) > 1:
        first_month_vals = {float(m.group(1)) for m in _FIRST_MONTH_RE.finditer(text)}
        max_val = max(v for v, _ in out)
        filtered = [
            (v, s) for v, s in out
            if v not in first_month_vals and (v >= 15 or max_val <= 20)
        ]
        if filtered:
            out = filtered
    return out


def parse_price_to_float(price_str: str) -> float | None:
    """Extract numeric monthly price from strings like '$89/mo', '$120.00 per month', '89'."""
    if not price_str or not isinstance(price_str, str):
        return None
    # Remove commas, take first number (often the monthly one)
    cleaned = re.sub(r"[^\d.]", " ", price_str.strip())
    numbers = re.findall(r"\d+\.?\d*", cleaned)
    if not numbers:
        return None
    try:
        return float(numbers[0])
    except ValueError:
        return None


def extract_listings_from_body_text(
    body_text: str, source_name: str, base_url: str
) -> Iterator[StorageListing]:
    """Extract storage listings from full page text (sizes + prices, same-line or full-page pairing)."""
    size_pattern = re.compile(r"(\d+)\s*[x×]\s*(\d+)", re.IGNORECASE)
    seen: set[tuple[str, str]] = set()

    # 1) Same-line matches (contextually linked); prefer monthly-labeled prices
    for line in body_text.splitlines():
        line = line.strip()
        sizes = size_pattern.findall(line)
        prices = _monthly_prices_from_text(line)
        if sizes and prices:
            size_str = f"{sizes[0][0]}x{sizes[0][1]}"
            price_val, price_str = prices[0]
            key = (size_str, price_str)
            if key not in seen:
                seen.add(key)
                yield StorageListing(
                    source=source_name,
                    unit_size=size_str,
                    price=price_str,
                    price_value=price_val,
                    url=base_url,
                )

    # 2) Full-page: pair all sizes with prices by index (can cause inversion; used only by non-generic paths)
    if seen:
        return
    all_sizes = [f"{m[0]}x{m[1]}" for m in size_pattern.findall(body_text)]
    all_prices = [p[0] for p in _monthly_prices_from_text(body_text)]
    if not all_prices:
        all_prices = [m.group(1) for m in _ANY_PRICE_RE.finditer(body_text)]
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


def extract_listings_same_line_only(
    body_text: str, source_name: str, base_url: str
) -> Iterator[StorageListing]:
    """
    Extract only from lines that contain both a size and a price (contextually linked).
    Prefers prices clearly labeled as monthly (/mo, per month). No index-pairing.
    """
    size_pattern = re.compile(r"(\d+)\s*[x×]\s*(\d+)", re.IGNORECASE)
    seen: set[tuple[str, str]] = set()
    for line in body_text.splitlines():
        line = line.strip()
        sizes = size_pattern.findall(line)
        prices = _monthly_prices_from_text(line)
        if sizes and prices:
            size_str = f"{sizes[0][0]}x{sizes[0][1]}"
            price_val, price_str = prices[0]
            key = (size_str, price_str)
            if key not in seen:
                seen.add(key)
                yield StorageListing(
                    source=source_name,
                    unit_size=size_str,
                    price=price_str,
                    price_value=price_val,
                    url=base_url,
                )


def apply_sanity_check_inverted_price(results: list[dict], log: bool = True) -> list[dict]:
    """
    5x5 < 10x10 sanity check: set sanity_flag to "inverted_price" when 5x5 price > 10x10
    at the same source. Works for any market — source is from scraper_urls.yaml (no
    location-specific logic). Keeps rates.json compatible with analyze_rates.py.
    """
    by_source: dict[str, list[dict]] = {}
    for r in results:
        by_source.setdefault(r.get("source", ""), []).append(r)
    warned: set[str] = set()
    for r in results:
        r.setdefault("sanity_flag", None)
        src = r.get("source", "")
        unit = r.get("unit_size", "")
        pv = r.get("price_value")
        if unit != "5x5" or pv is None:
            continue
        ten = [x.get("price_value") for x in by_source.get(src, []) if x.get("unit_size") == "10x10" and x.get("price_value") is not None]
        if not ten or pv <= max(ten):
            continue
        r["sanity_flag"] = "inverted_price"
        if log and src not in warned:
            warned.add(src)
            print(f"  [Sanity] {src}: 5x5 (${pv:.2f}) > 10x10 (max ${max(ten):.2f}) — flagged inverted_price")
    return results
