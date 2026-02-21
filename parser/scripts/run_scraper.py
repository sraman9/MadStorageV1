#!/usr/bin/env python3
"""
Run storage rate scrapers from config. Outputs Price and Unit Size for dashboard comparison.
Uses container-based extraction; applies sanity_flag "inverted_price" when 5x5 > 10x10 at same source.
Output format is compatible with analyze_rates.py.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import yaml

from src.scrapers import get_scraper, list_adapters
from src.scrapers.base import StorageListing
from src.scrapers.utils import apply_sanity_check_inverted_price, normalize_storage_unit_size


def load_config(config_path: Path) -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f) or {}


def run_scrapers(
    config_path: Path,
    output_path: Path | None,
    filter_sizes: list[str] | None,
    max_sources: int | None = None,
) -> list[dict]:
    config = load_config(config_path)
    sources = config.get("sources", [])
    if not sources:
        print("No sources in config. Add entries under 'sources' in scraper_urls.yaml.")
        return []

    if max_sources is not None and max_sources > 0:
        sources = sources[:max_sources]
        print(f"Running first {len(sources)} source(s) (--max-sources={max_sources}).")

    results: list[dict] = []
    for entry in sources:
        name = entry.get("name", "unknown")
        url = entry.get("url")
        adapter = entry.get("adapter", "public_storage")
        target_sizes = entry.get("target_sizes") or filter_sizes or []

        if not url:
            print(f"Skipping {name}: no URL")
            continue

        scraper = get_scraper(adapter)
        if not scraper:
            print(f"Skipping {name}: unknown adapter '{adapter}'. Available: {list_adapters()}")
            continue

        print(f"Scraping {name} ({adapter})...")
        listings: list[StorageListing] = []
        try:
            for listing in scraper.scrape(url, source_name=name):
                canonical, _ = normalize_storage_unit_size(listing.unit_size)
                if target_sizes and canonical not in target_sizes:
                    continue
                listings.append(listing)
                print(f"  {listing.unit_size}: {listing.price}")
        except KeyboardInterrupt:
            print("\nInterrupted (Ctrl+C). Saving partial results...")
            location = entry.get("location")
            for listing in listings:
                canonical_size, standard_size = normalize_storage_unit_size(listing.unit_size)
                row = {
                    "source": listing.source,
                    "unit_size": canonical_size,
                    "standard_size": standard_size,
                    "price": listing.price,
                    "price_value": listing.price_value,
                    "url": listing.url,
                    "sanity_flag": None,
                }
                if location is not None:
                    row["location"] = location
                results.append(row)
            results = apply_sanity_check_inverted_price(results)
            if output_path:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, "w") as f:
                    json.dump(results, f, indent=2)
                print(f"Wrote {len(results)} listings to {output_path}")
            sys.exit(130)
        except Exception as e:
            print(f"  Error: {e}")
            continue

        if not listings:
            print(f"  (no listings found)")
        location = entry.get("location")  # optional: city or zip for backend geography filter
        for listing in listings:
            canonical_size, standard_size = normalize_storage_unit_size(listing.unit_size)
            row = {
                "source": listing.source,
                "unit_size": canonical_size,
                "standard_size": standard_size,
                "price": listing.price,
                "price_value": listing.price_value,
                "url": listing.url,
                "sanity_flag": None,
            }
            if location is not None:
                row["location"] = location
            results.append(row)

    # Sanity check: flag 5x5 > 10x10 at same source as "inverted_price"
    results = apply_sanity_check_inverted_price(results)

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"Wrote {len(results)} listings to {output_path}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Scrape storage rates for P2P marketplace comparison.")
    parser.add_argument("--config", type=Path, default=ROOT / "config" / "scraper_urls.yaml")
    parser.add_argument("--output", "-o", type=Path, default=ROOT / "data" / "scraped" / "rates.json")
    parser.add_argument("--size", action="append", dest="sizes", help="Filter to unit sizes e.g. 5x5 10x10")
    parser.add_argument("--max-sources", type=int, default=None, metavar="N", help="Run only first N sources (quick test)")
    args = parser.parse_args()

    run_scrapers(args.config, args.output, args.sizes, args.max_sources)


if __name__ == "__main__":
    main()
