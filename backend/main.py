from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import json
import re
import os
from supabase import create_client, Client

# Load .env from backend folder
try:   
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

app = FastAPI(title="MadStorage API")

# Path to parser's scraped rates (run: python parser/scripts/run_scraper.py)
RATES_PATH = Path(__file__).resolve().parent.parent / "parser" / "data" / "scraped" / "rates.json"

# Supabase (from env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

def _get_supabase() -> Client | None:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Enable CORS so your Vite frontend (usually port 5173) can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Market rates from scraper (rates.json) ---
def _load_market_rates() -> dict[str, float]:
    """Load scraped rates, filter sanity_flag, return avg price by standard_size."""
    if not RATES_PATH.exists():
        return {"small": 85.0, "medium": 120.0, "large": 180.0}  # Fallback when scraper not run
    try:
        with open(RATES_PATH) as f:
            rows = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {"small": 85.0, "medium": 120.0, "large": 180.0}
    by_size: dict[str, list[float]] = {"small": [], "medium": [], "large": []}
    for r in rows:
        if r.get("sanity_flag") is not None:
            continue
        pv = r.get("price_value")
        if pv is None:
            continue
        std = r.get("standard_size", "medium")
        if std in by_size:
            by_size[std].append(float(pv))
    return {
        k: sum(v) / len(v) if v else (85.0 if k == "small" else 120.0 if k == "medium" else 180.0)
        for k, v in by_size.items()
    }


def _infer_standard_size(text: str) -> str:
    """Infer standard_size from size/capacity text (5x5->small, 10x10->medium, etc)."""
    if not text:
        return "medium"
    text = (text or "").lower()
    if re.search(r"5\s*[x×]\s*5|small|locker|closet", text):
        return "small"
    if re.search(r"10\s*[x×]\s*10|5\s*[x×]\s*10|medium", text):
        return "medium"
    if re.search(r"10\s*[x×]\s*(15|20|25|30)|large", text):
        return "large"
    return "medium"


# --- Pydantic Models (Data Validation) ---
class StorageRequest(BaseModel):
    user_id: str  # From Supabase auth
    neighborhood: str
    name: Optional[str] = "Bucky Badger"
    profileImage: Optional[str] = "https://i.pravatar.cc/150?img=11"
    items: Optional[str] = ""
    budget: Optional[str] = ""
    timeframe: Optional[str] = ""
    description: Optional[str] = ""

class StorageListing(BaseModel): 
    user_id: str  # From Supabase auth
    name: str
    profileImage: str
    neighborhood: str
    spaceImage: str
    spaceType: Optional[str] = "Other"
    items: Optional[str] = ""  # "What can it fit?" - split to capacity
    timeframe: Optional[str] = ""
    description: Optional[str] = ""
    price: Optional[float] = None  # Monthly rate for savings comparison
    


class RatingCreate(BaseModel):
    reviewed_user_id: str
    reviewer_id: str
    score: int  # 1–5
    comment: Optional[str] = ""

class ScraperData(BaseModel):
    unit_size: str
    monthly_rate: float
    source: str

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "MadStorage Backend Running", "location": "Madison, WI"}

def _request_to_card(item: dict) -> dict:
    """Transform backend/Supabase request format to card format."""
    if "items" in item and isinstance(item["items"], str):
        items = [x.strip() for x in item["items"].split(",") if x.strip()] if item["items"] else []
    else:
        items = item.get("items", []) or item.get("tags", [])
        if isinstance(items, str):
            items = [x.strip() for x in items.split(",") if x.strip()]
    return {
        "userId": item.get("user_id", ""),
        "name": item.get("name", "Student"),
        "profileImage": item.get("profileImage") or item.get("profile_image", "https://i.pravatar.cc/150?img=11"),
        "neighborhood": item.get("neighborhood", ""),
        "items": items,
        "budget": item.get("budget") or (f"${item.get('price', 0)}" if "price" in item else ""),
        "timeframe": item.get("timeframe") or item.get("duration", ""),
        "description": item.get("description", ""),
    }

def _get_rating_stats(sb: Client | None) -> dict[str, dict]:
    """Fetch all ratings and compute avg + count per reviewed_user_id."""
    if not sb:
        return {}
    resp = sb.table("ratings").select("reviewed_user_id,score").execute()
    by_user: dict[str, list[int]] = {}
    for r in (resp.data or []):
        uid = r["reviewed_user_id"]
        by_user.setdefault(uid, []).append(r["score"])
    return {
        uid: {"avg": round(sum(scores) / len(scores), 1), "count": len(scores)}
        for uid, scores in by_user.items()
    }


