from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="TrukAll - Complete Truck Driver Solution")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str  # "driver", "partner", "admin"
    phone: Optional[str] = None
    reward_points: int = 0
    hos_hours_remaining: float = 11.0  # Hours of Service remaining
    hos_last_reset: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "driver"
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ParkingSpot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    state: str
    latitude: float
    longitude: float
    total_spaces: int
    available_spaces: int
    price_per_night: float
    amenities: List[str]
    is_free: bool = False
    security_level: str
    partner_id: str
    description: Optional[str] = None
    images: List[str] = []
    fuel_price_diesel: Optional[float] = None
    fuel_price_unleaded: Optional[float] = None
    status: str = "active"
    rating: float = 0.0
    total_reviews: int = 0
    weather_alert: Optional[str] = None  # "clear", "storm", "snow", "rain"
    weigh_station_nearby: bool = False
    weigh_station_status: Optional[str] = None  # "open", "closed", "bypass"
    # Real-time availability fields
    last_reported_at: Optional[str] = None
    last_reported_by: Optional[str] = None
    last_reported_spaces: Optional[int] = None
    report_accuracy_score: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Real-Time Parking Report Model (Driver-Powered)
class ParkingReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    spot_id: str
    spot_name: str
    driver_email: str
    driver_name: str
    reported_spaces: int  # How many spaces the driver sees available
    fill_rate: str  # "empty", "filling", "almost_full", "full"
    conditions: List[str] = []  # ["well_lit", "clean", "security_present", "crowded", "dark", "sketchy"]
    wait_time_minutes: Optional[int] = None  # Estimated wait if full
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    # Accuracy tracking
    helpful_votes: int = 0
    not_helpful_votes: int = 0
    accuracy_score: float = 0.0
    verified: bool = False
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=2))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ParkingReportCreate(BaseModel):
    spot_id: str
    reported_spaces: int
    fill_rate: str
    conditions: List[str] = []
    wait_time_minutes: Optional[int] = None
    notes: Optional[str] = None

class ParkingSpotCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    latitude: float
    longitude: float
    total_spaces: int
    price_per_night: float
    amenities: List[str]
    is_free: bool = False
    security_level: str = "medium"
    description: Optional[str] = None
    fuel_price_diesel: Optional[float] = None
    fuel_price_unleaded: Optional[float] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: str
    driver_name: str
    driver_email: str
    spot_id: str
    spot_name: str
    spot_address: str
    check_in_date: datetime
    check_out_date: datetime
    total_price: float
    payment_status: str
    booking_status: str
    session_id: Optional[str] = None
    is_reservation: bool = False  # NEW: 24hr advance reservation
    reservation_confirmed: bool = False  # NEW: Partner confirmed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    spot_id: str
    check_in_date: datetime
    check_out_date: datetime

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    amount: float
    currency: str = "usd"
    session_id: str
    payment_status: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Load(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    origin_city: str
    origin_state: str
    destination_city: str
    destination_state: str
    pickup_date: datetime
    delivery_date: datetime
    weight: int  # pounds
    distance: int  # miles
    rate: float  # dollars
    equipment_type: str  # "flatbed", "dry_van", "reefer", "stepdeck"
    contact_name: str
    contact_phone: str
    status: str = "available"  # "available", "booked", "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoadCreate(BaseModel):
    origin_city: str
    origin_state: str
    destination_city: str
    destination_state: str
    pickup_date: datetime
    delivery_date: datetime
    weight: int
    distance: int
    rate: float
    equipment_type: str
    contact_name: str
    contact_phone: str

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    category: str  # "fuel", "tolls", "parking", "food", "maintenance", "other"
    amount: float
    description: str
    location: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    description: str
    location: Optional[str] = None

class MaintenanceReminder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    truck_id: Optional[str] = None
    maintenance_type: str  # "oil_change", "tire_rotation", "brake_inspection", "annual_inspection"
    current_mileage: int
    due_mileage: int
    is_completed: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MaintenanceReminderCreate(BaseModel):
    maintenance_type: str
    current_mileage: int
    due_mileage: int
    notes: Optional[str] = None

class EmergencySOS(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    driver_name: str
    driver_phone: str
    latitude: float
    longitude: float
    emergency_type: str  # "breakdown", "accident", "medical", "other"
    description: str
    status: str = "active"  # "active", "responding", "resolved"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmergencySOSCreate(BaseModel):
    latitude: float
    longitude: float
    emergency_type: str
    description: str

class DashboardStats(BaseModel):
    total_spots: int
    total_bookings: int
    total_revenue: float
    active_spots: int

# ============== NOTIFICATION MODEL ==============

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recipient_email: str
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    type: str  # "location_share", "convoy_join", "sos_alert", "booking", "system"
    title: str
    message: str
    data: Optional[dict] = None  # Extra data like coordinates, convoy_id, etc.
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# NEW MODELS FOR CRITICAL FEATURES

class SpotReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    spot_id: str
    spot_name: str
    driver_email: str
    driver_name: str
    rating: int  # 1-5 stars
    cleanliness_rating: int  # 1-5
    safety_rating: int  # 1-5
    amenities_rating: int  # 1-5
    comment: str
    verified_booking: bool = False  # Verified they actually booked
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SpotReviewCreate(BaseModel):
    spot_id: str
    rating: int
    cleanliness_rating: int
    safety_rating: int
    amenities_rating: int
    comment: str

class ConvoyPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    driver_name: str
    origin_city: str
    origin_state: str
    destination_city: str
    destination_state: str
    departure_date: datetime
    message: str
    looking_for_convoy: bool = True
    max_drivers: int = 5
    current_drivers: int = 1
    status: str = "open"  # "open", "full", "departed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConvoyPostCreate(BaseModel):
    origin_city: str
    origin_state: str
    destination_city: str
    destination_state: str
    departure_date: datetime
    message: str
    max_drivers: int = 5

class DriverChat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_name: str  # e.g., "Dallas Highway 45"
    driver_email: str
    driver_name: str
    message: str
    message_type: str = "chat"  # "chat", "warning", "tip"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DriverChatCreate(BaseModel):
    location_name: str
    message: str
    message_type: str = "chat"

class TripCalculation(BaseModel):
    load_id: str
    load_rate: float
    distance: int
    estimated_fuel_cost: float
    toll_cost: float
    parking_cost: float
    total_expenses: float
    net_profit: float
    profit_per_mile: float
    is_profitable: bool

class DetentionClaim(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    driver_name: str
    broker_name: str
    load_id: Optional[str] = None
    detention_hours: float
    hourly_rate: float
    total_amount: float
    location: str
    start_time: datetime
    end_time: datetime
    proof_photos: List[str] = []
    status: str = "pending"  # "pending", "submitted", "paid", "disputed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DetentionClaimCreate(BaseModel):
    broker_name: str
    load_id: Optional[str] = None
    detention_hours: float
    hourly_rate: float
    location: str
    start_time: datetime
    end_time: datetime

class DOTCompliance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    cdl_expiry: datetime
    medical_card_expiry: datetime
    hazmat_expiry: Optional[datetime] = None
    twic_card_expiry: Optional[datetime] = None
    csa_score: int = 0
    last_inspection_date: Optional[datetime] = None
    violations: List[dict] = []
    alerts_enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DOTComplianceCreate(BaseModel):
    cdl_expiry: datetime
    medical_card_expiry: datetime
    hazmat_expiry: Optional[datetime] = None
    twic_card_expiry: Optional[datetime] = None

# NEW CRITICAL FEATURES

class BrokerRating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    broker_name: str
    mc_number: Optional[str] = None  # Motor Carrier number
    driver_email: str
    driver_name: str
    rating: int  # 1-5 stars
    payment_rating: int  # 1-5 (how fast they pay)
    communication_rating: int  # 1-5
    load_accuracy_rating: int  # 1-5 (load details match actual)
    would_work_again: bool
    payment_days: Optional[int] = None  # How many days to get paid
    fraud_reported: bool = False
    fraud_type: Optional[str] = None  # "non_payment", "double_broker", "fake_load", "other"
    comment: str
    verified_load: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BrokerRatingCreate(BaseModel):
    broker_name: str
    mc_number: Optional[str] = None
    rating: int
    payment_rating: int
    communication_rating: int
    load_accuracy_rating: int
    would_work_again: bool
    payment_days: Optional[int] = None
    fraud_reported: bool = False
    fraud_type: Optional[str] = None
    comment: str

class BrokerSummary(BaseModel):
    broker_name: str
    mc_number: Optional[str] = None
    total_reviews: int
    average_rating: float
    average_payment_rating: float
    average_payment_days: float
    fraud_reports: int
    would_work_again_percentage: float
    verified_reviews: int

class ShowerCredit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    chain: str  # "pilot_flying_j", "loves", "ta_petro", "speedway"
    rewards_number: Optional[str] = None
    available_showers: int
    points_balance: int
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShowerCreditCreate(BaseModel):
    chain: str
    rewards_number: Optional[str] = None
    available_showers: int = 0
    points_balance: int = 0

class ShowerCreditUpdate(BaseModel):
    available_showers: Optional[int] = None
    points_balance: Optional[int] = None

class RetailParking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    chain: str  # "walmart", "lowes", "home_depot", "rest_area", "cracker_barrel", "cabelas"
    address: str
    city: str
    state: str
    latitude: float
    longitude: float
    allows_overnight: bool = True
    truck_parking_spaces: Optional[int] = None
    restrictions: List[str] = []  # ["no_idling", "max_12_hours", "must_shop", "security_patrol"]
    amenities: List[str] = []
    last_verified: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    community_verified: bool = False
    total_reviews: int = 0
    average_rating: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RetailParkingCreate(BaseModel):
    name: str
    chain: str
    address: str
    city: str
    state: str
    latitude: float
    longitude: float
    allows_overnight: bool = True
    truck_parking_spaces: Optional[int] = None
    restrictions: List[str] = []
    amenities: List[str] = []

class TruckRoute(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    origin_address: str
    origin_lat: float
    origin_lng: float
    destination_address: str
    destination_lat: float
    destination_lng: float
    truck_type: str  # "straight_truck", "semi", "double", "triple"
    truck_height_ft: float
    truck_weight_lbs: int
    hazmat: bool = False
    avoid_tolls: bool = False
    waypoints: List[dict] = []  # List of parking stops, fuel stops
    total_distance_miles: float
    estimated_drive_time_hours: float
    estimated_fuel_cost: float
    estimated_toll_cost: float
    warnings: List[str] = []  # Low bridge, weight restriction, etc
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TruckRouteRequest(BaseModel):
    origin_address: str
    origin_lat: float
    origin_lng: float
    destination_address: str
    destination_lat: float
    destination_lng: float
    truck_type: str = "semi"
    truck_height_ft: float = 13.6
    truck_weight_lbs: int = 80000
    hazmat: bool = False
    avoid_tolls: bool = False
    include_parking_stops: bool = True

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def get_current_user(email: str) -> User:
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone
    )
    
    user_doc = user.model_dump()
    user_doc['password_hash'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['hos_last_reset'] = user_doc['hos_last_reset'].isoformat()
    
    await db.users.insert_one(user_doc)
    logger.info(f"User registered: {user.email} as {user.role}")
    return user

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.pop('password_hash', None)
    logger.info(f"User logged in: {user['email']}")
    return {"user": user, "message": "Login successful"}

# ============== PASSWORD RESET ==============

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    reset_code: str
    new_password: str

# In-memory store for reset codes (in production, use Redis or DB with expiry)
reset_codes = {}

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists - return success anyway for security
        return {"message": "If an account with that email exists, a reset code has been sent."}
    
    # Generate a 6-digit reset code
    import random
    reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Store the code with expiry (15 minutes)
    reset_codes[request.email] = {
        "code": reset_code,
        "expires": datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    
    # In production, send email here. For now, log it and return it for testing
    logger.info(f"Password reset code for {request.email}: {reset_code}")
    
    # For development/testing, return the code. Remove this in production!
    return {
        "message": "Reset code has been generated.",
        "reset_code": reset_code,  # REMOVE IN PRODUCTION - only for testing
        "note": "In production, this code would be sent via email"
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: PasswordResetConfirm):
    # Check if reset code exists and is valid
    if request.email not in reset_codes:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
    stored = reset_codes[request.email]
    
    # Check expiry
    if datetime.now(timezone.utc) > stored["expires"]:
        del reset_codes[request.email]
        raise HTTPException(status_code=400, detail="Reset code has expired")
    
    # Check code matches
    if stored["code"] != request.reset_code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Update password
    new_hash = hash_password(request.new_password)
    result = await db.users.update_one(
        {"email": request.email},
        {"$set": {"password_hash": new_hash}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove the used code
    del reset_codes[request.email]
    
    logger.info(f"Password reset successful for {request.email}")
    return {"message": "Password has been reset successfully"}

# ============== PARKING SPOTS ROUTES ==============

@api_router.get("/spots", response_model=List[ParkingSpot])
async def get_parking_spots(
    city: Optional[str] = None,
    amenities: Optional[str] = None,
    is_free: Optional[bool] = None,
    available_only: bool = True
):
    query = {}
    if city:
        query['city'] = {"$regex": city, "$options": "i"}
    if is_free is not None:
        query['is_free'] = is_free
    if available_only:
        query['available_spaces'] = {"$gt": 0}
    query['status'] = "active"
    
    spots = await db.parking_spots.find(query, {"_id": 0}).to_list(1000)
    
    for spot in spots:
        if isinstance(spot.get('created_at'), str):
            spot['created_at'] = datetime.fromisoformat(spot['created_at'])
        if isinstance(spot.get('updated_at'), str):
            spot['updated_at'] = datetime.fromisoformat(spot['updated_at'])
    
    return spots

# IMPORTANT: This route must be BEFORE /spots/{spot_id} to avoid path conflicts
@api_router.get("/spots/live-updates")
async def get_live_parking_updates(city: Optional[str] = None):
    """Get all spots with recent driver reports (live data)"""
    query = {"status": "active"}
    if city:
        query['city'] = {"$regex": city, "$options": "i"}
    
    spots = await db.parking_spots.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with recent reports
    live_spots = []
    for spot in spots:
        # Get the most recent report for this spot
        latest_report = await db.parking_reports.find_one(
            {"spot_id": spot['id']},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        
        if latest_report:
            expires_at = datetime.fromisoformat(latest_report['expires_at'])
            if expires_at > datetime.now(timezone.utc):
                created_at = datetime.fromisoformat(latest_report['created_at'])
                minutes_ago = (datetime.now(timezone.utc) - created_at).total_seconds() / 60
                spot['has_live_report'] = True
                spot['live_report'] = {
                    "reported_spaces": latest_report['reported_spaces'],
                    "fill_rate": latest_report['fill_rate'],
                    "reported_by": latest_report['driver_name'],
                    "minutes_ago": round(minutes_ago),
                    "conditions": latest_report.get('conditions', []),
                    "freshness": "fresh" if minutes_ago < 30 else "recent" if minutes_ago < 60 else "older"
                }
            else:
                spot['has_live_report'] = False
        else:
            spot['has_live_report'] = False
        
        live_spots.append(spot)
    
    # Sort by freshness - spots with live reports first
    live_spots.sort(key=lambda x: (not x.get('has_live_report', False), x.get('live_report', {}).get('minutes_ago', 999)))
    
    return live_spots

@api_router.get("/spots/{spot_id}", response_model=ParkingSpot)
async def get_parking_spot(spot_id: str):
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Parking spot not found")
    
    if isinstance(spot.get('created_at'), str):
        spot['created_at'] = datetime.fromisoformat(spot['created_at'])
    if isinstance(spot.get('updated_at'), str):
        spot['updated_at'] = datetime.fromisoformat(spot['updated_at'])
    
    return ParkingSpot(**spot)

@api_router.post("/spots", response_model=ParkingSpot)
async def create_parking_spot(spot_data: ParkingSpotCreate, partner_email: str):
    user = await db.users.find_one({"email": partner_email})
    if not user or user['role'] not in ["partner", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can create parking spots")
    
    spot = ParkingSpot(
        **spot_data.model_dump(),
        partner_id=user['id'],
        available_spaces=spot_data.total_spaces
    )
    
    spot_doc = spot.model_dump()
    spot_doc['created_at'] = spot_doc['created_at'].isoformat()
    spot_doc['updated_at'] = spot_doc['updated_at'].isoformat()
    
    await db.parking_spots.insert_one(spot_doc)
    logger.info(f"Parking spot created: {spot.name} by {partner_email}")
    return spot

@api_router.put("/spots/{spot_id}", response_model=ParkingSpot)
async def update_parking_spot(spot_id: str, spot_data: ParkingSpotCreate, partner_email: str):
    user = await db.users.find_one({"email": partner_email})
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    
    if not spot:
        raise HTTPException(status_code=404, detail="Parking spot not found")
    
    if user['role'] != "admin" and spot['partner_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to update this spot")
    
    update_data = spot_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.parking_spots.update_one({"id": spot_id}, {"$set": update_data})
    
    updated_spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if isinstance(updated_spot.get('created_at'), str):
        updated_spot['created_at'] = datetime.fromisoformat(updated_spot['created_at'])
    if isinstance(updated_spot.get('updated_at'), str):
        updated_spot['updated_at'] = datetime.fromisoformat(updated_spot['updated_at'])
    
    return ParkingSpot(**updated_spot)

@api_router.get("/spots/partner/{partner_email}", response_model=List[ParkingSpot])
async def get_partner_spots(partner_email: str):
    user = await db.users.find_one({"email": partner_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    spots = await db.parking_spots.find({"partner_id": user['id']}, {"_id": 0}).to_list(1000)
    
    for spot in spots:
        if isinstance(spot.get('created_at'), str):
            spot['created_at'] = datetime.fromisoformat(spot['created_at'])
        if isinstance(spot.get('updated_at'), str):
            spot['updated_at'] = datetime.fromisoformat(spot['updated_at'])
    
    return spots

# ============== REAL-TIME PARKING REPORTS (Driver-Powered) ==============

@api_router.post("/spots/{spot_id}/report")
async def report_parking_availability(spot_id: str, report: ParkingReportCreate, driver_email: str):
    """Driver reports real-time parking availability"""
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Parking spot not found")
    
    # Create the report
    parking_report = ParkingReport(
        spot_id=spot_id,
        spot_name=spot['name'],
        driver_email=driver_email,
        driver_name=user['name'],
        reported_spaces=report.reported_spaces,
        fill_rate=report.fill_rate,
        conditions=report.conditions,
        wait_time_minutes=report.wait_time_minutes,
        notes=report.notes
    )
    
    report_doc = parking_report.model_dump()
    report_doc['expires_at'] = report_doc['expires_at'].isoformat()
    report_doc['created_at'] = report_doc['created_at'].isoformat()
    
    await db.parking_reports.insert_one(report_doc)
    
    # Update the parking spot with latest report info
    await db.parking_spots.update_one(
        {"id": spot_id},
        {"$set": {
            "last_reported_at": datetime.now(timezone.utc).isoformat(),
            "last_reported_by": user['name'],
            "last_reported_spaces": report.reported_spaces,
            "available_spaces": report.reported_spaces,  # Update actual availability
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Award points to the driver for contributing
    points_earned = 25  # Base points for reporting
    if report.conditions:
        points_earned += len(report.conditions) * 5  # Bonus for detailed report
    if report.notes:
        points_earned += 10  # Bonus for adding notes
    
    await db.users.update_one(
        {"email": driver_email},
        {"$inc": {"reward_points": points_earned}}
    )
    
    logger.info(f"Parking report submitted by {driver_email} for {spot['name']}: {report.reported_spaces} spaces")
    
    return {
        "message": "Report submitted successfully! Thank you for helping fellow drivers.",
        "points_earned": points_earned,
        "report_id": parking_report.id
    }

@api_router.get("/spots/{spot_id}/reports")
async def get_spot_reports(spot_id: str, limit: int = 10):
    """Get recent reports for a parking spot"""
    # Only get non-expired reports
    current_time = datetime.now(timezone.utc).isoformat()
    
    reports = await db.parking_reports.find(
        {"spot_id": spot_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Filter out expired reports and calculate freshness
    valid_reports = []
    for report in reports:
        expires_at = datetime.fromisoformat(report['expires_at'])
        if expires_at > datetime.now(timezone.utc):
            created_at = datetime.fromisoformat(report['created_at'])
            minutes_ago = (datetime.now(timezone.utc) - created_at).total_seconds() / 60
            report['minutes_ago'] = round(minutes_ago)
            report['freshness'] = "fresh" if minutes_ago < 30 else "recent" if minutes_ago < 60 else "older"
            valid_reports.append(report)
    
    return valid_reports

@api_router.post("/reports/{report_id}/vote")
async def vote_on_report(report_id: str, vote: str, driver_email: str):
    """Vote on whether a report was helpful"""
    if vote not in ["helpful", "not_helpful"]:
        raise HTTPException(status_code=400, detail="Vote must be 'helpful' or 'not_helpful'")
    
    report = await db.parking_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update vote count
    if vote == "helpful":
        await db.parking_reports.update_one(
            {"id": report_id},
            {"$inc": {"helpful_votes": 1}}
        )
        # Award points to the reporter for helpful report
        await db.users.update_one(
            {"email": report['driver_email']},
            {"$inc": {"reward_points": 5}}
        )
    else:
        await db.parking_reports.update_one(
            {"id": report_id},
            {"$inc": {"not_helpful_votes": 1}}
        )
    
    # Recalculate accuracy score
    updated_report = await db.parking_reports.find_one({"id": report_id}, {"_id": 0})
    total_votes = updated_report['helpful_votes'] + updated_report['not_helpful_votes']
    if total_votes > 0:
        accuracy = updated_report['helpful_votes'] / total_votes
        await db.parking_reports.update_one(
            {"id": report_id},
            {"$set": {"accuracy_score": accuracy}}
        )
    
    return {"message": "Vote recorded", "vote": vote}

@api_router.get("/reports/leaderboard")
async def get_reporter_leaderboard():
    """Get top contributors for parking reports"""
    pipeline = [
        {"$group": {
            "_id": "$driver_email",
            "driver_name": {"$first": "$driver_name"},
            "total_reports": {"$sum": 1},
            "total_helpful": {"$sum": "$helpful_votes"},
            "avg_accuracy": {"$avg": "$accuracy_score"}
        }},
        {"$sort": {"total_reports": -1}},
        {"$limit": 10}
    ]
    
    leaders = await db.parking_reports.aggregate(pipeline).to_list(10)
    
    # Add rank and format
    for i, leader in enumerate(leaders):
        leader['rank'] = i + 1
        leader['email'] = leader.pop('_id')
    
    return leaders

# ============== BOOKING ROUTES ==============

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user or user['role'] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can create bookings")
    
    spot = await db.parking_spots.find_one({"id": booking_data.spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Parking spot not found")
    
    if spot['available_spaces'] <= 0:
        raise HTTPException(status_code=400, detail="No available spaces")
    
    days = (booking_data.check_out_date - booking_data.check_in_date).days
    if days <= 0:
        days = 1
    total_price = spot['price_per_night'] * days if not spot['is_free'] else 0.0
    
    booking = Booking(
        driver_id=user['id'],
        driver_name=user['name'],
        driver_email=user['email'],
        spot_id=spot['id'],
        spot_name=spot['name'],
        spot_address=spot['address'],
        check_in_date=booking_data.check_in_date,
        check_out_date=booking_data.check_out_date,
        total_price=total_price,
        payment_status="pending" if total_price > 0 else "paid",
        booking_status="confirmed"
    )
    
    booking_doc = booking.model_dump()
    booking_doc['created_at'] = booking_doc['created_at'].isoformat()
    booking_doc['check_in_date'] = booking_doc['check_in_date'].isoformat()
    booking_doc['check_out_date'] = booking_doc['check_out_date'].isoformat()
    
    await db.bookings.insert_one(booking_doc)
    
    await db.parking_spots.update_one(
        {"id": spot['id']},
        {"$inc": {"available_spaces": -1}}
    )
    
    # Award 100 reward points to the driver
    await db.users.update_one(
        {"email": user['email']},
        {"$inc": {"reward_points": 100}}
    )
    
    logger.info(f"Booking created: {booking.id} for spot {spot['name']}. Driver awarded 100 points.")
    return booking

@api_router.get("/bookings/driver/{driver_email}", response_model=List[Booking])
async def get_driver_bookings(driver_email: str):
    bookings = await db.bookings.find({"driver_email": driver_email}, {"_id": 0}).to_list(1000)
    
    for booking in bookings:
        if isinstance(booking.get('created_at'), str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        if isinstance(booking.get('check_in_date'), str):
            booking['check_in_date'] = datetime.fromisoformat(booking['check_in_date'])
        if isinstance(booking.get('check_out_date'), str):
            booking['check_out_date'] = datetime.fromisoformat(booking['check_out_date'])
    
    return bookings

@api_router.get("/bookings/spot/{spot_id}", response_model=List[Booking])
async def get_spot_bookings(spot_id: str):
    bookings = await db.bookings.find({"spot_id": spot_id}, {"_id": 0}).to_list(1000)
    
    for booking in bookings:
        if isinstance(booking.get('created_at'), str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        if isinstance(booking.get('check_in_date'), str):
            booking['check_in_date'] = datetime.fromisoformat(booking['check_in_date'])
        if isinstance(booking.get('check_out_date'), str):
            booking['check_out_date'] = datetime.fromisoformat(booking['check_out_date'])
    
    return bookings

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments/create-checkout")
async def create_checkout_session(booking_id: str, request: Request):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['total_price'] <= 0:
        return {"message": "No payment required for free parking"}
    
    origin = str(request.base_url).rstrip('/')
    
    stripe_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
    webhook_url = f"{origin}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=booking['total_price'],
        currency="usd",
        success_url=f"{origin}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}",
        cancel_url=f"{origin}/payment-cancelled",
        metadata={
            "booking_id": booking_id,
            "driver_email": booking['driver_email'],
            "spot_name": booking['spot_name']
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"session_id": session.session_id}}
    )
    
    transaction = PaymentTransaction(
        booking_id=booking_id,
        amount=booking['total_price'],
        session_id=session.session_id,
        payment_status="pending"
    )
    
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    await db.payment_transactions.insert_one(trans_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    stripe_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
    webhook_url = ""
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction and transaction['payment_status'] != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            await db.bookings.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
    
    return status.model_dump()

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        stripe_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
        webhook_url = ""
        stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
        
        event = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook event: {event.event_type}")
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

# ============== LOAD BOARD ROUTES ==============

@api_router.get("/loads", response_model=List[Load])
async def get_loads(
    origin_state: Optional[str] = None,
    destination_state: Optional[str] = None,
    equipment_type: Optional[str] = None
):
    query = {"status": "available"}
    if origin_state:
        query['origin_state'] = {"$regex": origin_state, "$options": "i"}
    if destination_state:
        query['destination_state'] = {"$regex": destination_state, "$options": "i"}
    if equipment_type:
        query['equipment_type'] = equipment_type
    
    loads = await db.loads.find(query, {"_id": 0}).to_list(1000)
    
    for load in loads:
        if isinstance(load.get('pickup_date'), str):
            load['pickup_date'] = datetime.fromisoformat(load['pickup_date'])
        if isinstance(load.get('delivery_date'), str):
            load['delivery_date'] = datetime.fromisoformat(load['delivery_date'])
        if isinstance(load.get('created_at'), str):
            load['created_at'] = datetime.fromisoformat(load['created_at'])
    
    return loads

@api_router.post("/loads", response_model=Load)
async def create_load(load_data: LoadCreate):
    load = Load(**load_data.model_dump())
    
    load_doc = load.model_dump()
    load_doc['pickup_date'] = load_doc['pickup_date'].isoformat()
    load_doc['delivery_date'] = load_doc['delivery_date'].isoformat()
    load_doc['created_at'] = load_doc['created_at'].isoformat()
    
    await db.loads.insert_one(load_doc)
    logger.info(f"Load created: {load.origin_city} to {load.destination_city}")
    return load

# ============== EXPENSE TRACKER ROUTES ==============

@api_router.get("/expenses/{driver_email}", response_model=List[Expense])
async def get_expenses(driver_email: str):
    expenses = await db.expenses.find({"driver_email": driver_email}, {"_id": 0}).to_list(1000)
    
    for expense in expenses:
        if isinstance(expense.get('date'), str):
            expense['date'] = datetime.fromisoformat(expense['date'])
        if isinstance(expense.get('created_at'), str):
            expense['created_at'] = datetime.fromisoformat(expense['created_at'])
    
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, driver_email: str):
    expense = Expense(
        driver_email=driver_email,
        **expense_data.model_dump()
    )
    
    expense_doc = expense.model_dump()
    expense_doc['date'] = expense_doc['date'].isoformat()
    expense_doc['created_at'] = expense_doc['created_at'].isoformat()
    
    await db.expenses.insert_one(expense_doc)
    logger.info(f"Expense logged: {expense.category} - ${expense.amount}")
    return expense

@api_router.get("/expenses/{driver_email}/summary")
async def get_expense_summary(driver_email: str):
    expenses = await db.expenses.find({"driver_email": driver_email}, {"_id": 0}).to_list(10000)
    
    total = sum(e['amount'] for e in expenses)
    by_category = {}
    for e in expenses:
        cat = e['category']
        by_category[cat] = by_category.get(cat, 0) + e['amount']
    
    return {
        "total": total,
        "by_category": by_category,
        "count": len(expenses)
    }

# ============== MAINTENANCE REMINDERS ==============

@api_router.get("/maintenance/{driver_email}", response_model=List[MaintenanceReminder])
async def get_maintenance_reminders(driver_email: str):
    reminders = await db.maintenance_reminders.find(
        {"driver_email": driver_email, "is_completed": False},
        {"_id": 0}
    ).to_list(1000)
    
    for reminder in reminders:
        if isinstance(reminder.get('created_at'), str):
            reminder['created_at'] = datetime.fromisoformat(reminder['created_at'])
    
    return reminders

@api_router.post("/maintenance", response_model=MaintenanceReminder)
async def create_maintenance_reminder(reminder_data: MaintenanceReminderCreate, driver_email: str):
    reminder = MaintenanceReminder(
        driver_email=driver_email,
        **reminder_data.model_dump()
    )
    
    reminder_doc = reminder.model_dump()
    reminder_doc['created_at'] = reminder_doc['created_at'].isoformat()
    
    await db.maintenance_reminders.insert_one(reminder_doc)
    logger.info(f"Maintenance reminder created: {reminder.maintenance_type}")
    return reminder

@api_router.put("/maintenance/{reminder_id}/complete")
async def complete_maintenance(reminder_id: str):
    result = await db.maintenance_reminders.update_one(
        {"id": reminder_id},
        {"$set": {"is_completed": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"message": "Maintenance marked as completed"}

# Note: Main Emergency SOS endpoint is defined later in the file (around line 2062)
# This section only contains the active emergencies lookup

@api_router.get("/emergency/sos/active")
async def get_active_emergencies():
    emergencies = await db.emergency_sos.find(
        {"status": "active"},
        {"_id": 0}
    ).to_list(1000)
    
    for sos in emergencies:
        if isinstance(sos.get('created_at'), str):
            sos['created_at'] = datetime.fromisoformat(sos['created_at'])
    
    return emergencies

# ============== HOS (HOURS OF SERVICE) ==============

@api_router.get("/hos/{driver_email}")
async def get_hos_status(driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle case where HOS fields don't exist yet
    hos_last_reset = user.get('hos_last_reset')
    hos_hours_remaining = user.get('hos_hours_remaining', 11.0)
    
    if not hos_last_reset:
        # Initialize HOS for user if not set
        now = datetime.now(timezone.utc)
        hos_last_reset = now.isoformat()
        await db.users.update_one(
            {"email": driver_email},
            {"$set": {"hos_last_reset": hos_last_reset, "hos_hours_remaining": 11.0}}
        )
        return {
            "hours_remaining": 11.0,
            "last_reset": hos_last_reset,
            "status": "good"
        }
    
    # Calculate hours since last reset
    last_reset = datetime.fromisoformat(hos_last_reset)
    hours_since_reset = (datetime.now(timezone.utc) - last_reset).total_seconds() / 3600
    
    hours_remaining = max(0, hos_hours_remaining - hours_since_reset)
    
    return {
        "hours_remaining": round(hours_remaining, 1),
        "last_reset": hos_last_reset,
        "status": "good" if hours_remaining > 2 else "warning" if hours_remaining > 0 else "violation"
    }

@api_router.post("/hos/{driver_email}/reset")
async def reset_hos(driver_email: str):
    result = await db.users.update_one(
        {"email": driver_email},
        {
            "$set": {
                "hos_hours_remaining": 11.0,
                "hos_last_reset": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Award 50 points for completing a rest period
    await db.users.update_one(
        {"email": driver_email},
        {"$inc": {"reward_points": 50}}
    )
    
    return {"message": "HOS reset successful. Awarded 50 points for rest compliance."}

# ============== SPOT REVIEWS ==============

@api_router.get("/reviews/spot/{spot_id}")
async def get_spot_reviews(spot_id: str):
    reviews = await db.spot_reviews.find({"spot_id": spot_id}, {"_id": 0}).to_list(1000)
    
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    
    return reviews

@api_router.post("/reviews")
async def create_review(review_data: SpotReviewCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    spot = await db.parking_spots.find_one({"id": review_data.spot_id})
    if not spot:
        raise HTTPException(status_code=404, detail="Parking spot not found")
    
    # Check if driver actually booked this spot
    booking = await db.bookings.find_one({
        "driver_email": driver_email,
        "spot_id": review_data.spot_id,
        "booking_status": "completed"
    })
    
    review = SpotReview(
        **review_data.model_dump(),
        driver_email=user['email'],
        driver_name=user['name'],
        spot_name=spot['name'],
        verified_booking=booking is not None
    )
    
    review_doc = review.model_dump()
    review_doc['created_at'] = review_doc['created_at'].isoformat()
    
    await db.spot_reviews.insert_one(review_doc)
    
    # Update spot average rating
    all_reviews = await db.spot_reviews.find({"spot_id": review_data.spot_id}).to_list(1000)
    avg_rating = sum(r['rating'] for r in all_reviews) / len(all_reviews)
    
    await db.parking_spots.update_one(
        {"id": review_data.spot_id},
        {"$set": {"rating": round(avg_rating, 1), "total_reviews": len(all_reviews)}}
    )
    
    # Award 25 points for leaving a review
    await db.users.update_one(
        {"email": driver_email},
        {"$inc": {"reward_points": 25}}
    )
    
    logger.info(f"Review created for {spot['name']} by {user['name']}")
    return review

@api_router.get("/reviews/summary/{spot_id}")
async def get_review_summary(spot_id: str):
    reviews = await db.spot_reviews.find({"spot_id": spot_id}).to_list(1000)
    
    if not reviews:
        return {
            "total_reviews": 0,
            "average_rating": 0,
            "cleanliness_avg": 0,
            "safety_avg": 0,
            "amenities_avg": 0
        }
    
    return {
        "total_reviews": len(reviews),
        "average_rating": round(sum(r['rating'] for r in reviews) / len(reviews), 1),
        "cleanliness_avg": round(sum(r['cleanliness_rating'] for r in reviews) / len(reviews), 1),
        "safety_avg": round(sum(r['safety_rating'] for r in reviews) / len(reviews), 1),
        "amenities_avg": round(sum(r['amenities_rating'] for r in reviews) / len(reviews), 1)
    }

# ============== CONVOY FINDER ==============

@api_router.get("/convoy/posts")
async def get_convoy_posts(
    origin_state: Optional[str] = None,
    destination_state: Optional[str] = None
):
    query = {"status": "open"}
    if origin_state:
        query['origin_state'] = {"$regex": origin_state, "$options": "i"}
    if destination_state:
        query['destination_state'] = {"$regex": destination_state, "$options": "i"}
    
    posts = await db.convoy_posts.find(query, {"_id": 0}).to_list(1000)
    
    for post in posts:
        if isinstance(post.get('departure_date'), str):
            post['departure_date'] = datetime.fromisoformat(post['departure_date'])
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
    
    return posts

@api_router.post("/convoy/posts")
async def create_convoy_post(post_data: ConvoyPostCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    post = ConvoyPost(
        driver_email=user['email'],
        driver_name=user['name'],
        **post_data.model_dump()
    )
    
    post_doc = post.model_dump()
    post_doc['departure_date'] = post_doc['departure_date'].isoformat()
    post_doc['created_at'] = post_doc['created_at'].isoformat()
    
    await db.convoy_posts.insert_one(post_doc)
    logger.info(f"Convoy post created: {post.origin_city} to {post.destination_city}")
    return post

@api_router.post("/convoy/posts/{post_id}/join")
async def join_convoy(post_id: str, driver_email: str):
    post = await db.convoy_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Convoy post not found")
    
    if post['current_drivers'] >= post['max_drivers']:
        raise HTTPException(status_code=400, detail="Convoy is full")
    
    # Check if already joined
    interested = post.get('interested_drivers', [])
    if driver_email in interested or driver_email == post['driver_email']:
        raise HTTPException(status_code=400, detail="Already in this convoy")
    
    result = await db.convoy_posts.update_one(
        {"id": post_id},
        {
            "$inc": {"current_drivers": 1},
            "$push": {"interested_drivers": driver_email}
        }
    )
    
    # Check if now full
    updated = await db.convoy_posts.find_one({"id": post_id})
    if updated['current_drivers'] >= updated['max_drivers']:
        await db.convoy_posts.update_one(
            {"id": post_id},
            {"$set": {"status": "full"}}
        )
    
    # Notify convoy leader
    leader = await db.users.find_one({"email": post['driver_email']})
    joiner = await db.users.find_one({"email": driver_email})
    if leader and joiner:
        notification = Notification(
            recipient_email=post['driver_email'],
            sender_email=driver_email,
            sender_name=joiner['name'],
            type="convoy_join",
            title="🚛 New Convoy Member!",
            message=f"{joiner['name']} joined your convoy to {post['destination_city']}, {post['destination_state']}",
            data={"convoy_id": post_id}
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
    
    return {"message": "Joined convoy successfully"}

# ============== SHARE LOCATION ==============

class SharedLocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    driver_name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    message: Optional[str] = None
    convoy_id: Optional[str] = None  # If sharing with specific convoy
    shared_with: List[str] = []  # List of emails to share with
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShareLocationRequest(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    message: Optional[str] = None
    convoy_id: Optional[str] = None
    share_with_emails: Optional[List[str]] = []
    duration_minutes: Optional[int] = 60  # Default 1 hour

@api_router.post("/location/share")
async def share_location(location_data: ShareLocationRequest, driver_email: str):
    """Share current location with convoy members or specific drivers"""
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate expiration time
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=location_data.duration_minutes or 60)
    
    # If sharing with convoy, get convoy members
    shared_with = location_data.share_with_emails or []
    if location_data.convoy_id:
        convoy = await db.convoy_posts.find_one({"id": location_data.convoy_id})
        if convoy:
            shared_with.extend(convoy.get('interested_drivers', []))
            shared_with.append(convoy.get('leader_email', ''))
    
    # Remove duplicates and self
    shared_with = list(set([e for e in shared_with if e and e != driver_email]))
    
    shared_location = SharedLocation(
        driver_email=driver_email,
        driver_name=user['name'],
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        address=location_data.address,
        message=location_data.message,
        convoy_id=location_data.convoy_id,
        shared_with=shared_with,
        expires_at=expires_at
    )
    
    loc_doc = shared_location.model_dump()
    loc_doc['created_at'] = loc_doc['created_at'].isoformat()
    loc_doc['expires_at'] = loc_doc['expires_at'].isoformat() if loc_doc['expires_at'] else None
    
    await db.shared_locations.insert_one(loc_doc)
    
    # Create notifications for all recipients
    for recipient_email in shared_with:
        notification = Notification(
            recipient_email=recipient_email,
            sender_email=driver_email,
            sender_name=user['name'],
            type="location_share",
            title="📍 Location Shared",
            message=f"{user['name']} shared their location with you" + (f": {location_data.message}" if location_data.message else ""),
            data={
                "share_id": shared_location.id,
                "latitude": location_data.latitude,
                "longitude": location_data.longitude,
                "address": location_data.address,
                "expires_at": expires_at.isoformat()
            }
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
    
    logger.info(f"📍 Location shared by {user['name']} with {len(shared_with)} drivers")
    
    return {
        "message": f"Location shared with {len(shared_with)} drivers!",
        "share_id": shared_location.id,
        "expires_at": expires_at.isoformat(),
        "recipients": len(shared_with),
        "notifications_sent": len(shared_with)
    }

@api_router.get("/location/shared-with-me/{driver_email}")
async def get_shared_locations(driver_email: str):
    """Get locations shared with this driver"""
    now = datetime.now(timezone.utc)
    
    # Find non-expired locations shared with this driver
    locations = await db.shared_locations.find({
        "shared_with": driver_email,
        "$or": [
            {"expires_at": {"$gt": now.isoformat()}},
            {"expires_at": None}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return locations

@api_router.get("/location/my-shares/{driver_email}")
async def get_my_shared_locations(driver_email: str):
    """Get locations I have shared"""
    locations = await db.shared_locations.find(
        {"driver_email": driver_email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return locations

@api_router.delete("/location/share/{share_id}")
async def stop_sharing_location(share_id: str, driver_email: str):
    """Stop sharing a location"""
    result = await db.shared_locations.delete_one({
        "id": share_id,
        "driver_email": driver_email
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shared location not found")
    
    return {"message": "Location sharing stopped"}

# ============== NOTIFICATIONS ==============

@api_router.get("/notifications/{driver_email}")
async def get_notifications(driver_email: str, unread_only: bool = False, limit: int = 50):
    """Get notifications for a driver"""
    query = {"recipient_email": driver_email}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return notifications

@api_router.get("/notifications/{driver_email}/count")
async def get_unread_notification_count(driver_email: str):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({
        "recipient_email": driver_email,
        "is_read": False
    })
    return {"unread_count": count}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, driver_email: str):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id, "recipient_email": driver_email},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/{driver_email}/read-all")
async def mark_all_notifications_read(driver_email: str):
    """Mark all notifications as read"""
    result = await db.notifications.update_many(
        {"recipient_email": driver_email, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, driver_email: str):
    """Delete a notification"""
    result = await db.notifications.delete_one({
        "id": notification_id,
        "recipient_email": driver_email
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}

# ============== DRIVER CHAT ==============

@api_router.get("/chat/{location_name}")
async def get_chat_messages(location_name: str, limit: int = 50):
    messages = await db.driver_chat.find(
        {"location_name": location_name},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    return messages[::-1]  # Reverse to show oldest first

@api_router.post("/chat")
async def post_chat_message(chat_data: DriverChatCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    chat = DriverChat(
        driver_email=user['email'],
        driver_name=user['name'],
        **chat_data.model_dump()
    )
    
    chat_doc = chat.model_dump()
    chat_doc['created_at'] = chat_doc['created_at'].isoformat()
    
    await db.driver_chat.insert_one(chat_doc)
    return chat

# ============== TRIP PROFIT CALCULATOR ==============

@api_router.post("/calculator/trip-profit")
async def calculate_trip_profit(
    load_id: str,
    driver_email: str,
    custom_fuel_price: Optional[float] = None,
    custom_toll_cost: Optional[float] = None,
    custom_parking_cost: Optional[float] = None
):
    load = await db.loads.find_one({"id": load_id})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Calculate fuel cost (avg 6 MPG for trucks)
    mpg = 6.0
    fuel_price_per_gallon = custom_fuel_price or 3.89
    fuel_gallons = load['distance'] / mpg
    estimated_fuel_cost = fuel_gallons * fuel_price_per_gallon
    
    # Estimate tolls (varies by route, assume $0.50/mile for toll roads)
    toll_cost = custom_toll_cost or (load['distance'] * 0.10)
    
    # Estimate parking (1-2 nights depending on distance)
    nights = max(1, load['distance'] // 500)
    parking_cost = custom_parking_cost or (nights * 25)
    
    total_expenses = estimated_fuel_cost + toll_cost + parking_cost
    net_profit = load['rate'] - total_expenses
    profit_per_mile = net_profit / load['distance']
    
    calculation = TripCalculation(
        load_id=load_id,
        load_rate=load['rate'],
        distance=load['distance'],
        estimated_fuel_cost=round(estimated_fuel_cost, 2),
        toll_cost=round(toll_cost, 2),
        parking_cost=round(parking_cost, 2),
        total_expenses=round(total_expenses, 2),
        net_profit=round(net_profit, 2),
        profit_per_mile=round(profit_per_mile, 2),
        is_profitable=net_profit > 0
    )
    
    return calculation

# ============== DETENTION CLAIMS ==============

@api_router.get("/detention/{driver_email}")
async def get_detention_claims(driver_email: str):
    claims = await db.detention_claims.find(
        {"driver_email": driver_email},
        {"_id": 0}
    ).to_list(1000)
    
    for claim in claims:
        if isinstance(claim.get('start_time'), str):
            claim['start_time'] = datetime.fromisoformat(claim['start_time'])
        if isinstance(claim.get('end_time'), str):
            claim['end_time'] = datetime.fromisoformat(claim['end_time'])
        if isinstance(claim.get('created_at'), str):
            claim['created_at'] = datetime.fromisoformat(claim['created_at'])
    
    return claims

@api_router.post("/detention")
async def create_detention_claim(claim_data: DetentionClaimCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    total_amount = claim_data.detention_hours * claim_data.hourly_rate
    
    claim = DetentionClaim(
        driver_email=user['email'],
        driver_name=user['name'],
        total_amount=total_amount,
        **claim_data.model_dump()
    )
    
    claim_doc = claim.model_dump()
    claim_doc['start_time'] = claim_doc['start_time'].isoformat()
    claim_doc['end_time'] = claim_doc['end_time'].isoformat()
    claim_doc['created_at'] = claim_doc['created_at'].isoformat()
    
    await db.detention_claims.insert_one(claim_doc)
    logger.info(f"Detention claim created: ${total_amount} from {claim_data.broker_name}")
    return claim

@api_router.get("/detention/{driver_email}/total")
async def get_detention_total(driver_email: str):
    claims = await db.detention_claims.find({"driver_email": driver_email}).to_list(10000)
    
    total_pending = sum(c['total_amount'] for c in claims if c['status'] == 'pending')
    total_paid = sum(c['total_amount'] for c in claims if c['status'] == 'paid')
    
    return {
        "total_pending": round(total_pending, 2),
        "total_paid": round(total_paid, 2),
        "total_claims": len(claims)
    }

# ============== DOT COMPLIANCE ==============

@api_router.get("/compliance/{driver_email}")
async def get_compliance_status(driver_email: str):
    compliance = await db.dot_compliance.find_one({"driver_email": driver_email}, {"_id": 0})
    
    if not compliance:
        return {"message": "No compliance data found"}
    
    if isinstance(compliance.get('cdl_expiry'), str):
        compliance['cdl_expiry'] = datetime.fromisoformat(compliance['cdl_expiry'])
    if isinstance(compliance.get('medical_card_expiry'), str):
        compliance['medical_card_expiry'] = datetime.fromisoformat(compliance['medical_card_expiry'])
    if compliance.get('hazmat_expiry') and isinstance(compliance['hazmat_expiry'], str):
        compliance['hazmat_expiry'] = datetime.fromisoformat(compliance['hazmat_expiry'])
    if compliance.get('created_at') and isinstance(compliance['created_at'], str):
        compliance['created_at'] = datetime.fromisoformat(compliance['created_at'])
    
    # Calculate days until expiration - ensure timezone-aware comparison
    now = datetime.now(timezone.utc)
    cdl_expiry = compliance['cdl_expiry']
    medical_expiry = compliance['medical_card_expiry']
    
    # Make sure dates are timezone-aware
    if cdl_expiry.tzinfo is None:
        cdl_expiry = cdl_expiry.replace(tzinfo=timezone.utc)
    if medical_expiry.tzinfo is None:
        medical_expiry = medical_expiry.replace(tzinfo=timezone.utc)
    
    cdl_days = (cdl_expiry - now).days
    medical_days = (medical_expiry - now).days
    
    alerts = []
    if cdl_days < 30:
        alerts.append({"type": "cdl", "message": f"CDL expires in {cdl_days} days", "severity": "high" if cdl_days < 14 else "medium"})
    if medical_days < 30:
        alerts.append({"type": "medical", "message": f"Medical card expires in {medical_days} days", "severity": "high" if medical_days < 14 else "medium"})
    
    compliance['alerts'] = alerts
    
    return compliance

@api_router.post("/compliance")
async def create_compliance_record(compliance_data: DOTComplianceCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    compliance = DOTCompliance(
        driver_email=user['email'],
        **compliance_data.model_dump()
    )
    
    compliance_doc = compliance.model_dump()
    compliance_doc['cdl_expiry'] = compliance_doc['cdl_expiry'].isoformat()
    compliance_doc['medical_card_expiry'] = compliance_doc['medical_card_expiry'].isoformat()
    if compliance_doc.get('hazmat_expiry'):
        compliance_doc['hazmat_expiry'] = compliance_doc['hazmat_expiry'].isoformat()
    if compliance_doc.get('twic_card_expiry'):
        compliance_doc['twic_card_expiry'] = compliance_doc['twic_card_expiry'].isoformat()
    compliance_doc['created_at'] = compliance_doc['created_at'].isoformat()
    
    # Upsert (update if exists, insert if not)
    await db.dot_compliance.update_one(
        {"driver_email": driver_email},
        {"$set": compliance_doc},
        upsert=True
    )
    
    return compliance

# ============== BROKER RATINGS & FRAUD DETECTION ==============

@api_router.get("/brokers/ratings/{broker_name}")
async def get_broker_ratings(broker_name: str):
    ratings = await db.broker_ratings.find(
        {"broker_name": {"$regex": broker_name, "$options": "i"}},
        {"_id": 0}
    ).to_list(1000)
    
    for rating in ratings:
        if isinstance(rating.get('created_at'), str):
            rating['created_at'] = datetime.fromisoformat(rating['created_at'])
    
    return ratings

@api_router.get("/brokers/summary/{broker_name}", response_model=BrokerSummary)
async def get_broker_summary(broker_name: str):
    ratings = await db.broker_ratings.find(
        {"broker_name": {"$regex": broker_name, "$options": "i"}}
    ).to_list(10000)
    
    if not ratings:
        raise HTTPException(status_code=404, detail="No ratings found for this broker")
    
    total = len(ratings)
    avg_rating = sum(r['rating'] for r in ratings) / total
    avg_payment = sum(r['payment_rating'] for r in ratings) / total
    
    payment_days_list = [r['payment_days'] for r in ratings if r.get('payment_days')]
    avg_payment_days = sum(payment_days_list) / len(payment_days_list) if payment_days_list else 0
    
    fraud_count = sum(1 for r in ratings if r.get('fraud_reported'))
    would_work = sum(1 for r in ratings if r.get('would_work_again'))
    verified = sum(1 for r in ratings if r.get('verified_load'))
    
    return BrokerSummary(
        broker_name=ratings[0]['broker_name'],
        mc_number=ratings[0].get('mc_number'),
        total_reviews=total,
        average_rating=round(avg_rating, 2),
        average_payment_rating=round(avg_payment, 2),
        average_payment_days=round(avg_payment_days, 1),
        fraud_reports=fraud_count,
        would_work_again_percentage=round((would_work / total) * 100, 1),
        verified_reviews=verified
    )

@api_router.post("/brokers/rate")
async def rate_broker(rating_data: BrokerRatingCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    rating = BrokerRating(
        driver_email=user['email'],
        driver_name=user['name'],
        **rating_data.model_dump()
    )
    
    rating_doc = rating.model_dump()
    rating_doc['created_at'] = rating_doc['created_at'].isoformat()
    
    await db.broker_ratings.insert_one(rating_doc)
    
    # Award points for rating brokers
    await db.users.update_one(
        {"email": driver_email},
        {"$inc": {"reward_points": 50}}
    )
    
    # Alert community if fraud reported
    if rating.fraud_reported:
        logger.warning(f"FRAUD ALERT: {rating.broker_name} reported by {user['name']} - Type: {rating.fraud_type}")
    
    return rating

@api_router.get("/brokers/fraud-alerts")
async def get_fraud_alerts(limit: int = 50):
    alerts = await db.broker_ratings.find(
        {"fraud_reported": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for alert in alerts:
        if isinstance(alert.get('created_at'), str):
            alert['created_at'] = datetime.fromisoformat(alert['created_at'])
    
    return alerts

# ============== SHOWER CREDITS TRACKER ==============

@api_router.get("/shower-credits/{driver_email}")
async def get_shower_credits(driver_email: str):
    credits = await db.shower_credits.find(
        {"driver_email": driver_email},
        {"_id": 0}
    ).to_list(1000)
    
    for credit in credits:
        if isinstance(credit.get('last_updated'), str):
            credit['last_updated'] = datetime.fromisoformat(credit['last_updated'])
        if isinstance(credit.get('created_at'), str):
            credit['created_at'] = datetime.fromisoformat(credit['created_at'])
    
    return credits

@api_router.post("/shower-credits")
async def add_shower_credit(credit_data: ShowerCreditCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already exists
    existing = await db.shower_credits.find_one({
        "driver_email": driver_email,
        "chain": credit_data.chain
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already tracking this chain. Use update endpoint.")
    
    credit = ShowerCredit(
        driver_email=user['email'],
        **credit_data.model_dump()
    )
    
    credit_doc = credit.model_dump()
    credit_doc['last_updated'] = credit_doc['last_updated'].isoformat()
    credit_doc['created_at'] = credit_doc['created_at'].isoformat()
    
    await db.shower_credits.insert_one(credit_doc)
    return credit

@api_router.put("/shower-credits/{chain}")
async def update_shower_credit(chain: str, update_data: ShowerCreditUpdate, driver_email: str):
    updates = {}
    if update_data.available_showers is not None:
        updates['available_showers'] = update_data.available_showers
    if update_data.points_balance is not None:
        updates['points_balance'] = update_data.points_balance
    
    updates['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.shower_credits.update_one(
        {"driver_email": driver_email, "chain": chain},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shower credit not found")
    
    return {"message": "Updated successfully"}

@api_router.get("/shower-credits/{driver_email}/total")
async def get_shower_totals(driver_email: str):
    credits = await db.shower_credits.find({"driver_email": driver_email}).to_list(1000)
    
    total_showers = sum(c['available_showers'] for c in credits)
    total_points = sum(c['points_balance'] for c in credits)
    
    return {
        "total_available_showers": total_showers,
        "total_points": total_points,
        "chains_tracked": len(credits)
    }

# ============== RETAIL OVERNIGHT PARKING ==============

@api_router.get("/retail-parking")
async def get_retail_parking(
    city: Optional[str] = None,
    state: Optional[str] = None,
    chain: Optional[str] = None
):
    query = {"allows_overnight": True}
    if city:
        query['city'] = {"$regex": city, "$options": "i"}
    if state:
        query['state'] = {"$regex": state, "$options": "i"}
    if chain:
        query['chain'] = chain
    
    locations = await db.retail_parking.find(query, {"_id": 0}).to_list(1000)
    
    for loc in locations:
        if isinstance(loc.get('last_verified'), str):
            loc['last_verified'] = datetime.fromisoformat(loc['last_verified'])
        if isinstance(loc.get('created_at'), str):
            loc['created_at'] = datetime.fromisoformat(loc['created_at'])
    
    return locations

@api_router.post("/retail-parking")
async def add_retail_parking(parking_data: RetailParkingCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    parking = RetailParking(**parking_data.model_dump())
    
    parking_doc = parking.model_dump()
    parking_doc['last_verified'] = parking_doc['last_verified'].isoformat()
    parking_doc['created_at'] = parking_doc['created_at'].isoformat()
    
    await db.retail_parking.insert_one(parking_doc)
    
    # Award points for adding locations
    await db.users.update_one(
        {"email": driver_email},
        {"$inc": {"reward_points": 75}}
    )
    
    return parking

@api_router.get("/retail-parking/chains")
async def get_retail_chains():
    return {
        "chains": [
            {"id": "walmart", "name": "Walmart", "overnight_friendly": True},
            {"id": "lowes", "name": "Lowe's", "overnight_friendly": True},
            {"id": "home_depot", "name": "Home Depot", "overnight_friendly": False},
            {"id": "cracker_barrel", "name": "Cracker Barrel", "overnight_friendly": True},
            {"id": "cabelas", "name": "Cabela's", "overnight_friendly": True},
            {"id": "bass_pro", "name": "Bass Pro Shops", "overnight_friendly": True},
            {"id": "rest_area", "name": "Rest Area", "overnight_friendly": True},
            {"id": "truck_stop", "name": "Independent Truck Stop", "overnight_friendly": True}
        ]
    }

# ============== TRUCK ROUTE PLANNER ==============

@api_router.post("/routes/plan")
async def plan_truck_route(route_request: TruckRouteRequest, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate distance (simplified - in production use Google Maps API)
    import math
    
    lat1, lon1 = math.radians(route_request.origin_lat), math.radians(route_request.origin_lng)
    lat2, lon2 = math.radians(route_request.destination_lat), math.radians(route_request.destination_lng)
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    distance_miles = 3959 * c  # Earth radius in miles
    
    # Estimate drive time (50 mph average)
    drive_time_hours = distance_miles / 50
    
    # Calculate costs
    mpg = 6.0
    fuel_price = 3.89
    fuel_cost = (distance_miles / mpg) * fuel_price
    
    toll_cost = distance_miles * 0.10 if not route_request.avoid_tolls else 0
    
    # Check for restrictions
    warnings = []
    if route_request.truck_height_ft > 13.5:
        warnings.append("Height restriction: Some bridges may have 13'6\" clearance")
    if route_request.truck_weight_lbs > 80000:
        warnings.append("Overweight: Special permits required")
    if route_request.hazmat:
        warnings.append("Hazmat: Tunnel and city restrictions apply")
    
    # Find parking stops if requested
    waypoints = []
    if route_request.include_parking_stops:
        # Get parking along route (simplified)
        spots = await db.parking_spots.find(
            {"available_spaces": {"$gt": 0}},
            {"_id": 0}
        ).limit(3).to_list(3)
        
        waypoints = [{
            "type": "parking",
            "name": spot['name'],
            "lat": spot['latitude'],
            "lng": spot['longitude']
        } for spot in spots]
    
    route = TruckRoute(
        driver_email=user['email'],
        **route_request.model_dump(),
        total_distance_miles=round(distance_miles, 1),
        estimated_drive_time_hours=round(drive_time_hours, 1),
        estimated_fuel_cost=round(fuel_cost, 2),
        estimated_toll_cost=round(toll_cost, 2),
        warnings=warnings,
        waypoints=waypoints
    )
    
    route_doc = route.model_dump()
    route_doc['created_at'] = route_doc['created_at'].isoformat()
    
    await db.truck_routes.insert_one(route_doc)
    
    return route

@api_router.get("/routes/{driver_email}")
async def get_saved_routes(driver_email: str):
    routes = await db.truck_routes.find(
        {"driver_email": driver_email},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    for route in routes:
        if isinstance(route.get('created_at'), str):
            route['created_at'] = datetime.fromisoformat(route['created_at'])
    
    return routes

# ============== EMERGENCY SOS ==============

class EmergencySOS(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    driver_name: str
    driver_phone: Optional[str] = None
    emergency_type: str  # "medical", "breakdown", "accident", "threat", "other"
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_address: Optional[str] = None
    message: Optional[str] = None
    status: str = "active"  # "active", "responded", "resolved"
    responder_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

class EmergencyContact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    name: str
    phone: str
    relationship: str  # "spouse", "family", "friend", "employer", "other"
    is_primary: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/emergency/sos")
async def send_emergency_sos(
    driver_email: str,
    emergency_type: str,
    location_lat: Optional[float] = None,
    location_lng: Optional[float] = None,
    location_address: Optional[str] = None,
    message: Optional[str] = None
):
    """Send an emergency SOS alert"""
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sos = EmergencySOS(
        driver_email=driver_email,
        driver_name=user['name'],
        driver_phone=user.get('phone'),
        emergency_type=emergency_type,
        location_lat=location_lat,
        location_lng=location_lng,
        location_address=location_address,
        message=message
    )
    
    sos_doc = sos.model_dump()
    sos_doc['created_at'] = sos_doc['created_at'].isoformat()
    
    await db.emergency_sos.insert_one(sos_doc)
    
    # Get emergency contacts
    contacts = await db.emergency_contacts.find(
        {"driver_email": driver_email},
        {"_id": 0}
    ).to_list(10)
    
    # In production, send SMS/calls to contacts here
    logger.warning(f"🚨 EMERGENCY SOS from {user['name']}: {emergency_type} at {location_address}")
    
    return {
        "message": "Emergency SOS sent! Help is on the way.",
        "sos_id": sos.id,
        "contacts_notified": len(contacts),
        "emergency_numbers": {
            "911": "For immediate emergency",
            "roadside": "1-800-TRUCKERS",
            "police_non_emergency": "Local police"
        }
    }

@api_router.get("/emergency/sos/{driver_email}")
async def get_driver_sos_history(driver_email: str):
    """Get driver's SOS history"""
    sos_list = await db.emergency_sos.find(
        {"driver_email": driver_email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return sos_list

@api_router.post("/emergency/contacts")
async def add_emergency_contact(
    driver_email: str,
    name: str,
    phone: str,
    relationship: str,
    is_primary: bool = False
):
    """Add an emergency contact"""
    contact = EmergencyContact(
        driver_email=driver_email,
        name=name,
        phone=phone,
        relationship=relationship,
        is_primary=is_primary
    )
    
    # If setting as primary, unset other primaries
    if is_primary:
        await db.emergency_contacts.update_many(
            {"driver_email": driver_email},
            {"$set": {"is_primary": False}}
        )
    
    contact_doc = contact.model_dump()
    contact_doc['created_at'] = contact_doc['created_at'].isoformat()
    
    await db.emergency_contacts.insert_one(contact_doc)
    
    return {"message": "Emergency contact added", "contact_id": contact.id}

@api_router.get("/emergency/contacts/{driver_email}")
async def get_emergency_contacts(driver_email: str):
    """Get driver's emergency contacts"""
    contacts = await db.emergency_contacts.find(
        {"driver_email": driver_email},
        {"_id": 0}
    ).to_list(20)
    return contacts

@api_router.delete("/emergency/contacts/{contact_id}")
async def delete_emergency_contact(contact_id: str):
    """Delete an emergency contact"""
    result = await db.emergency_contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted"}

# ============== DOCUMENT SCANNER ==============

class ScannedDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    doc_type: str  # "bol", "receipt", "lumper", "scale_ticket", "delivery_receipt", "inspection", "other"
    title: str
    file_url: Optional[str] = None
    file_data: Optional[str] = None  # Base64 encoded for small files
    load_id: Optional[str] = None
    broker_name: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/documents/scan")
async def save_scanned_document(
    driver_email: str,
    doc_type: str,
    title: str,
    file_data: Optional[str] = None,
    load_id: Optional[str] = None,
    broker_name: Optional[str] = None,
    amount: Optional[float] = None,
    notes: Optional[str] = None
):
    """Save a scanned document"""
    doc = ScannedDocument(
        driver_email=driver_email,
        doc_type=doc_type,
        title=title,
        file_data=file_data,
        load_id=load_id,
        broker_name=broker_name,
        amount=amount,
        notes=notes
    )
    
    doc_dict = doc.model_dump()
    doc_dict['created_at'] = doc_dict['created_at'].isoformat()
    
    await db.scanned_documents.insert_one(doc_dict)
    
    # Award points for organizing documents
    await db.users.update_one(
        {"email": driver_email},
        {"$inc": {"reward_points": 10}}
    )
    
    return {"message": "Document saved successfully", "document_id": doc.id, "points_earned": 10}

@api_router.get("/documents/{driver_email}")
async def get_driver_documents(driver_email: str, doc_type: Optional[str] = None):
    """Get driver's scanned documents"""
    query = {"driver_email": driver_email}
    if doc_type:
        query['doc_type'] = doc_type
    
    docs = await db.scanned_documents.find(
        query,
        {"_id": 0, "file_data": 0}  # Exclude file_data for list view
    ).sort("created_at", -1).to_list(100)
    return docs

@api_router.get("/documents/detail/{document_id}")
async def get_document_detail(document_id: str):
    """Get a single document with full data"""
    doc = await db.scanned_documents.find_one(
        {"id": document_id},
        {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a scanned document"""
    result = await db.scanned_documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}

# ============== FUEL PRICES & ALERTS ==============

class FuelPrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    station_name: str
    chain: str  # "pilot", "loves", "ta_petro", "speedway", "independent"
    city: str
    state: str
    latitude: float
    longitude: float
    diesel_price: float
    unleaded_price: Optional[float] = None
    def_price: Optional[float] = None  # Diesel Exhaust Fluid
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reported_by: Optional[str] = None

class FuelAlert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    alert_type: str  # "price_drop", "low_price", "route_alert"
    target_price: Optional[float] = None  # Alert when price drops below this
    target_city: Optional[str] = None
    target_state: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/fuel/prices")
async def get_fuel_prices(city: Optional[str] = None, state: Optional[str] = None, chain: Optional[str] = None):
    """Get fuel prices, optionally filtered by location or chain"""
    query = {}
    if city:
        query['city'] = {"$regex": city, "$options": "i"}
    if state:
        query['state'] = state.upper()
    if chain:
        query['chain'] = chain
    
    prices = await db.fuel_prices.find(query, {"_id": 0}).sort("diesel_price", 1).to_list(100)
    return prices

@api_router.get("/fuel/prices/cheapest")
async def get_cheapest_fuel(state: Optional[str] = None, limit: int = 10):
    """Get the cheapest diesel prices"""
    query = {}
    if state:
        query['state'] = state.upper()
    
    prices = await db.fuel_prices.find(query, {"_id": 0}).sort("diesel_price", 1).to_list(limit)
    return prices

@api_router.post("/fuel/prices/report")
async def report_fuel_price(
    station_name: str,
    chain: str,
    city: str,
    state: str,
    diesel_price: float,
    driver_email: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    unleaded_price: Optional[float] = None,
    def_price: Optional[float] = None
):
    """Report/update a fuel price"""
    # Check if station exists
    existing = await db.fuel_prices.find_one({
        "station_name": station_name,
        "city": {"$regex": city, "$options": "i"}
    })
    
    price_data = {
        "station_name": station_name,
        "chain": chain,
        "city": city,
        "state": state.upper(),
        "latitude": latitude or 0,
        "longitude": longitude or 0,
        "diesel_price": diesel_price,
        "unleaded_price": unleaded_price,
        "def_price": def_price,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "reported_by": driver_email
    }
    
    if existing:
        await db.fuel_prices.update_one(
            {"id": existing['id']},
            {"$set": price_data}
        )
        message = "Fuel price updated"
    else:
        price_data['id'] = str(uuid.uuid4())
        await db.fuel_prices.insert_one(price_data)
        message = "Fuel price added"
    
    # Award points for reporting
    await db.users.update_one(
        {"email": driver_email},
        {"$inc": {"reward_points": 15}}
    )
    
    logger.info(f"Fuel price reported: {station_name} in {city}, {state} - ${diesel_price}")
    
    return {"message": message, "points_earned": 15}

@api_router.post("/fuel/alerts")
async def create_fuel_alert(
    driver_email: str,
    alert_type: str,
    target_price: Optional[float] = None,
    target_city: Optional[str] = None,
    target_state: Optional[str] = None
):
    """Create a fuel price alert"""
    alert = FuelAlert(
        driver_email=driver_email,
        alert_type=alert_type,
        target_price=target_price,
        target_city=target_city,
        target_state=target_state
    )
    
    alert_doc = alert.model_dump()
    alert_doc['created_at'] = alert_doc['created_at'].isoformat()
    
    await db.fuel_alerts.insert_one(alert_doc)
    
    return {"message": "Fuel alert created", "alert_id": alert.id}

@api_router.get("/fuel/alerts/{driver_email}")
async def get_fuel_alerts(driver_email: str):
    """Get driver's fuel alerts"""
    alerts = await db.fuel_alerts.find(
        {"driver_email": driver_email, "is_active": True},
        {"_id": 0}
    ).to_list(20)
    return alerts

@api_router.delete("/fuel/alerts/{alert_id}")
async def delete_fuel_alert(alert_id: str):
    """Delete a fuel alert"""
    result = await db.fuel_alerts.delete_one({"id": alert_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted"}

@api_router.get("/fuel/average")
async def get_fuel_average():
    """Get average fuel prices by state"""
    pipeline = [
        {"$group": {
            "_id": "$state",
            "avg_diesel": {"$avg": "$diesel_price"},
            "min_diesel": {"$min": "$diesel_price"},
            "max_diesel": {"$max": "$diesel_price"},
            "station_count": {"$sum": 1}
        }},
        {"$sort": {"avg_diesel": 1}}
    ]
    
    averages = await db.fuel_prices.aggregate(pipeline).to_list(60)
    
    for avg in averages:
        avg['state'] = avg.pop('_id')
        avg['avg_diesel'] = round(avg['avg_diesel'], 3) if avg['avg_diesel'] else 0
        avg['min_diesel'] = round(avg['min_diesel'], 3) if avg['min_diesel'] else 0
        avg['max_diesel'] = round(avg['max_diesel'], 3) if avg['max_diesel'] else 0
    
    return averages

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/stats", response_model=DashboardStats)
async def get_dashboard_stats(admin_email: str):
    user = await db.users.find_one({"email": admin_email})
    if not user or user['role'] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_spots = await db.parking_spots.count_documents({})
    active_spots = await db.parking_spots.count_documents({"status": "active"})
    total_bookings = await db.bookings.count_documents({})
    
    bookings = await db.bookings.find({"payment_status": "paid"}).to_list(10000)
    total_revenue = sum(b['total_price'] for b in bookings)
    
    return DashboardStats(
        total_spots=total_spots,
        active_spots=active_spots,
        total_bookings=total_bookings,
        total_revenue=total_revenue
    )

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(admin_email: str):
    user = await db.users.find_one({"email": admin_email})
    if not user or user['role'] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for u in users:
        if isinstance(u.get('created_at'), str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
        if isinstance(u.get('hos_last_reset'), str):
            u['hos_last_reset'] = datetime.fromisoformat(u['hos_last_reset'])
    
    return users

# ============== SUBSCRIPTION PLANS ==============

class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: float
    interval: str  # "month" or "year"
    features: List[str]
    is_popular: bool = False

class UserSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    plan_id: str
    plan_name: str
    status: str = "active"  # "active", "cancelled", "expired"
    stripe_subscription_id: Optional[str] = None
    current_period_start: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    current_period_end: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionCreate(BaseModel):
    plan_id: str

# Define subscription plans - Driver Plans
SUBSCRIPTION_PLANS = [
    {
        "id": "free",
        "name": "Free",
        "price": 0,
        "interval": "month",
        "type": "driver",
        "features": [
            "Basic parking search",
            "View 5 parking spots/day",
            "Basic load board access",
            "Community reviews (read only)"
        ],
        "is_popular": False
    },
    {
        "id": "pro",
        "name": "Pro Driver",
        "price": 9.99,
        "interval": "month",
        "type": "driver",
        "features": [
            "Unlimited parking search",
            "Real-time availability alerts",
            "Full load board access",
            "Broker ratings & fraud alerts",
            "Shower credits tracker",
            "Retail parking database",
            "Trip profit calculator",
            "Priority support"
        ],
        "is_popular": True
    },
    {
        "id": "premium",
        "name": "Premium Fleet",
        "price": 24.99,
        "interval": "month",
        "type": "driver",
        "features": [
            "Everything in Pro",
            "DOT compliance tracking",
            "Detention claims manager",
            "Convoy finder access",
            "Route planning (coming soon)",
            "Fuel price alerts",
            "Expense reports & analytics",
            "Multi-driver fleet management",
            "24/7 premium support"
        ],
        "is_popular": False
    }
]

# Partner/Parking Owner Plans
PARTNER_PLANS = [
    {
        "id": "partner-starter",
        "name": "Starter",
        "price": 0,
        "interval": "month",
        "type": "partner",
        "features": [
            "List up to 1 parking location",
            "Basic booking management",
            "Customer reviews",
            "Email notifications"
        ],
        "is_popular": False
    },
    {
        "id": "partner-business",
        "name": "Business",
        "price": 29.99,
        "interval": "month",
        "type": "partner",
        "features": [
            "List up to 5 parking locations",
            "Advanced booking management",
            "Priority listing in search",
            "Real-time availability updates",
            "Revenue analytics dashboard",
            "Customer messaging",
            "Promotional tools",
            "Standard support"
        ],
        "is_popular": True
    },
    {
        "id": "partner-enterprise",
        "name": "Enterprise",
        "price": 99.99,
        "interval": "month",
        "type": "partner",
        "features": [
            "Unlimited parking locations",
            "Everything in Business",
            "Featured placement in search",
            "API access for integrations",
            "Custom branding",
            "Multi-user access",
            "Advanced reporting & analytics",
            "Dedicated account manager",
            "24/7 priority support"
        ],
        "is_popular": False
    }
]

@api_router.get("/subscriptions/plans")
async def get_subscription_plans(plan_type: Optional[str] = None):
    if plan_type == "partner":
        return {"plans": PARTNER_PLANS}
    elif plan_type == "driver":
        return {"plans": SUBSCRIPTION_PLANS}
    return {"plans": SUBSCRIPTION_PLANS, "partner_plans": PARTNER_PLANS}

@api_router.get("/subscriptions/user/{user_email}")
async def get_user_subscription(user_email: str):
    subscription = await db.subscriptions.find_one(
        {"user_email": user_email, "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        # Return free plan by default
        return {
            "subscription": None,
            "current_plan": SUBSCRIPTION_PLANS[0],  # Free plan
            "is_subscribed": False
        }
    
    # Find the plan details
    plan = next((p for p in SUBSCRIPTION_PLANS if p["id"] == subscription["plan_id"]), SUBSCRIPTION_PLANS[0])
    
    if isinstance(subscription.get('current_period_start'), str):
        subscription['current_period_start'] = datetime.fromisoformat(subscription['current_period_start'])
    if isinstance(subscription.get('current_period_end'), str):
        subscription['current_period_end'] = datetime.fromisoformat(subscription['current_period_end'])
    if isinstance(subscription.get('created_at'), str):
        subscription['created_at'] = datetime.fromisoformat(subscription['created_at'])
    
    return {
        "subscription": subscription,
        "current_plan": plan,
        "is_subscribed": True
    }

@api_router.post("/subscriptions/create-checkout")
async def create_subscription_checkout(plan_id: str, user_email: str, request: Request):
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    plan = next((p for p in SUBSCRIPTION_PLANS if p["id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan["price"] == 0:
        # Free plan - just create the subscription
        subscription = UserSubscription(
            user_email=user_email,
            plan_id=plan_id,
            plan_name=plan["name"]
        )
        
        sub_doc = subscription.model_dump()
        sub_doc['current_period_start'] = sub_doc['current_period_start'].isoformat()
        sub_doc['current_period_end'] = sub_doc['current_period_end'].isoformat()
        sub_doc['created_at'] = sub_doc['created_at'].isoformat()
        
        # Remove any existing subscription
        await db.subscriptions.delete_many({"user_email": user_email})
        await db.subscriptions.insert_one(sub_doc)
        
        return {"message": "Free plan activated", "subscription_id": subscription.id}
    
    # For paid plans, create Stripe checkout
    origin = str(request.base_url).rstrip('/')
    
    stripe_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
    webhook_url = f"{origin}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=plan["price"],
        currency="usd",
        success_url=f"{origin}/subscription-success?session_id={{{{CHECKOUT_SESSION_ID}}}}&plan_id={plan_id}",
        cancel_url=f"{origin}/subscription-cancelled",
        metadata={
            "user_email": user_email,
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "type": "subscription"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.post("/subscriptions/activate")
async def activate_subscription(plan_id: str, user_email: str, session_id: Optional[str] = None):
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    plan = next((p for p in SUBSCRIPTION_PLANS if p["id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Verify payment if session_id provided
    if session_id and plan["price"] > 0:
        stripe_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
        stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        if status.payment_status != "paid":
            raise HTTPException(status_code=400, detail="Payment not completed")
    
    subscription = UserSubscription(
        user_email=user_email,
        plan_id=plan_id,
        plan_name=plan["name"],
        stripe_subscription_id=session_id
    )
    
    sub_doc = subscription.model_dump()
    sub_doc['current_period_start'] = sub_doc['current_period_start'].isoformat()
    sub_doc['current_period_end'] = sub_doc['current_period_end'].isoformat()
    sub_doc['created_at'] = sub_doc['created_at'].isoformat()
    
    # Remove any existing subscription
    await db.subscriptions.delete_many({"user_email": user_email})
    await db.subscriptions.insert_one(sub_doc)
    
    logger.info(f"Subscription activated: {plan['name']} for {user_email}")
    return {"message": "Subscription activated", "subscription": subscription}

@api_router.post("/subscriptions/cancel")
async def cancel_subscription(user_email: str):
    result = await db.subscriptions.update_one(
        {"user_email": user_email, "status": "active"},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    return {"message": "Subscription cancelled"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
