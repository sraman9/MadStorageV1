#!/usr/bin/env python3
"""
Analyze scraped storage rates: mean/median by unit size and by source.
Usage: python scripts/analyze_rates.py [data/scraped/rates.json]
"""

import json
import sys
from pathlib import Path
from statistics import mean, median

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PATH = ROOT / "data" / "scraped" / "rates.json"


def analyze(data: list[dict], *, exclude_sanity_flagged: bool = True) -> dict:
    """
    Analyze scraped storage rates: stats by unit size and by source.
    Returns a dict with keys: total_listings, by_size, by_source, best_deals.
    If exclude_sanity_flagged is True, rows with non-null sanity_flag are excluded.
    """
    if not isinstance(data, list):
        return {
            "total_listings": 0,
            "by_size": {},
            "by_source": {},
            "best_deals": [],
        }
    rows = [r for r in data if isinstance(r, dict) and r.get("price_value") is not None]
    if exclude_sanity_flagged:
        rows = [r for r in rows if r.get("sanity_flag") is None]

    by_size: dict[str, list[float]] = {}
    for r in rows:
        size = r.get("unit_size", "?")
        by_size.setdefault(size, []).append(r["price_value"])

    by_source: dict[str, list[dict]] = {}
    for r in rows:
        src = r.get("source", "?")
        by_source.setdefault(src, []).append(r)

    # Best deal per unit size
    best_deals: list[dict] = []
    for size in sorted(by_size.keys()):
        candidates = [r for r in rows if r.get("unit_size") == size]
        if candidates:
            best = min(candidates, key=lambda r: r["price_value"])
            best_deals.append({"unit_size": size, "price_value": best["price_value"], "source": best.get("source"), "url": best.get("url")})

    return {
        "total_listings": len(rows),
        "by_size": {
            size: {"n": len(prices), "mean": mean(prices), "median": median(prices), "min": min(prices), "max": max(prices)}
            for size, prices in sorted(by_size.items())
        },
        "by_source": {
            src: [
                {"unit_size": e.get("unit_size"), "price_value": e["price_value"]}
                for e in sorted(entries, key=lambda e: (e.get("unit_size", ""), e.get("price_value", 0)))
            ]
            for src, entries in sorted(by_source.items())
        },
        "best_deals": best_deals,
    }


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
    if not path.exists():
        print(f"File not found: {path}")
        print("Run: python scripts/run_scraper.py")
        sys.exit(1)

    with open(path) as f:
        data = json.load(f)

    if not data:
        print("No listings in rates.json. Run the scraper first.")
        sys.exit(0)

    rows = [r for r in data if r.get("price_value") is not None]
    if not rows:
        print("No listings with price_value. Run the scraper first.")
        sys.exit(0)

    result = analyze(data, exclude_sanity_flagged=True)
    n = result["total_listings"]
    print(f"Total listings (sanity-ok): {n}\n")

    print("--- By unit size (Madison area) ---")
    for size, stats in result["by_size"].items():
        print(f"  {size}: n={stats['n']}, mean=${stats['mean']:.2f}/mo, median=${stats['median']:.2f}/mo")
        print(f"    range: ${stats['min']:.2f} - ${stats['max']:.2f}")

    print("\n--- By source (sample: min price per unit size) ---")
    for src, entries in result["by_source"].items():
        by_sz: dict[str, dict] = {}
        for e in entries:
            sz = e.get("unit_size", "?")
            if sz not in by_sz or (e.get("price_value") or 0) < (by_sz[sz].get("price_value") or 0):
                by_sz[sz] = e
        parts = [f"{sz} ${by_sz[sz]['price_value']:.2f}" for sz in sorted(by_sz.keys())]
        print(f"  {src}: {', '.join(parts)}")

    print("\n--- Best deals in dataset ---")
    for d in result["best_deals"]:
        print(f"  {d['unit_size']}: ${d['price_value']:.2f}/mo at {d.get('source', '?')}")


if __name__ == "__main__":
    main()