def _listing_to_card(item: dict, rating_stats: dict | None = None) -> dict:
    """Transform backend/Supabase listing format to card format. Includes savings vs market rates."""
    items_str = item.get("items", "")
    capacity = [x.strip() for x in items_str.split(",") if x.strip()] if items_str else item.get("capacity", [])
    if isinstance(capacity, str):
        capacity = [x.strip() for x in capacity.split(",") if x.strip()]
    if not capacity and item.get("size"):
        capacity = [item["size"]]
    size_text = item.get("size", "") or item.get("spaceType", "") or item.get("space_type", "") or " ".join(capacity)
    std_size = _infer_standard_size(size_text)
    market_rates = _load_market_rates()
    market_avg = market_rates.get(std_size, 100.0)
    price = item.get("price")
    if price is None:
        price = 0.0
    try:
        price = float(price)
    except (TypeError, ValueError):
        price = 0.0
    savings = round(market_avg - price, 2) if price > 0 else None
    space_id = item.get("id", "")
    user_id = item.get("user_id", "")
    rs = (rating_stats or {}).get(user_id, {})
    card = {
        "id": space_id,
        "userId": user_id,
        "name": item.get("name") or item.get("host_name", "Host"),
        "profileImage": item.get("profileImage") or item.get("profile_image", "https://i.pravatar.cc/150?img=11"),
        "neighborhood": item.get("neighborhood", ""),
        "spaceImage": item.get("spaceImage") or item.get("space_image", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64"),
        "spaceType": item.get("spaceType") or item.get("space_type") or item.get("size", "Storage"),
        "capacity": capacity,
        "timeframe": item.get("timeframe", ""),
        "description": item.get("description", ""),
        "price": price if price > 0 else None,
        "marketAvg": round(market_avg, 2),
        "savings": savings if savings and savings > 0 else None,
        "avgRating": rs.get("avg"),
        "ratingCount": rs.get("count", 0),
    }
    return card

@app.get("/api/requests")
def get_all_requests():
    """Returns the list of storage cards from Supabase."""
    sb = _get_supabase()
    if not sb:
        return []
    resp = sb.table("storage_requests").select("*").execute()
    return [_request_to_card(r) for r in (resp.data or [])]

@app.get("/api/listings")
def get_all_listings():
    """Returns the 'Supply' - people offering storage from Supabase."""
    sb = _get_supabase()
    if not sb:
        return []
    rs = _get_rating_stats(sb)
    resp = sb.table("storage_spaces").select("*").execute()
    return [_listing_to_card(s, rs) for s in (resp.data or [])]

@app.get("/api/spaces")
def get_all_spaces():
    """Returns spaces from Supabase."""
    sb = _get_supabase()
    if not sb:
        return []
    rs = _get_rating_stats(sb)
    resp = sb.table("storage_spaces").select("*").execute()
    return [_listing_to_card(s, rs) for s in (resp.data or [])]

@app.post("/api/requests")
def create_request(request: StorageRequest):
    """Allows a student to post a new storage need to Supabase."""
    sb = _get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    row = {
        "user_id": request.user_id,
        "name": request.name,
        "profile_image": request.profileImage,
        "neighborhood": request.neighborhood,
        "items": request.items,
        "budget": request.budget,
        "timeframe": request.timeframe,
        "description": request.description,
    }
    resp = sb.table("storage_requests").insert(row).select().execute()
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create request")
    return _request_to_card(resp.data[0])

@app.post("/api/spaces")
async def create_listing(data: StorageListing):
    """Create a storage space in Supabase."""
    sb = _get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    items_str = data.items or ""
    capacity = [x.strip() for x in items_str.split(",") if x.strip()] if items_str else []
    row = {
        "user_id": data.user_id,
        "name": data.name,
        "profile_image": data.profileImage,
        "neighborhood": data.neighborhood,
        "space_image": data.spaceImage,
        "space_type": data.spaceType,
        "items": data.items,
        "capacity": capacity,
        "timeframe": data.timeframe,
        "description": data.description,
        "price": data.price,
    }
    resp = sb.table("storage_spaces").insert(row).select().execute()
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create space")
    return _listing_to_card(resp.data[0])



@app.get("/api/ratings/user/{user_id}")
def get_ratings(user_id: str):
    """Get all ratings for a specific user's profile."""
    sb = _get_supabase()
    if not sb:
        return []
    resp = sb.table("ratings").select("*").eq("reviewed_user_id", user_id).order("created_at", desc=True).execute()
    return resp.data or []

@app.post("/api/ratings")
def create_rating(rating: RatingCreate):
    """Submit or update a rating for a user (upsert: one per reviewer per user)."""
    if rating.score < 1 or rating.score > 5:
        raise HTTPException(status_code=422, detail="Score must be 1–5")
    sb = _get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Supabase not configured.")
    if rating.reviewed_user_id == rating.reviewer_id:
        raise HTTPException(status_code=403, detail="You cannot rate yourself.")
    row = {
        "reviewed_user_id": rating.reviewed_user_id,
        "reviewer_id": rating.reviewer_id,
        "score": rating.score,
        "comment": rating.comment or "",
    }
    resp = sb.table("ratings").upsert(row, on_conflict="reviewed_user_id,reviewer_id").execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to save rating")
    return resp.data[0]


@app.post("/api/ingest-scraper")
def ingest_scraper_data(data: List[ScraperData]):
    """
    Endpoint to receive JSON from your parser/scripts/run_scraper.py.
    This helps calculate the 'You're saving $X' feature.
    """
    # Here you would save to your DB (e.g., SQLite)
    return {"message": f"Successfully ingested {len(data)} commercial rates."}

@app.get("/api/savings-calc")
def calculate_savings(user_price: float, size: str):
    """Compares peer price vs commercial average from the scraper."""
    market_price = 100.0 # Logic: lookup 'size' in your scraped data
    savings = market_price - user_price
    return {
        "user_price": user_price,
        "market_avg": market_price,
        "savings": savings,
        "percent_off": (savings / market_price) * 100
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)