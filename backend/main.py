from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import json
import re

app = FastAPI(title="MadStorage API")

# Path to parser's scraped rates (run: python parser/scripts/run_scraper.py)
RATES_PATH = Path(__file__).resolve().parent.parent / "parser" / "data" / "scraped" / "rates.json"

# Enable CORS so your Vite frontend (usually port 5173) can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory "Database" ---
storage_requests = []
spaces_db = []
storage_listings = []


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
    neighborhood: str
    name: Optional[str] = "Bucky Badger"
    profileImage: Optional[str] = "https://i.pravatar.cc/150?img=11"
    items: Optional[str] = ""
    budget: Optional[str] = ""
    timeframe: Optional[str] = ""
    description: Optional[str] = ""

class StorageListing(BaseModel): 
    name: str
    profileImage: str
    neighborhood: str
    spaceImage: str
    spaceType: Optional[str] = "Other"
    items: Optional[str] = ""  # "What can it fit?" - split to capacity
    timeframe: Optional[str] = ""
    description: Optional[str] = ""
    price: Optional[float] = None  # Monthly rate for savings comparison
    


class ScraperData(BaseModel):
    unit_size: str
    monthly_rate: float
    source: str

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "MadStorage Backend Running", "location": "Madison, WI"}

def _request_to_card(item: dict) -> dict:
    """Transform backend request format to card format."""
    if "items" in item and isinstance(item["items"], str):
        items = [x.strip() for x in item["items"].split(",") if x.strip()] if item["items"] else []
    else:
        items = item.get("items", []) or item.get("tags", [])
        if isinstance(items, str):
            items = [x.strip() for x in items.split(",") if x.strip()]
    return {
        "name": item.get("name", "Student"),
        "profileImage": item.get("profileImage", "https://i.pravatar.cc/150?img=11"),
        "neighborhood": item.get("neighborhood", ""),
        "items": items,
        "budget": item.get("budget") or (f"${item.get('price', 0)}" if "price" in item else ""),
        "timeframe": item.get("timeframe") or item.get("duration", ""),
        "description": item.get("description", ""),
    }

def _listing_to_card(item: dict) -> dict:
    """Transform backend listing format to card format. Includes savings vs market rates."""
    items_str = item.get("items", "")
    capacity = [x.strip() for x in items_str.split(",") if x.strip()] if items_str else item.get("capacity", [])
    if isinstance(capacity, str):
        capacity = [x.strip() for x in capacity.split(",") if x.strip()]
    if not capacity and item.get("size"):
        capacity = [item["size"]]
    size_text = item.get("size", "") or item.get("spaceType", "") or " ".join(capacity)
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
    card = {
        "name": item.get("name") or item.get("host_name", "Host"),
        "profileImage": item.get("profileImage", "https://i.pravatar.cc/150?img=11"),
        "neighborhood": item.get("neighborhood", ""),
        "spaceImage": item.get("spaceImage", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64"),
        "spaceType": item.get("spaceType") or item.get("size", "Storage"),
        "capacity": capacity,
        "timeframe": item.get("timeframe", ""),
        "description": item.get("description", ""),
        "price": price if price > 0 else None,
        "marketAvg": round(market_avg, 2),
        "savings": savings if savings and savings > 0 else None,
    }
    return card

@app.get("/api/requests")
def get_all_requests():
    """Returns the list of storage cards for the React Grid layout."""
    return [_request_to_card(r) for r in storage_requests]

@app.get("/api/listings")
def get_all_listings():
    """Returns the 'Supply' - people offering storage."""
    return [_listing_to_card(l) for l in storage_listings]

@app.get("/api/spaces")
def get_all_spaces():
    """Returns spaces (listings) - same data as /api/listings for frontend consistency."""
    combined = storage_listings + spaces_db
    return [_listing_to_card(s) for s in combined]

@app.post("/api/requests")
def create_request(request: StorageRequest):
    """Allows a student to post a new storage need."""
    new_data = request.dict()
    new_data["id"] = len(storage_requests) + 1
    storage_requests.append(new_data)
    return _request_to_card(new_data)

@app.post("/api/spaces")
async def create_listing(data: StorageListing):
    new_space = data.dict()
    # Convert items string to capacity array for storage
    items_str = new_space.get("items", "")
    new_space["capacity"] = [x.strip() for x in items_str.split(",") if x.strip()] if items_str else []
    spaces_db.append(new_space)
    return _listing_to_card(new_space)



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