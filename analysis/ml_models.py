#!/usr/bin/env python3
"""
MadStorage ML Models — Student-Facing Smart Pricing

Students list storage spaces with: neighborhood, capacity (items), spaceType, timeframe.
This model recommends what price they should set, based on:
  - Scraped commercial rates in Madison
  - Neighborhood proximity to campus
  - Estimated space size from capacity/items
  - Target discount vs commercial (P2P advantage)

Usage:  python analysis/ml_models.py
Output: analysis/output/*.png
"""

import json
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.ticker import FuncFormatter
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import LeaveOneOut, cross_val_predict
from sklearn.metrics import mean_absolute_error, r2_score
from scipy import stats

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
RATES_PATH = (
    Path(__file__).resolve().parent.parent / "parser" / "data" / "scraped" / "rates.json"
)

# ── Palette ─────────────────────────────────────────────────
UW_RED       = "#C5050C"
UW_RED_LIGHT = "#E8474E"
UW_RED_FAINT = "#FDECEA"
GREEN        = "#059669"
GREEN_LIGHT  = "#34D399"
GREEN_BG     = "#ECFDF5"
BLUE         = "#2563EB"
BLUE_LIGHT   = "#60A5FA"
BLUE_BG      = "#EFF6FF"
PURPLE       = "#7C3AED"
AMBER        = "#D97706"
AMBER_BG     = "#FFFBEB"

BG       = "#FFFFFF"
TEXT_PRI = "#111827"
TEXT_SEC = "#4B5563"
TEXT_MUT = "#9CA3AF"
BORDER   = "#E5E7EB"
GRID     = "#F3F4F6"

# ── App neighborhoods → estimated distance from UW campus ──
NEIGHBORHOOD_DIST = {
    "State St":      0.3,
    "Langdon":       0.5,
    "Willy St":      1.2,
    "Eagle Heights": 1.8,
}

# ── Scraped facility locations → estimated distance ─────────
FACILITY_DIST = {
    "uhaul_madison":            1.5,
    "uhaul_packers_ave":        3.2,
    "uhaul_east_madison":       4.8,
    "uhaul_verona_road":        5.1,
    "uhaul_middleton":          7.3,
    "superior_storage_madison": 6.0,
    "fitchburg_self_storage":   8.5,
    "verona_self_storage":      11.2,
}

SIZE_SQFT = {"5x5": 25, "10x10": 100}


def _pick_font():
    available = {f.name for f in fm.fontManager.ttflist}
    for name in ("Avenir Next", "Avenir", "Gill Sans", "Optima"):
        if name in available:
            return name
    return "sans-serif"

FONT = _pick_font()


def _setup():
    plt.rcParams.update({
        "font.family": FONT, "font.size": 11.5,
        "figure.facecolor": BG, "axes.facecolor": BG,
        "axes.edgecolor": BORDER, "axes.labelcolor": TEXT_SEC,
        "axes.grid": True, "axes.linewidth": 0.6,
        "grid.color": GRID, "grid.linewidth": 0.6,
        "xtick.color": TEXT_MUT, "ytick.color": TEXT_MUT,
        "xtick.major.size": 0, "ytick.major.size": 0,
        "xtick.major.pad": 10, "ytick.major.pad": 10,
        "text.color": TEXT_PRI,
        "legend.facecolor": BG, "legend.edgecolor": BORDER,
        "legend.labelcolor": TEXT_SEC, "legend.framealpha": 1.0,
        "figure.dpi": 200, "savefig.facecolor": BG, "savefig.edgecolor": BG,
    })


def _trim(ax):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(BORDER)
    ax.spines["bottom"].set_color(BORDER)


def load_rates():
    if RATES_PATH.exists():
        with open(RATES_PATH) as f:
            data = json.load(f)
        return [r for r in data if r.get("price_value") is not None and r.get("sanity_flag") is None]
    return []


FEATURE_NAMES = ["Size (sqft)", "Distance from Campus (mi)", "National Chain", "Size \u00d7 Distance"]


