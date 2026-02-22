#!/usr/bin/env python3
"""
MadStorage Regression Analysis — Humanist light theme (Avenir Next)

Usage:  python analysis/regression_analysis.py
Output: analysis/output/*.png
"""

import json
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.ticker import FuncFormatter
from scipy import stats

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
RATES_PATH = (
    Path(__file__).resolve().parent.parent / "parser" / "data" / "scraped" / "rates.json"
)

# ── Palette ─────────────────────────────────────────────────
UW_RED       = "#C5050C"
UW_RED_DARK  = "#9B0309"
UW_RED_LIGHT = "#E8474E"
UW_RED_FAINT = "#FDECEA"
GREEN        = "#059669"
GREEN_LIGHT  = "#34D399"
GREEN_BG     = "#ECFDF5"

BG           = "#FFFFFF"
TEXT_PRI     = "#111827"
TEXT_SEC     = "#4B5563"
TEXT_MUT     = "#9CA3AF"
BORDER       = "#E5E7EB"
GRID         = "#F3F4F6"


def _pick_font():
    available = {f.name for f in fm.fontManager.ttflist}
    for name in ("Avenir Next", "Avenir", "Gill Sans", "Optima"):
        if name in available:
            return name
    return "sans-serif"

FONT = _pick_font()


def _setup():
    plt.rcParams.update({
        "font.family":       FONT,
        "font.size":         11.5,
        "figure.facecolor":  BG,
        "axes.facecolor":    BG,
        "axes.edgecolor":    BORDER,
        "axes.labelcolor":   TEXT_SEC,
        "axes.titlecolor":   TEXT_PRI,
        "axes.grid":         True,
        "axes.linewidth":    0.6,
        "grid.color":        GRID,
        "grid.linewidth":    0.6,
        "xtick.color":       TEXT_MUT,
        "ytick.color":       TEXT_MUT,
        "xtick.major.size":  0,
        "ytick.major.size":  0,
        "xtick.major.pad":   10,
        "ytick.major.pad":   10,
        "text.color":        TEXT_PRI,
        "legend.facecolor":  BG,
        "legend.edgecolor":  BORDER,
        "legend.labelcolor": TEXT_SEC,
        "legend.framealpha": 1.0,
        "figure.dpi":        200,
        "savefig.facecolor": BG,
        "savefig.edgecolor": BG,
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
        return [
            r for r in data
            if r.get("price_value") is not None and r.get("sanity_flag") is None
        ]
    return []


def enrollment_regression():
    years      = np.array([2021, 2022, 2023, 2024, 2025])
    enrollment = np.array([47932, 49886, 50662, 51400, 51822])
    pressure   = np.array([78, 82, 85, 89, 94])

    sl_e, int_e, r_e, p_e, _ = stats.linregress(years, enrollment)
    sl_p, int_p, r_p, p_p, _ = stats.linregress(years, pressure)

    fut = np.array([2026, 2027, 2028])
    all_y = np.concatenate([years, fut])
    proj_enr = sl_e * fut + int_e
    proj_pr  = sl_p * fut + int_p

    fig = plt.figure(figsize=(11, 7))
    ax1 = fig.add_axes([0.08, 0.10, 0.82, 0.72])
    ax2 = ax1.twinx()

    ax1.bar(years, enrollment, color=UW_RED, width=0.52, zorder=3,
            edgecolor="white", linewidth=0.8, alpha=0.9,
            label="Actual Enrollment")
    ax1.bar(fut, proj_enr, color=UW_RED, alpha=0.22, width=0.52, zorder=3,
            edgecolor=UW_RED_LIGHT, linewidth=0.8, linestyle="--",
            label="Projected")

    ax1.plot(all_y, sl_e * all_y + int_e, color=TEXT_MUT, ls="--", lw=1.2,
             label=f"Trend   R\u00b2 = {r_e**2:.3f}   +{sl_e:,.0f} / yr", zorder=4)

    ax2.plot(years, pressure, "o-", color=GREEN, lw=2.5, ms=8,
             mec="white", mew=2, label="Housing Pressure Index", zorder=5)
    ax2.plot(fut, proj_pr, "o--", color=GREEN, alpha=0.35, ms=8,
             mec="white", mew=2, zorder=5)

    for y, e in zip(years, enrollment):
        ax1.text(y, e + 450, f"{e:,}", ha="center", va="bottom",
                 fontsize=8.5, fontweight="demibold", color=TEXT_SEC)
    for y, p in zip(years, pressure):
        ax2.text(y + 0.18, p + 0.8, str(p), ha="left", va="bottom",
                 fontsize=8.5, fontweight="demibold", color=GREEN)

    fig.text(0.08, 0.92, "Projected Storage Demand",
             fontsize=20, fontweight="bold", color=TEXT_PRI, fontfamily=FONT)
    fig.text(0.08, 0.87, "Enrollment & Housing Pressure Regression",
             fontsize=13, fontweight="regular", color=TEXT_MUT, fontfamily=FONT)

    ax1.set_xlabel("Year", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax1.set_ylabel("Student Enrollment", fontsize=12, color=UW_RED, labelpad=12)
    ax2.set_ylabel("Housing Market Pressure Index", fontsize=12, color=GREEN, labelpad=12)

    ax2.spines["top"].set_visible(False)
    ax2.spines["right"].set_color(GREEN)
    ax2.spines["right"].set_alpha(0.3)
    ax2.tick_params(axis="y", colors=GREEN)
    ax1.spines["top"].set_visible(False)
    ax1.spines["right"].set_visible(False)
    ax1.spines["left"].set_color(BORDER)
    ax1.spines["bottom"].set_color(BORDER)

    h1, l1 = ax1.get_legend_handles_labels()
    h2, l2 = ax2.get_legend_handles_labels()
    leg = ax1.legend(h1 + h2, l1 + l2, loc="lower right", fontsize=9.5,
                     framealpha=1, borderpad=1, handlelength=1.5, handletextpad=0.8)
    leg.get_frame().set_linewidth(0.6)

    ax1.set_ylim(0, 60000)
    ax1.set_xticks(all_y)
    ax1.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{x/1000:.0f}K"))

    plt.savefig(OUTPUT_DIR / "enrollment_regression.png", dpi=200,
                bbox_inches="tight", pad_inches=0.25)
    plt.close()

    print("=== Enrollment Growth Regression ===")
    print(f"  +{sl_e:.0f} students/yr  (R\u00b2={r_e**2:.3f}, p={p_e:.4f})")
    print(f"  Projected 2026: {proj_enr[0]:,.0f}   2028: {proj_enr[2]:,.0f}")

    return sl_e, int_e


def price_regression(rates):
    size_map = {"5x5": 25, "10x10": 100}
    sqft   = np.array([size_map[r["unit_size"]] for r in rates if r["unit_size"] in size_map])
    prices = np.array([r["price_value"]         for r in rates if r["unit_size"] in size_map])

    if len(sqft) < 3:
        print("Not enough data for price regression")
        return np.mean(prices) if len(prices) > 0 else 100

    sl, inter, r_v, p_v, _ = stats.linregress(sqft, prices)

    fig = plt.figure(figsize=(11, 7))
    ax  = fig.add_axes([0.09, 0.10, 0.85, 0.72])

    ax.scatter(sqft, prices, c=UW_RED, s=100, zorder=5,
               edgecolors="white", linewidth=1.5, alpha=0.85)

    xr = np.linspace(0, 150, 200)
    yr = sl * xr + inter
    ax.plot(xr, yr, color=UW_RED_LIGHT, ls="--", lw=1.8,
            label=f"Commercial   ${inter:.0f} + ${sl:.2f}/sqft   R\u00b2 = {r_v**2:.3f}")

    ci = 1.96 * np.std(prices - (sl * sqft + inter))
    ax.fill_between(xr, yr - ci, yr + ci, color=UW_RED, alpha=0.05, lw=0)

    m5, m10 = 30, 55
    ax.scatter([25, 100], [m5, m10], c=GREEN, s=160, marker="D", zorder=6,
               edgecolors="white", linewidth=2)
    ax.plot([25, 100], [m5, m10], color=GREEN, ls="--", lw=1.8, alpha=0.5,
            label="MadStorage P2P Target")

    for sz, mp in [(25, m5), (100, m10)]:
        cp  = sl * sz + inter
        sav = cp - mp
        pct = sav / cp * 100
        bb  = dict(boxstyle="round,pad=0.4", fc=GREEN_BG, ec=GREEN, lw=0.8, alpha=0.95)
        ax.annotate(
            f"Save ${sav:.0f}/mo ({pct:.0f}%)", xy=(sz, mp),
            xytext=(sz + 14, mp - 14), fontsize=10.5, fontweight="bold",
            color=GREEN, bbox=bb,
            arrowprops=dict(arrowstyle="->", color=GREEN, lw=1.5,
                            connectionstyle="arc3,rad=0.15"))

    fig.text(0.09, 0.92, "Commercial Storage Pricing Regression",
             fontsize=20, fontweight="bold", color=TEXT_PRI, fontfamily=FONT)
    fig.text(0.09, 0.87, "vs. MadStorage Peer-to-Peer",
             fontsize=13, color=TEXT_MUT, fontfamily=FONT)

    ax.set_xlabel("Unit Size (sq ft)", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax.set_ylabel("Monthly Price ($)", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"${x:.0f}"))
    ax.set_xlim(-5, 155)
    ax.set_ylim(0, 165)

    leg = ax.legend(fontsize=10, loc="upper left", framealpha=1, borderpad=1,
                    handlelength=1.5, handletextpad=0.8)
    leg.get_frame().set_linewidth(0.6)
    _trim(ax)

    plt.savefig(OUTPUT_DIR / "price_regression.png", dpi=200,
                bbox_inches="tight", pad_inches=0.25)
    plt.close()

    print(f"\n=== Price vs Size Regression ===")
    print(f"  ${inter:.2f} + ${sl:.2f}/sqft  (R\u00b2={r_v**2:.3f})")
    return np.mean(prices)


def savings_projection(sl_e, int_e, avg_comm):
    mad_price = 45
    months    = 3
    need_pct  = 0.30

    yrs     = np.arange(2025, 2031)
    need    = (sl_e * yrs + int_e) * need_pct
    rates   = [0.02, 0.05, 0.10, 0.20]
    colors  = ["#FCA5A5", UW_RED_LIGHT, "#EF4444", UW_RED]
    markers = ["o", "s", "D", "^"]

    fig = plt.figure(figsize=(11, 7))
    ax  = fig.add_axes([0.09, 0.10, 0.82, 0.72])

    for rate, col, mk in zip(rates, colors, markers):
        total = need * rate * (avg_comm - mad_price) * months
        ax.plot(yrs, total / 1000, marker=mk, ls="-", color=col, lw=2.5, ms=8,
                mec="white", mew=1.5, label=f"{rate*100:.0f}% adoption", zorder=5)
        ax.fill_between(yrs, 0, total / 1000, color=col, alpha=0.04, lw=0)

        bb = dict(boxstyle="round,pad=0.3", fc=UW_RED_FAINT, ec=col, lw=0.8, alpha=0.9)
        ax.annotate(f"${total[-1]/1000:.0f}K",
                    xy=(yrs[-1], total[-1]/1000), xytext=(10, 0),
                    textcoords="offset points", fontsize=10.5,
                    fontweight="bold", color=col, va="center", bbox=bb)

    fig.text(0.09, 0.92, "Projected Collective Student Savings",
             fontsize=20, fontweight="bold", color=TEXT_PRI, fontfamily=FONT)
    fig.text(0.09, 0.87, "via MadStorage Peer-to-Peer Platform",
             fontsize=13, color=TEXT_MUT, fontfamily=FONT)

    ax.set_xlabel("Year", fontsize=12, color=TEXT_MUT, labelpad=12)
    ax.set_ylabel("Total Student Savings ($K / summer)", fontsize=12,
                  color=TEXT_MUT, labelpad=12)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"${x:.0f}K"))
    ax.set_xticks(yrs)
    ax.set_xlim(2024.5, 2031.5)

    leg = ax.legend(title="Platform Adoption Rate", fontsize=10,
                    title_fontsize=10, loc="upper left", framealpha=1,
                    borderpad=1, handlelength=1.5, handletextpad=0.8)
    leg.get_frame().set_linewidth(0.6)
    leg.get_title().set_color(TEXT_SEC)
    leg.get_title().set_fontweight("demibold")
    _trim(ax)

    plt.savefig(OUTPUT_DIR / "savings_projection.png", dpi=200,
                bbox_inches="tight", pad_inches=0.25)
    plt.close()

    u = (sl_e * 2028 + int_e) * need_pct * 0.10
    s = (avg_comm - mad_price) * months
    print(f"\n=== Savings Projection ===")
    print(f"  Commercial avg ${avg_comm:.2f}/mo   MadStorage ${mad_price}/mo")
    print(f"  10% adoption 2028: {u:.0f} users \u2192 ${u*s:,.0f} saved")


def main():
    _setup()
    rates = load_rates()
    print(f"Loaded {len(rates)} rates  |  Font: {FONT}\n")

    sl_e, int_e = enrollment_regression()
    avg = price_regression(rates)
    savings_projection(sl_e, int_e, avg)

    print(f"\n\u2713 Charts saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