def _build_features(rates):
    X, y, labels = [], [], []
    for r in rates:
        if r["unit_size"] not in SIZE_SQFT:
            continue
        sqft = SIZE_SQFT[r["unit_size"]]
        dist = FACILITY_DIST.get(r["source"], 5.0)
        is_chain = 1 if "uhaul" in r["source"] else 0
        X.append([sqft, dist, is_chain, sqft * dist])
        y.append(r["price_value"])
        labels.append(r["source"].replace("_", " ").title())
    return np.array(X), np.array(y), labels


# ═══════════════════════════════════════════════════════════
#  Chart 1 — Recommended Listing Price by Neighborhood
# ═══════════════════════════════════════════════════════════
def neighborhood_pricing(rates):
    X, y, _ = _build_features(rates)

    rf = RandomForestRegressor(n_estimators=200, max_depth=4, random_state=42)
    gb = GradientBoostingRegressor(n_estimators=150, max_depth=3, learning_rate=0.1, random_state=42)
    rf.fit(X, y)
    gb.fit(X, y)

    loo = LeaveOneOut()
    ens_pred = (cross_val_predict(rf, X, y, cv=loo) + cross_val_predict(gb, X, y, cv=loo)) / 2
    mae = mean_absolute_error(y, ens_pred)
    r2 = r2_score(y, ens_pred)

    print("=== Smart Pricing Model (Ensemble RF + GB) ===")
    print(f"  LOO-CV  MAE: ${mae:.2f}   R\u00b2: {r2:.3f}\n")

    # Predict for each neighborhood at small (closet ~25sqft) and medium (room ~100sqft)
    sizes = [("Closet / Small", 25), ("Room / Medium", 100)]
    neighborhoods = list(NEIGHBORHOOD_DIST.items())

    fig = plt.figure(figsize=(11, 7))
    ax = fig.add_axes([0.09, 0.12, 0.85, 0.70])

    bar_width = 0.35
    x_pos = np.arange(len(neighborhoods))

    print("  --- Recommended Listing Prices ---")
    print(f"  {'Neighborhood':<20} {'Size':<18} {'Commercial':>11} {'Your Price':>11} {'Savings':>8}")
    print(f"  {'-'*70}")

    for i, (size_label, sqft) in enumerate(sizes):
        commercial_prices = []
        listing_prices = []
        for name, dist in neighborhoods:
            feats = np.array([[sqft, dist, 0, sqft * dist]])
            commercial = (rf.predict(feats)[0] + gb.predict(feats)[0]) / 2
            # Students list at 40-50% below commercial (the P2P advantage)
            discount = 0.45 if sqft <= 25 else 0.40
            listing = commercial * (1 - discount)
            listing = max(listing, 20)  # floor
            commercial_prices.append(commercial)
            listing_prices.append(listing)
            print(f"  {name:<20} {size_label:<18} ${commercial:>8.0f}/mo   ${listing:>8.0f}/mo   {discount*100:.0f}%")

        offset = -bar_width / 2 + i * bar_width
        color = GREEN if i == 0 else BLUE
        color_light = GREEN_LIGHT if i == 0 else BLUE_LIGHT
        bars = ax.bar(x_pos + offset, listing_prices, bar_width,
                      color=color, edgecolor="white", linewidth=0.8,
                      alpha=0.9, label=f"P2P: {size_label}", zorder=3)

        # Commercial reference dots
        ax.scatter(x_pos + offset, commercial_prices, c=UW_RED, s=60,
                   marker="_", linewidths=2.5, zorder=5,
                   label=f"Commercial: {size_label}" if i == 0 else None)

        for j, (bar, lp, cp) in enumerate(zip(bars, listing_prices, commercial_prices)):
            ax.text(bar.get_x() + bar.get_width() / 2, lp + 1.5,
                    f"${lp:.0f}", ha="center", va="bottom",
                    fontsize=9.5, fontweight="demibold", color=color)
            saving = cp - lp
            pct = saving / cp * 100
            bb = dict(boxstyle="round,pad=0.2", fc=GREEN_BG, ec=GREEN, lw=0.5, alpha=0.9)
            ax.text(bar.get_x() + bar.get_width() / 2, cp + 2,
                    f"-{pct:.0f}%", ha="center", va="bottom",
                    fontsize=8, fontweight="bold", color=GREEN, bbox=bb)

    # Add commercial reference to legend
    ax.scatter([], [], c=UW_RED, s=60, marker="_", linewidths=2.5, label="Commercial Rate")

    ax.set_xticks(x_pos)
    ax.set_xticklabels([n for n, _ in neighborhoods], fontsize=11.5)
    ax.set_ylabel("Monthly Price ($)", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"${x:.0f}"))
    ax.set_ylim(0, max(y) * 1.15)

    fig.text(0.09, 0.92, "Recommended Listing Prices for Students",
             fontsize=20, fontweight="bold", color=TEXT_PRI, fontfamily=FONT)
    fig.text(0.09, 0.87, "ML-predicted P2P price by neighborhood — undercuts commercial by 40\u201345%",
             fontsize=12, color=TEXT_MUT, fontfamily=FONT)

    leg = ax.legend(fontsize=9.5, loc="upper right", framealpha=1, borderpad=1,
                    handlelength=1.5, handletextpad=0.8, ncol=2)
    leg.get_frame().set_linewidth(0.6)
    _trim(ax)

    plt.savefig(OUTPUT_DIR / "smart_pricing_model.png", dpi=200,
                bbox_inches="tight", pad_inches=0.25)
    plt.close()

    return rf, gb


# ═══════════════════════════════════════════════════════════
#  Chart 2 — Feature Importance
# ═══════════════════════════════════════════════════════════
def feature_importance(rf, gb):
    avg_imp = (rf.feature_importances_ + gb.feature_importances_) / 2
    order = np.argsort(avg_imp)

    fig = plt.figure(figsize=(11, 6))
    ax = fig.add_axes([0.25, 0.10, 0.68, 0.72])

    colors = [BLUE_LIGHT, BLUE_LIGHT, BLUE, BLUE]
    bar_colors = [colors[i] for i in range(len(order))]

    bars = ax.barh(range(len(order)), avg_imp[order], height=0.55,
                   color=[bar_colors[i] for i in range(len(order))],
                   edgecolor="white", linewidth=0.8, alpha=0.9, zorder=3)

    ax.set_yticks(range(len(order)))
    ax.set_yticklabels([FEATURE_NAMES[i] for i in order], fontsize=11.5)

    for i, (bar, idx) in enumerate(zip(bars, order)):
        ax.text(bar.get_width() + 0.01, i, f"{avg_imp[idx]:.1%}",
                va="center", fontsize=11, fontweight="demibold", color=BLUE)

    fig.text(0.25, 0.92, "What Drives Storage Pricing?",
             fontsize=20, fontweight="bold", color=TEXT_PRI, fontfamily=FONT)
    fig.text(0.25, 0.87, "Feature importance from ensemble model (Random Forest + Gradient Boosting)",
             fontsize=12, color=TEXT_MUT, fontfamily=FONT)

    ax.set_xlabel("Importance", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{x:.0%}"))
    ax.set_xlim(0, max(avg_imp) * 1.25)
    _trim(ax)

    plt.savefig(OUTPUT_DIR / "feature_importance.png", dpi=200,
                bbox_inches="tight", pad_inches=0.25)
    plt.close()

    print(f"\n=== Feature Importance ===")
    for i in reversed(order):
        print(f"  {FEATURE_NAMES[i]:<30} {avg_imp[i]:.1%}")


# ═══════════════════════════════════════════════════════════
#  Chart 3 — Demand Forecasting
# ═══════════════════════════════════════════════════════════
def demand_forecast():
    years      = np.array([2021, 2022, 2023, 2024, 2025], dtype=float)
    enrollment = np.array([47932, 49886, 50662, 51400, 51822], dtype=float)
    pressure   = np.array([78, 82, 85, 89, 94], dtype=float)

    storage_pct = 0.30
    demand = enrollment * storage_pct

    t = years - years[0]
    coeffs = np.polyfit(t, demand, 2)
    poly = np.poly1d(coeffs)

    sl, inter, r_val, _, _ = stats.linregress(t, demand)

    future = np.arange(2021, 2031, dtype=float)
    t_fut = future - years[0]

    poly_forecast = poly(t_fut)
    linear_forecast = sl * t_fut + inter

    residuals = demand - poly(t)
    std_resid = np.std(residuals)
    ci_upper = poly_forecast + 1.96 * std_resid
    ci_lower = poly_forecast - 1.96 * std_resid

    sl_p, int_p, _, _, _ = stats.linregress(t, pressure)
    pressure_forecast = sl_p * t_fut + int_p
    pressure_norm = pressure_forecast / 100

    composite = poly_forecast * pressure_norm
    composite_actual = demand * (pressure / 100)

    fig = plt.figure(figsize=(11, 7))
    ax = fig.add_axes([0.09, 0.10, 0.85, 0.72])

    ax.fill_between(future, ci_lower, ci_upper, color=BLUE, alpha=0.08,
                    label="95% Confidence Interval", zorder=2)

    ax.plot(future[future <= 2025], poly_forecast[future <= 2025],
            color=BLUE, lw=2.5, zorder=4)
    ax.plot(future[future >= 2025], poly_forecast[future >= 2025],
            color=BLUE, lw=2.5, ls="--", alpha=0.6, zorder=4,
            label="Polynomial Forecast")

    ax.plot(future, linear_forecast, color=TEXT_MUT, lw=1.2, ls=":",
            label="Linear Baseline", zorder=3)

    ax.plot(future[:len(composite_actual)],
            composite_actual, "D-", color=PURPLE, lw=2, ms=7,
            mec="white", mew=1.5, label="Pressure-Adjusted Demand", zorder=5)
    ax.plot(future[len(composite_actual)-1:],
            composite[len(composite_actual)-1:], "D--", color=PURPLE,
            lw=2, ms=7, mec="white", mew=1.5, alpha=0.4, zorder=5)

    ax.scatter(years, demand, c=UW_RED, s=100, zorder=6,
               edgecolors="white", linewidth=1.5, label="Actual Demand")

    for y, d in zip(years, demand):
        ax.text(y, d + 200, f"{d:,.0f}", ha="center", va="bottom",
                fontsize=8.5, fontweight="demibold", color=TEXT_SEC)

    bb = dict(boxstyle="round,pad=0.4", fc=BLUE_BG, ec=BLUE, lw=0.8)
    ax.annotate(f"{poly(7):,.0f}",
                xy=(2028, poly(7)), xytext=(2028.5, poly(7) + 300),
                fontsize=11, fontweight="bold", color=BLUE, bbox=bb,
                arrowprops=dict(arrowstyle="->", color=BLUE, lw=1.5))

    fig.text(0.09, 0.92, "Storage Demand Forecasting",
             fontsize=20, fontweight="bold", color=TEXT_PRI, fontfamily=FONT)
    fig.text(0.09, 0.87, "Polynomial Trend + Housing Pressure Composite Model",
             fontsize=12, color=TEXT_MUT, fontfamily=FONT)

    ax.set_xlabel("Year", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax.set_ylabel("Students Needing Storage", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{x/1000:.1f}K"))
    ax.set_xticks(future.astype(int))
    ax.set_xlim(2020.5, 2030.5)

    leg = ax.legend(fontsize=10, loc="upper left", framealpha=1, borderpad=1,
                    handlelength=1.5, handletextpad=0.8)
    leg.get_frame().set_linewidth(0.6)
    _trim(ax)

    plt.savefig(OUTPUT_DIR / "demand_forecast.png", dpi=200,
                bbox_inches="tight", pad_inches=0.25)
    plt.close()

    print(f"\n=== Demand Forecasting ===")
    print(f"  Polynomial: {coeffs[0]:.1f}t\u00b2 + {coeffs[1]:.1f}t + {coeffs[2]:.0f}")
    print(f"  Forecast 2026: {poly(5):,.0f}   2028: {poly(7):,.0f}")
    print(f"  Pressure-adjusted 2028: {composite[7]:,.0f}")


# ═══════════════════════════════════════════════════════════
#  Chart 4 — Student Savings by Neighborhood
# ═══════════════════════════════════════════════════════════
def savings_by_neighborhood(rf, gb):
    neighborhoods = list(NEIGHBORHOOD_DIST.items())
    sqft = 100  # medium unit

    fig = plt.figure(figsize=(11, 7))
    ax = fig.add_axes([0.09, 0.12, 0.85, 0.70])

    commercial_prices = []
    p2p_prices = []
    savings = []

    for name, dist in neighborhoods:
        feats = np.array([[sqft, dist, 0, sqft * dist]])
        comm = (rf.predict(feats)[0] + gb.predict(feats)[0]) / 2
        p2p = comm * 0.60
        commercial_prices.append(comm)
        p2p_prices.append(p2p)
        savings.append(comm - p2p)

    x = np.arange(len(neighborhoods))
    names = [n for n, _ in neighborhoods]

    ax.bar(x, commercial_prices, 0.35, color=UW_RED, alpha=0.25,
           edgecolor=UW_RED, linewidth=1, label="Commercial Rate", zorder=3)
    ax.bar(x, p2p_prices, 0.35, color=GREEN, edgecolor="white",
           linewidth=0.8, alpha=0.9, label="MadStorage P2P", zorder=4)

    for i in range(len(neighborhoods)):
        mid = (commercial_prices[i] + p2p_prices[i]) / 2
        bb = dict(boxstyle="round,pad=0.3", fc=GREEN_BG, ec=GREEN, lw=0.8)
        ax.annotate(f"Save ${savings[i]:.0f}/mo",
                    xy=(i, mid), xytext=(i + 0.4, mid + 5),
                    fontsize=10, fontweight="bold", color=GREEN, bbox=bb,
                    arrowprops=dict(arrowstyle="->", color=GREEN, lw=1.2),
                    ha="center")

    # 3-month total
    months = 3
    total = sum(savings) / len(savings) * months
    bb2 = dict(boxstyle="round,pad=0.5", fc=AMBER_BG, ec=AMBER, lw=1)
    ax.text(0.97, 0.95,
            f"Avg summer savings\n${total:.0f} over {months} months",
            transform=ax.transAxes, fontsize=12, fontweight="bold",
            color=AMBER, ha="right", va="top", bbox=bb2)

    ax.set_xticks(x)
    ax.set_xticklabels(names, fontsize=11.5)
    ax.set_ylabel("Monthly Price for 10\u00d710 ($)", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda val, _: f"${val:.0f}"))

    fig.text(0.09, 0.92, "Student Savings by Neighborhood",
             fontsize=20, fontweight="bold", color=TEXT_PRI, fontfamily=FONT)
    fig.text(0.09, 0.87, "MadStorage P2P vs. nearest commercial facility (10\u00d710 unit)",
             fontsize=12, color=TEXT_MUT, fontfamily=FONT)

    leg = ax.legend(fontsize=10, loc="upper left", framealpha=1, borderpad=1)
    leg.get_frame().set_linewidth(0.6)
    _trim(ax)

    plt.savefig(OUTPUT_DIR / "savings_by_neighborhood.png", dpi=200,
                bbox_inches="tight", pad_inches=0.25)
    plt.close()

    print(f"\n=== Savings by Neighborhood ===")
    for (name, _), s in zip(neighborhoods, savings):
        print(f"  {name:<20} saves ${s:.0f}/mo")


# ═══════════════════════════════════════════════════════════
def main():
    _setup()
    rates = load_rates()
    print(f"Loaded {len(rates)} rates  |  Font: {FONT}\n")

    rf, gb = neighborhood_pricing(rates)
    feature_importance(rf, gb)
    demand_forecast()
    savings_by_neighborhood(rf, gb)

    print(f"\n\u2713 ML charts saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
