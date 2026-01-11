from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import random
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

# Health check endpoint (required for deployment) - on root path
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {"status": "healthy", "service": "trukall-backend"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Also add health check under /api for consistency
@api_router.get("/health")
async def api_health_check():
    """Health check endpoint under /api"""
    return {"status": "healthy", "service": "trukall-backend"}

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

# ============== WEATHER ALERT MODELS ==============

class WeatherAlert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_type: str  # "severe_weather", "road_hazard", "ice_warning", "flood", "high_winds"
    severity: str  # "low", "medium", "high", "critical"
    title: str
    description: str
    location: str  # City/State or coordinates description
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_miles: int = 50  # Affected radius
    active: bool = True
    reported_by: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WeatherAlertCreate(BaseModel):
    alert_type: str
    severity: str
    title: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_miles: int = 50
    expires_hours: int = 24  # Hours until expiration

# ============== CONVOY CHAT MODELS ==============

class ConvoyMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    convoy_id: str
    sender_email: str
    sender_name: str
    message: str
    message_type: str = "text"  # "text", "location", "photo", "alert"
    attachment_url: Optional[str] = None
    is_read_by: List[str] = []  # List of emails who read this
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConvoyMessageCreate(BaseModel):
    message: str
    message_type: str = "text"
    attachment_url: Optional[str] = None

# ============== NEW FEATURE MODELS ==============

# 1. Route Planner Model
class TruckRoute(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    origin: str
    origin_lat: float
    origin_lng: float
    destination: str
    destination_lat: float
    destination_lng: float
    truck_height: float = 13.6  # feet
    truck_weight: float = 80000  # lbs
    hazmat: bool = False
    avoid_tolls: bool = False
    total_distance: float = 0
    total_duration: float = 0  # minutes
    fuel_stops: List[dict] = []
    rest_stops: List[dict] = []
    restrictions: List[str] = []  # low bridges, weight limits, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RouteRequest(BaseModel):
    origin: str
    origin_lat: float
    origin_lng: float
    destination: str
    destination_lat: float
    destination_lng: float
    truck_height: float = 13.6
    truck_weight: float = 80000
    hazmat: bool = False
    avoid_tolls: bool = False

# 2. Analytics/Earnings Model
class DriverAnalytics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    driver_email: str
    period: str  # "week", "month", "year"
    total_earnings: float = 0
    total_miles: float = 0
    total_loads: int = 0
    total_expenses: float = 0
    net_profit: float = 0
    avg_rate_per_mile: float = 0
    fuel_expenses: float = 0
    parking_expenses: float = 0
    maintenance_expenses: float = 0
    top_routes: List[dict] = []
    earnings_by_day: List[dict] = []

class EarningsEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    amount: float
    source: str  # "load", "bonus", "detention", "other"
    description: str
    load_id: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# 3. Direct Messaging Model
class DirectMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_email: str
    sender_name: str
    recipient_email: str
    message: str
    message_type: str = "text"  # "text", "image", "location"
    attachment_url: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DirectMessageCreate(BaseModel):
    recipient_email: str
    message: str
    message_type: str = "text"
    attachment_url: Optional[str] = None

# 4. Photo Reviews Model (extends existing reviews)
class PhotoReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    spot_id: str
    driver_email: str
    driver_name: str
    rating: int  # 1-5
    comment: str
    photos: List[str] = []  # List of photo URLs
    cleanliness: int = 0  # 1-5
    safety: int = 0  # 1-5
    amenities: int = 0  # 1-5
    helpful_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PhotoReviewCreate(BaseModel):
    spot_id: str
    rating: int
    comment: str
    photos: List[str] = []
    cleanliness: int = 3
    safety: int = 3
    amenities: int = 3

# 5. Push Notification Subscription
class PushSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_email: str
    endpoint: str
    keys: dict  # p256dh and auth keys
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# Old maintenance reminders - renamed to avoid route conflicts with new maintenance tracker
@api_router.get("/maintenance-reminders/{driver_email}", response_model=List[MaintenanceReminder])
async def get_maintenance_reminders(driver_email: str):
    reminders = await db.maintenance_reminders.find(
        {"driver_email": driver_email, "is_completed": False},
        {"_id": 0}
    ).to_list(1000)
    
    for reminder in reminders:
        if isinstance(reminder.get('created_at'), str):
            reminder['created_at'] = datetime.fromisoformat(reminder['created_at'])
    
    return reminders

@api_router.post("/maintenance-reminders", response_model=MaintenanceReminder)
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

@api_router.put("/maintenance-reminders/{reminder_id}/complete")
async def complete_maintenance_reminder(reminder_id: str):
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

# ============== HOS (HOURS OF SERVICE) - LEGACY ENDPOINTS ==============
# Note: These are legacy endpoints. New HOS tracker endpoints are defined later in the file.

@api_router.get("/hos-legacy/{driver_email}")
async def get_hos_status_legacy(driver_email: str):
    """Legacy HOS status endpoint - use /hos/summary/{email} instead"""
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

@api_router.post("/hos-legacy/{driver_email}/reset")
async def reset_hos_legacy(driver_email: str):
    """Legacy HOS reset endpoint"""
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
            # Add convoy leader (driver_email field)
            shared_with.append(convoy.get('driver_email', ''))
    
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

# ============== WEATHER ALERTS ==============

@api_router.get("/weather/alerts")
async def get_weather_alerts(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: int = 100,
    active_only: bool = True
):
    """Get weather alerts, optionally filtered by location"""
    query = {}
    if active_only:
        query["active"] = True
        # Also filter out expired alerts
        query["$or"] = [
            {"expires_at": None},
            {"expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}}
        ]
    
    alerts = await db.weather_alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # If location provided, filter by proximity (simple distance check)
    if latitude and longitude:
        filtered_alerts = []
        for alert in alerts:
            if alert.get('latitude') and alert.get('longitude'):
                # Simple distance calculation (not exact, but good enough for alerts)
                lat_diff = abs(alert['latitude'] - latitude)
                lng_diff = abs(alert['longitude'] - longitude)
                # Rough conversion: 1 degree ≈ 69 miles
                distance = ((lat_diff * 69) ** 2 + (lng_diff * 69) ** 2) ** 0.5
                if distance <= radius_miles:
                    alert['distance_miles'] = round(distance, 1)
                    filtered_alerts.append(alert)
            else:
                # Include alerts without specific coordinates
                filtered_alerts.append(alert)
        return filtered_alerts
    
    return alerts

@api_router.get("/weather/alerts/nearby")
async def get_nearby_weather_alerts(latitude: float, longitude: float, radius_miles: int = 100):
    """Get weather alerts near a specific location"""
    return await get_weather_alerts(latitude=latitude, longitude=longitude, radius_miles=radius_miles)

@api_router.post("/weather/alerts")
async def create_weather_alert(alert_data: WeatherAlertCreate, driver_email: Optional[str] = None):
    """Create a new weather alert (can be driver-reported or system)"""
    expires_at = datetime.now(timezone.utc) + timedelta(hours=alert_data.expires_hours)
    
    alert = WeatherAlert(
        alert_type=alert_data.alert_type,
        severity=alert_data.severity,
        title=alert_data.title,
        description=alert_data.description,
        location=alert_data.location,
        latitude=alert_data.latitude,
        longitude=alert_data.longitude,
        radius_miles=alert_data.radius_miles,
        reported_by=driver_email,
        expires_at=expires_at
    )
    
    alert_doc = alert.model_dump()
    alert_doc['created_at'] = alert_doc['created_at'].isoformat()
    alert_doc['expires_at'] = alert_doc['expires_at'].isoformat() if alert_doc['expires_at'] else None
    
    await db.weather_alerts.insert_one(alert_doc)
    
    # Create notifications for drivers in the area (simplified - notify all drivers)
    if alert.severity in ["high", "critical"]:
        drivers = await db.users.find({"role": "driver"}, {"email": 1, "_id": 0}).to_list(1000)
        for driver in drivers:
            notification = Notification(
                recipient_email=driver['email'],
                type="weather_alert",
                title=f"⚠️ {alert.severity.upper()}: {alert.title}",
                message=f"{alert.location} - {alert.description}",
                data={
                    "alert_id": alert.id,
                    "severity": alert.severity,
                    "latitude": alert.latitude,
                    "longitude": alert.longitude
                }
            )
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
    
    logger.info(f"⚠️ Weather Alert created: {alert.title} at {alert.location}")
    return alert

@api_router.put("/weather/alerts/{alert_id}/deactivate")
async def deactivate_weather_alert(alert_id: str):
    """Deactivate a weather alert"""
    result = await db.weather_alerts.update_one(
        {"id": alert_id},
        {"$set": {"active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deactivated"}

# ============== CONVOY CHAT ==============

@api_router.get("/convoy/{convoy_id}/messages")
async def get_convoy_messages(convoy_id: str, limit: int = 100):
    """Get messages for a specific convoy"""
    # Verify convoy exists
    convoy = await db.convoy_posts.find_one({"id": convoy_id})
    if not convoy:
        raise HTTPException(status_code=404, detail="Convoy not found")
    
    messages = await db.convoy_messages.find(
        {"convoy_id": convoy_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return messages[::-1]  # Reverse to show oldest first

@api_router.post("/convoy/{convoy_id}/messages")
async def send_convoy_message(convoy_id: str, message_data: ConvoyMessageCreate, driver_email: str):
    """Send a message to convoy chat"""
    # Verify convoy exists
    convoy = await db.convoy_posts.find_one({"id": convoy_id})
    if not convoy:
        raise HTTPException(status_code=404, detail="Convoy not found")
    
    # Verify user is part of this convoy
    is_leader = convoy.get('driver_email') == driver_email
    is_member = driver_email in convoy.get('interested_drivers', [])
    
    if not is_leader and not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this convoy")
    
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    message = ConvoyMessage(
        convoy_id=convoy_id,
        sender_email=driver_email,
        sender_name=user['name'],
        message=message_data.message,
        message_type=message_data.message_type,
        attachment_url=message_data.attachment_url,
        is_read_by=[driver_email]  # Sender has read it
    )
    
    msg_doc = message.model_dump()
    msg_doc['created_at'] = msg_doc['created_at'].isoformat()
    
    await db.convoy_messages.insert_one(msg_doc)
    
    # Notify other convoy members
    all_members = [convoy.get('driver_email')] + convoy.get('interested_drivers', [])
    for member_email in all_members:
        if member_email and member_email != driver_email:
            notification = Notification(
                recipient_email=member_email,
                sender_email=driver_email,
                sender_name=user['name'],
                type="convoy_message",
                title="💬 New Convoy Message",
                message=f"{user['name']}: {message_data.message[:50]}{'...' if len(message_data.message) > 50 else ''}",
                data={
                    "convoy_id": convoy_id,
                    "message_id": message.id
                }
            )
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
    
    return message

@api_router.put("/convoy/{convoy_id}/messages/{message_id}/read")
async def mark_convoy_message_read(convoy_id: str, message_id: str, driver_email: str):
    """Mark a convoy message as read by this user"""
    result = await db.convoy_messages.update_one(
        {"id": message_id, "convoy_id": convoy_id},
        {"$addToSet": {"is_read_by": driver_email}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message marked as read"}

@api_router.get("/convoy/{convoy_id}/messages/unread-count")
async def get_convoy_unread_count(convoy_id: str, driver_email: str):
    """Get count of unread messages in a convoy"""
    count = await db.convoy_messages.count_documents({
        "convoy_id": convoy_id,
        "is_read_by": {"$ne": driver_email}
    })
    return {"unread_count": count}

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

# ============== ROUTE PLANNER ==============

@api_router.post("/routes/plan")
async def plan_truck_route(route_data: RouteRequest, driver_email: str):
    """Plan a truck-safe route with restrictions"""
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate approximate distance (simplified)
    lat_diff = abs(route_data.destination_lat - route_data.origin_lat)
    lng_diff = abs(route_data.destination_lng - route_data.origin_lng)
    distance = ((lat_diff * 69) ** 2 + (lng_diff * 69) ** 2) ** 0.5
    
    # Estimate duration (avg 55 mph for trucks)
    duration = (distance / 55) * 60  # minutes
    
    # Generate mock fuel stops every 400 miles
    fuel_stops = []
    for i in range(1, int(distance // 400) + 1):
        fuel_stops.append({
            "mile": i * 400,
            "name": f"Truck Stop #{i}",
            "fuel_price": round(3.50 + (i * 0.1), 2)
        })
    
    # Generate rest stops (every 500 miles for HOS compliance)
    rest_stops = []
    for i in range(1, int(distance // 500) + 1):
        rest_stops.append({
            "mile": i * 500,
            "name": f"Rest Area #{i}",
            "amenities": ["restrooms", "parking", "food"]
        })
    
    # Check for restrictions
    restrictions = []
    if route_data.truck_height > 13.5:
        restrictions.append("Low bridge warning on I-95 (13.5ft clearance)")
    if route_data.truck_weight > 80000:
        restrictions.append("Weight restriction on SR-50 (80,000 lbs max)")
    if route_data.hazmat:
        restrictions.append("Hazmat restriction through downtown areas")
    
    route = TruckRoute(
        driver_email=driver_email,
        **route_data.model_dump(),
        total_distance=round(distance, 1),
        total_duration=round(duration, 0),
        fuel_stops=fuel_stops,
        rest_stops=rest_stops,
        restrictions=restrictions
    )
    
    route_doc = route.model_dump()
    route_doc['created_at'] = route_doc['created_at'].isoformat()
    await db.routes.insert_one(route_doc)
    
    return route

@api_router.get("/routes/history/{driver_email}")
async def get_route_history(driver_email: str, limit: int = 10):
    """Get driver's route planning history"""
    routes = await db.routes.find(
        {"driver_email": driver_email},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return routes

# ============== ANALYTICS DASHBOARD ==============

@api_router.get("/analytics/{driver_email}")
async def get_driver_analytics(driver_email: str, period: str = "month"):
    """Get driver's earnings and performance analytics"""
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)
    
    # Get earnings entries
    earnings = await db.earnings.find({
        "driver_email": driver_email,
        "date": {"$gte": start_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Get expenses
    expenses = await db.expenses.find({
        "user_email": driver_email,
        "date": {"$gte": start_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Calculate totals
    total_earnings = sum(e.get('amount', 0) for e in earnings)
    total_expenses = sum(e.get('amount', 0) for e in expenses)
    total_loads = len([e for e in earnings if e.get('source') == 'load'])
    
    # Calculate expenses by category
    fuel_expenses = sum(e.get('amount', 0) for e in expenses if e.get('category') == 'fuel')
    parking_expenses = sum(e.get('amount', 0) for e in expenses if e.get('category') == 'parking')
    maintenance_expenses = sum(e.get('amount', 0) for e in expenses if e.get('category') == 'maintenance')
    
    # Get total miles from loads
    total_miles = sum(e.get('miles', 0) for e in earnings)
    if total_miles == 0:
        total_miles = total_loads * 500  # Estimate 500 miles per load
    
    # Calculate earnings by day (last 7 days)
    earnings_by_day = []
    for i in range(7):
        day = now - timedelta(days=i)
        day_earnings = sum(
            e.get('amount', 0) for e in earnings 
            if e.get('date', '').startswith(day.strftime('%Y-%m-%d'))
        )
        earnings_by_day.append({
            "date": day.strftime('%Y-%m-%d'),
            "day": day.strftime('%a'),
            "amount": day_earnings
        })
    
    analytics = DriverAnalytics(
        driver_email=driver_email,
        period=period,
        total_earnings=total_earnings,
        total_miles=total_miles,
        total_loads=total_loads,
        total_expenses=total_expenses,
        net_profit=total_earnings - total_expenses,
        avg_rate_per_mile=round(total_earnings / total_miles, 2) if total_miles > 0 else 0,
        fuel_expenses=fuel_expenses,
        parking_expenses=parking_expenses,
        maintenance_expenses=maintenance_expenses,
        earnings_by_day=earnings_by_day[::-1]  # Reverse to show oldest first
    )
    
    return analytics

@api_router.post("/analytics/earnings")
async def add_earnings_entry(entry: EarningsEntry, driver_email: str):
    """Add an earnings entry"""
    entry.driver_email = driver_email
    entry_doc = entry.model_dump()
    entry_doc['date'] = entry_doc['date'].isoformat()
    await db.earnings.insert_one(entry_doc)
    return {"message": "Earnings entry added", "id": entry.id}

# ============== DIRECT MESSAGING ==============

@api_router.get("/messages/conversations/{driver_email}")
async def get_conversations(driver_email: str):
    """Get all conversations for a driver"""
    # Get all messages where user is sender or recipient
    sent = await db.direct_messages.find(
        {"sender_email": driver_email},
        {"_id": 0}
    ).to_list(1000)
    
    received = await db.direct_messages.find(
        {"recipient_email": driver_email},
        {"_id": 0}
    ).to_list(1000)
    
    # Group by conversation partner
    conversations = {}
    for msg in sent + received:
        partner = msg['recipient_email'] if msg['sender_email'] == driver_email else msg['sender_email']
        if partner not in conversations:
            conversations[partner] = {
                "partner_email": partner,
                "partner_name": msg.get('sender_name') if msg['sender_email'] != driver_email else "Unknown",
                "last_message": msg['message'][:50],
                "last_message_time": msg['created_at'],
                "unread_count": 0
            }
        # Update with latest message
        if msg['created_at'] > conversations[partner]['last_message_time']:
            conversations[partner]['last_message'] = msg['message'][:50]
            conversations[partner]['last_message_time'] = msg['created_at']
        # Count unread
        if msg['recipient_email'] == driver_email and not msg.get('is_read'):
            conversations[partner]['unread_count'] += 1
    
    return list(conversations.values())

@api_router.get("/messages/{driver_email}/{partner_email}")
async def get_direct_messages(driver_email: str, partner_email: str, limit: int = 50):
    """Get messages between two drivers"""
    messages = await db.direct_messages.find({
        "$or": [
            {"sender_email": driver_email, "recipient_email": partner_email},
            {"sender_email": partner_email, "recipient_email": driver_email}
        ]
    }, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Mark messages as read
    await db.direct_messages.update_many(
        {"sender_email": partner_email, "recipient_email": driver_email, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return messages[::-1]  # Return oldest first

@api_router.post("/messages/send")
async def send_direct_message(msg_data: DirectMessageCreate, driver_email: str):
    """Send a direct message to another driver"""
    sender = await db.users.find_one({"email": driver_email})
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    
    recipient = await db.users.find_one({"email": msg_data.recipient_email})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    message = DirectMessage(
        sender_email=driver_email,
        sender_name=sender['name'],
        recipient_email=msg_data.recipient_email,
        message=msg_data.message,
        message_type=msg_data.message_type,
        attachment_url=msg_data.attachment_url
    )
    
    msg_doc = message.model_dump()
    msg_doc['created_at'] = msg_doc['created_at'].isoformat()
    await db.direct_messages.insert_one(msg_doc)
    
    # Create notification for recipient
    notification = Notification(
        recipient_email=msg_data.recipient_email,
        sender_email=driver_email,
        sender_name=sender['name'],
        type="direct_message",
        title="💬 New Message",
        message=f"{sender['name']}: {msg_data.message[:50]}{'...' if len(msg_data.message) > 50 else ''}",
        data={"sender_email": driver_email}
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return message

# ============== PHOTO REVIEWS ==============

@api_router.post("/reviews/photo")
async def create_photo_review(review_data: PhotoReviewCreate, driver_email: str):
    """Create a review with photos"""
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    spot = await db.parking_spots.find_one({"id": review_data.spot_id})
    if not spot:
        raise HTTPException(status_code=404, detail="Parking spot not found")
    
    review = PhotoReview(
        spot_id=review_data.spot_id,
        driver_email=driver_email,
        driver_name=user['name'],
        rating=review_data.rating,
        comment=review_data.comment,
        photos=review_data.photos,
        cleanliness=review_data.cleanliness,
        safety=review_data.safety,
        amenities=review_data.amenities
    )
    
    review_doc = review.model_dump()
    review_doc['created_at'] = review_doc['created_at'].isoformat()
    await db.photo_reviews.insert_one(review_doc)
    
    # Award points for review with photos
    points = 10 + (len(review_data.photos) * 5)  # 10 base + 5 per photo
    await db.users.update_one(
        {"email": driver_email},
        {"$inc": {"reward_points": points}}
    )
    
    return {"message": f"Review submitted! +{points} points earned", "review_id": review.id}

@api_router.get("/reviews/photo/{spot_id}")
async def get_photo_reviews(spot_id: str, limit: int = 20):
    """Get photo reviews for a parking spot"""
    reviews = await db.photo_reviews.find(
        {"spot_id": spot_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return reviews

@api_router.post("/reviews/{review_id}/helpful")
async def mark_review_helpful(review_id: str, driver_email: str):
    """Mark a review as helpful"""
    result = await db.photo_reviews.update_one(
        {"id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Marked as helpful"}

# ============== PUSH NOTIFICATIONS ==============

@api_router.post("/push/subscribe")
async def subscribe_push_notifications(subscription: PushSubscription, driver_email: str):
    """Subscribe to push notifications"""
    subscription.driver_email = driver_email
    
    # Remove existing subscription for this user
    await db.push_subscriptions.delete_many({"driver_email": driver_email})
    
    sub_doc = subscription.model_dump()
    sub_doc['created_at'] = sub_doc['created_at'].isoformat()
    await db.push_subscriptions.insert_one(sub_doc)
    
    return {"message": "Subscribed to push notifications"}

@api_router.delete("/push/unsubscribe/{driver_email}")
async def unsubscribe_push_notifications(driver_email: str):
    """Unsubscribe from push notifications"""
    await db.push_subscriptions.delete_many({"driver_email": driver_email})
    return {"message": "Unsubscribed from push notifications"}

@api_router.get("/push/vapid-key")
async def get_vapid_public_key():
    """Get VAPID public key for push notifications"""
    # This is a placeholder - in production, generate proper VAPID keys
    return {
        "publicKey": "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
    }

# ============== VOICE SEARCH (simplified) ==============

@api_router.post("/voice/search")
async def voice_search(query: str, driver_email: str):
    """Process voice search query"""
    query_lower = query.lower()
    
    results = {
        "query": query,
        "intent": "unknown",
        "results": []
    }
    
    # Detect intent
    if any(word in query_lower for word in ["parking", "park", "stop", "rest"]):
        results["intent"] = "find_parking"
        # Search parking spots
        spots = await db.parking_spots.find({}, {"_id": 0}).limit(5).to_list(5)
        results["results"] = spots
        results["response"] = f"Found {len(spots)} parking spots nearby"
        
    elif any(word in query_lower for word in ["fuel", "gas", "diesel"]):
        results["intent"] = "find_fuel"
        prices = await db.fuel_prices.find({}, {"_id": 0}).sort("price", 1).limit(5).to_list(5)
        results["results"] = prices
        results["response"] = f"Found {len(prices)} fuel stations with good prices"
        
    elif any(word in query_lower for word in ["load", "job", "haul"]):
        results["intent"] = "find_loads"
        loads = await db.loads.find({"status": "available"}, {"_id": 0}).limit(5).to_list(5)
        results["results"] = loads
        results["response"] = f"Found {len(loads)} available loads"
        
    elif any(word in query_lower for word in ["weather", "alert", "warning"]):
        results["intent"] = "check_weather"
        alerts = await db.weather_alerts.find({"active": True}, {"_id": 0}).limit(5).to_list(5)
        results["results"] = alerts
        results["response"] = f"There are {len(alerts)} active weather alerts"
        
    elif any(word in query_lower for word in ["sos", "emergency", "help"]):
        results["intent"] = "emergency"
        results["response"] = "Activating Emergency SOS. Your contacts will be notified."
        
    else:
        results["response"] = "I didn't understand. Try: 'Find parking', 'Find fuel', 'Find loads', or 'Check weather'"
    
    return results

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
        "annual_price": 0,
        "interval": "month",
        "type": "driver",
        "trial_days": 0,
        "features": [
            "Basic parking search (10 spots/day)",
            "HOS Tracker (view only)",
            "Community access (read & post)",
            "Basic load board access",
            "Reward points earning",
            "Ad-supported"
        ],
        "is_popular": False,
        "badge": None
    },
    {
        "id": "pro",
        "name": "Pro Driver",
        "price": 7.99,
        "annual_price": 79,
        "annual_savings": 17,
        "interval": "month",
        "type": "driver",
        "trial_days": 7,
        "features": [
            "Everything in Free +",
            "Unlimited parking search",
            "Real-time availability alerts",
            "Full HOS Tracker with logging",
            "Weight Calculator",
            "Full load board access",
            "Broker ratings & fraud alerts",
            "Shower credits tracker",
            "Trip profit calculator",
            "Ad-free experience",
            "Standard support"
        ],
        "is_popular": True,
        "badge": "Most Popular"
    },
    {
        "id": "premium",
        "name": "Premium Fleet",
        "price": 19.99,
        "annual_price": 199,
        "annual_savings": 40,
        "interval": "month",
        "type": "driver",
        "trial_days": 14,
        "features": [
            "Everything in Pro +",
            "DOT compliance tracking",
            "Route planner with truck restrictions",
            "Analytics dashboard",
            "Detention claims manager",
            "Convoy finder access",
            "Multi-truck profiles",
            "Fuel price alerts",
            "Expense reports",
            "Fleet management tools",
            "Priority support 24/7"
        ],
        "is_popular": False,
        "badge": "Best Value"
    }
]

# Partner/Parking Owner Plans
PARTNER_PLANS = [
    {
        "id": "partner-starter",
        "name": "Starter",
        "price": 0,
        "annual_price": 0,
        "interval": "month",
        "type": "partner",
        "trial_days": 0,
        "features": [
            "List 1 parking location",
            "Basic booking management",
            "Customer reviews",
            "Email notifications"
        ],
        "is_popular": False,
        "badge": None
    },
    {
        "id": "partner-business",
        "name": "Business",
        "price": 24.99,
        "annual_price": 249,
        "annual_savings": 51,
        "interval": "month",
        "type": "partner",
        "trial_days": 14,
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
        "is_popular": True,
        "badge": "Most Popular"
    },
    {
        "id": "partner-enterprise",
        "name": "Enterprise",
        "price": 79.99,
        "annual_price": 799,
        "annual_savings": 161,
        "interval": "month",
        "type": "partner",
        "trial_days": 30,
        "features": [
            "Unlimited parking locations",
            "Everything in Business +",
            "Featured placement in search",
            "API access for integrations",
            "Custom branding",
            "Multi-user access",
            "Advanced reporting & analytics",
            "Dedicated account manager",
            "24/7 priority support"
        ],
        "is_popular": False,
        "badge": "Best for Chains"
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
    # Use frontend URL for success/cancel redirects
    frontend_url = origin.replace('/api', '').replace(':8001', ':3000')
    if 'preview.emergentagent.com' in origin or 'preview.emerg' in origin:
        frontend_url = origin.replace('/api', '')  # Same URL in preview
    
    stripe_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
    webhook_url = f"{origin}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=plan["price"],
        currency="usd",
        success_url=f"{frontend_url}/subscription-success?session_id={{{{CHECKOUT_SESSION_ID}}}}&plan_id={plan_id}&user_email={user_email}",
        cancel_url=f"{frontend_url}/driver",
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

# ============== FEEDBACK SYSTEM ==============

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    user_name: str
    feedback_type: str  # "bug", "feature", "general", "complaint", "praise"
    subject: str
    message: str
    rating: Optional[int] = None  # 1-5 stars
    screenshot_url: Optional[str] = None
    status: str = "new"  # "new", "in_progress", "resolved", "closed"
    admin_response: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackCreate(BaseModel):
    feedback_type: str
    subject: str
    message: str
    rating: Optional[int] = None
    screenshot_url: Optional[str] = None

@api_router.post("/feedback")
async def submit_feedback(feedback_data: FeedbackCreate, user_email: str):
    """Submit user feedback"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    feedback = Feedback(
        user_email=user_email,
        user_name=user['name'],
        **feedback_data.model_dump()
    )
    
    feedback_doc = feedback.model_dump()
    feedback_doc['created_at'] = feedback_doc['created_at'].isoformat()
    
    await db.feedback.insert_one(feedback_doc)
    
    # Award points for feedback
    points_earned = 50 if feedback_data.rating else 25
    await db.users.update_one(
        {"email": user_email},
        {"$inc": {"reward_points": points_earned}}
    )
    
    logger.info(f"Feedback submitted by {user_email}: {feedback_data.subject}")
    return {"message": "Thank you for your feedback!", "points_earned": points_earned, "feedback_id": feedback.id}

@api_router.get("/feedback/{user_email}")
async def get_user_feedback(user_email: str):
    """Get feedback submitted by a user"""
    feedback_list = await db.feedback.find(
        {"user_email": user_email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return feedback_list

@api_router.get("/feedback/admin/all")
async def get_all_feedback(status: Optional[str] = None, limit: int = 50):
    """Admin: Get all feedback"""
    query = {}
    if status:
        query['status'] = status
    
    feedback_list = await db.feedback.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return feedback_list

@api_router.put("/feedback/{feedback_id}/respond")
async def respond_to_feedback(feedback_id: str, response: str, status: str = "resolved"):
    """Admin: Respond to feedback"""
    result = await db.feedback.update_one(
        {"id": feedback_id},
        {"$set": {"admin_response": response, "status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"message": "Response sent"}

# ============== COMMUNITY CHAT/BOARD ==============

class CommunityPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_email: str
    author_name: str
    category: str  # "general", "tips", "routes", "parking", "deals", "questions", "announcements"
    title: str
    content: str
    images: List[str] = []
    likes: int = 0
    liked_by: List[str] = []
    comments_count: int = 0
    is_pinned: bool = False
    is_featured: bool = False
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunityPostCreate(BaseModel):
    category: str
    title: str
    content: str
    images: List[str] = []
    tags: List[str] = []

class CommunityComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    author_email: str
    author_name: str
    content: str
    likes: int = 0
    liked_by: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunityCommentCreate(BaseModel):
    content: str

@api_router.get("/community/posts")
async def get_community_posts(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get community posts"""
    query = {}
    if category:
        query['category'] = category
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'content': {'$regex': search, '$options': 'i'}},
            {'tags': {'$in': [search.lower()]}}
        ]
    
    posts = await db.community_posts.find(query, {"_id": 0}).sort([
        ("is_pinned", -1),
        ("is_featured", -1),
        ("created_at", -1)
    ]).skip(skip).limit(limit).to_list(limit)
    
    return posts

@api_router.post("/community/posts")
async def create_community_post(post_data: CommunityPostCreate, user_email: str):
    """Create a community post"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    post = CommunityPost(
        author_email=user_email,
        author_name=user['name'],
        **post_data.model_dump()
    )
    
    post_doc = post.model_dump()
    post_doc['created_at'] = post_doc['created_at'].isoformat()
    
    await db.community_posts.insert_one(post_doc)
    
    # Award points for posting
    await db.users.update_one(
        {"email": user_email},
        {"$inc": {"reward_points": 20}}
    )
    
    logger.info(f"Community post created by {user_email}: {post.title}")
    return {"message": "Post created!", "points_earned": 20, "post_id": post.id}

@api_router.get("/community/posts/{post_id}")
async def get_community_post(post_id: str):
    """Get a single post with comments"""
    post = await db.community_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comments = await db.community_comments.find(
        {"post_id": post_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    post['comments'] = comments
    return post

@api_router.post("/community/posts/{post_id}/like")
async def like_community_post(post_id: str, user_email: str):
    """Like/unlike a post"""
    post = await db.community_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    liked_by = post.get('liked_by', [])
    
    if user_email in liked_by:
        # Unlike
        await db.community_posts.update_one(
            {"id": post_id},
            {"$pull": {"liked_by": user_email}, "$inc": {"likes": -1}}
        )
        return {"message": "Unliked", "liked": False}
    else:
        # Like
        await db.community_posts.update_one(
            {"id": post_id},
            {"$push": {"liked_by": user_email}, "$inc": {"likes": 1}}
        )
        # Award points to post author
        await db.users.update_one(
            {"email": post['author_email']},
            {"$inc": {"reward_points": 5}}
        )
        return {"message": "Liked!", "liked": True}

@api_router.post("/community/posts/{post_id}/comments")
async def add_comment(post_id: str, comment_data: CommunityCommentCreate, user_email: str):
    """Add a comment to a post"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    post = await db.community_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = CommunityComment(
        post_id=post_id,
        author_email=user_email,
        author_name=user['name'],
        content=comment_data.content
    )
    
    comment_doc = comment.model_dump()
    comment_doc['created_at'] = comment_doc['created_at'].isoformat()
    
    await db.community_comments.insert_one(comment_doc)
    
    # Update comment count
    await db.community_posts.update_one(
        {"id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    # Award points
    await db.users.update_one(
        {"email": user_email},
        {"$inc": {"reward_points": 10}}
    )
    
    return {"message": "Comment added!", "points_earned": 10, "comment_id": comment.id}

@api_router.get("/community/categories")
async def get_community_categories():
    """Get available categories with post counts"""
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    results = await db.community_posts.aggregate(pipeline).to_list(20)
    
    categories = [
        {"id": "general", "name": "General Discussion", "icon": "💬"},
        {"id": "tips", "name": "Trucker Tips", "icon": "💡"},
        {"id": "routes", "name": "Route Advice", "icon": "🛣️"},
        {"id": "parking", "name": "Parking Spots", "icon": "🅿️"},
        {"id": "deals", "name": "Deals & Discounts", "icon": "💰"},
        {"id": "questions", "name": "Questions", "icon": "❓"},
        {"id": "announcements", "name": "Announcements", "icon": "📢"}
    ]
    
    # Add counts
    count_map = {r['_id']: r['count'] for r in results}
    for cat in categories:
        cat['count'] = count_map.get(cat['id'], 0)
    
    return categories

# ============== REFERRAL SYSTEM ==============

class Referral(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referrer_email: str
    referrer_name: str
    referral_code: str
    referred_email: Optional[str] = None
    referred_name: Optional[str] = None
    status: str = "pending"  # "pending", "completed", "rewarded"
    reward_points: int = 500
    bonus_type: Optional[str] = None  # "free_month", "points", "discount"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

def generate_referral_code(email: str) -> str:
    """Generate unique referral code"""
    import hashlib
    hash_input = f"{email}{datetime.now().timestamp()}"
    return f"TRUK{hashlib.md5(hash_input.encode()).hexdigest()[:8].upper()}"

@api_router.get("/referral/code/{user_email}")
async def get_referral_code(user_email: str):
    """Get or create user's referral code"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user already has a referral code
    existing = await db.referral_codes.find_one({"email": user_email}, {"_id": 0})
    
    if existing:
        return {
            "referral_code": existing['code'],
            "referral_link": f"https://trukall.app/signup?ref={existing['code']}",
            "total_referrals": existing.get('total_referrals', 0),
            "total_earned": existing.get('total_earned', 0)
        }
    
    # Create new referral code
    code = generate_referral_code(user_email)
    
    await db.referral_codes.insert_one({
        "email": user_email,
        "name": user['name'],
        "code": code,
        "total_referrals": 0,
        "total_earned": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "referral_code": code,
        "referral_link": f"https://trukall.app/signup?ref={code}",
        "total_referrals": 0,
        "total_earned": 0
    }

@api_router.post("/referral/apply")
async def apply_referral_code(referral_code: str, new_user_email: str):
    """Apply referral code during signup"""
    # Find referral code
    referral = await db.referral_codes.find_one({"code": referral_code.upper()})
    if not referral:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Check if already referred
    existing = await db.referrals.find_one({
        "referral_code": referral_code.upper(),
        "referred_email": new_user_email
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already used this referral")
    
    new_user = await db.users.find_one({"email": new_user_email})
    if not new_user:
        raise HTTPException(status_code=404, detail="New user not found")
    
    # Create referral record
    ref_record = Referral(
        referrer_email=referral['email'],
        referrer_name=referral['name'],
        referral_code=referral_code.upper(),
        referred_email=new_user_email,
        referred_name=new_user['name'],
        status="completed",
        completed_at=datetime.now(timezone.utc)
    )
    
    ref_doc = ref_record.model_dump()
    ref_doc['created_at'] = ref_doc['created_at'].isoformat()
    ref_doc['completed_at'] = ref_doc['completed_at'].isoformat()
    
    await db.referrals.insert_one(ref_doc)
    
    # Reward both users
    reward_points = 500
    
    # Reward referrer
    await db.users.update_one(
        {"email": referral['email']},
        {"$inc": {"reward_points": reward_points}}
    )
    
    # Reward new user (welcome bonus)
    await db.users.update_one(
        {"email": new_user_email},
        {"$inc": {"reward_points": 250}}
    )
    
    # Update referral stats
    await db.referral_codes.update_one(
        {"code": referral_code.upper()},
        {"$inc": {"total_referrals": 1, "total_earned": reward_points}}
    )
    
    # Create notification for referrer
    notification = Notification(
        recipient_email=referral['email'],
        type="referral",
        title="🎉 Referral Bonus!",
        message=f"{new_user['name']} joined using your referral code! You earned {reward_points} points!",
        data={"referred_user": new_user_email, "points": reward_points}
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    logger.info(f"Referral completed: {referral['email']} referred {new_user_email}")
    
    return {
        "message": "Referral applied successfully!",
        "referrer_reward": reward_points,
        "new_user_bonus": 250
    }

@api_router.get("/referral/stats/{user_email}")
async def get_referral_stats(user_email: str):
    """Get user's referral statistics"""
    referral_code = await db.referral_codes.find_one({"email": user_email}, {"_id": 0})
    
    if not referral_code:
        return {
            "has_code": False,
            "total_referrals": 0,
            "total_earned": 0,
            "referrals": []
        }
    
    referrals = await db.referrals.find(
        {"referrer_email": user_email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {
        "has_code": True,
        "referral_code": referral_code['code'],
        "total_referrals": referral_code.get('total_referrals', 0),
        "total_earned": referral_code.get('total_earned', 0),
        "referrals": referrals
    }

@api_router.get("/referral/leaderboard")
async def get_referral_leaderboard(limit: int = 10):
    """Get top referrers"""
    leaders = await db.referral_codes.find(
        {"total_referrals": {"$gt": 0}},
        {"_id": 0, "email": 0}
    ).sort("total_referrals", -1).limit(limit).to_list(limit)
    
    # Add rank
    for i, leader in enumerate(leaders):
        leader['rank'] = i + 1
    
    return leaders

# ============== SOCIAL LINKS & APP CONFIG ==============

@api_router.get("/app/config")
async def get_app_config():
    """Get app configuration including social links"""
    return {
        "app_name": "TrukAll",
        "tagline": "Never Drive to a Full Lot Again",
        "version": "2.0.0",
        "social_links": {
            "whatsapp": "https://wa.me/1234567890",  # Replace with actual
            "telegram": "https://t.me/trukall_community",  # Replace with actual
            "facebook": "https://facebook.com/groups/trukall",  # Replace with actual
            "google_business": "https://g.page/trukall",  # Replace with actual
        },
        "support": {
            "email": "support@trukall.app",
            "feedback_form": "https://forms.gle/your-form-id",  # Replace with actual
            "notion_docs": "https://trukall.notion.site"  # Replace with actual
        },
        "referral_rewards": {
            "referrer_points": 500,
            "new_user_points": 250,
            "description": "Earn 500 points for each friend you refer!"
        },
        "firebase_config": {
            "enabled": False,
            "note": "Configure Firebase in environment variables"
        }
    }

# ============== GAMIFICATION SYSTEM ==============

# Badge definitions
BADGE_DEFINITIONS = {
    # Review badges
    "first_review": {"name": "First Review", "description": "Wrote your first review", "icon": "⭐", "points": 50, "category": "reviews"},
    "reviewer_5": {"name": "Active Reviewer", "description": "Wrote 5 reviews", "icon": "📝", "points": 100, "category": "reviews"},
    "reviewer_25": {"name": "Top Reviewer", "description": "Wrote 25 reviews", "icon": "🏆", "points": 250, "category": "reviews"},
    "reviewer_100": {"name": "Review Legend", "description": "Wrote 100 reviews", "icon": "👑", "points": 500, "category": "reviews"},
    
    # Referral badges
    "first_referral": {"name": "First Referral", "description": "Referred your first driver", "icon": "🤝", "points": 100, "category": "referrals"},
    "referrer_5": {"name": "Team Builder", "description": "Referred 5 drivers", "icon": "👥", "points": 250, "category": "referrals"},
    "referrer_25": {"name": "Community Champion", "description": "Referred 25 drivers", "icon": "🌟", "points": 500, "category": "referrals"},
    
    # Community badges
    "first_post": {"name": "First Post", "description": "Made your first community post", "icon": "💬", "points": 50, "category": "community"},
    "helpful_5": {"name": "Helpful Driver", "description": "Got 5 helpful votes", "icon": "👍", "points": 100, "category": "community"},
    "helpful_50": {"name": "Road Helper", "description": "Got 50 helpful votes", "icon": "🦸", "points": 300, "category": "community"},
    
    # Streak badges
    "streak_7": {"name": "Week Warrior", "description": "7-day login streak", "icon": "🔥", "points": 100, "category": "streaks"},
    "streak_30": {"name": "Monthly Master", "description": "30-day login streak", "icon": "💪", "points": 300, "category": "streaks"},
    "streak_100": {"name": "Road Legend", "description": "100-day login streak", "icon": "🏅", "points": 1000, "category": "streaks"},
    
    # Miles badges
    "miles_1000": {"name": "Road Starter", "description": "Logged 1,000 miles", "icon": "🛣️", "points": 100, "category": "miles"},
    "miles_10000": {"name": "Long Hauler", "description": "Logged 10,000 miles", "icon": "🚛", "points": 300, "category": "miles"},
    "miles_100000": {"name": "Million Miler", "description": "Logged 100,000 miles", "icon": "🌎", "points": 1000, "category": "miles"},
    
    # Special badges
    "early_adopter": {"name": "Early Adopter", "description": "Joined in the first month", "icon": "🚀", "points": 200, "category": "special"},
    "feedback_hero": {"name": "Feedback Hero", "description": "Submitted 10 feedback reports", "icon": "💡", "points": 150, "category": "special"},
    "mentor": {"name": "Mentor", "description": "Helped 5 new drivers", "icon": "🎓", "points": 300, "category": "special"},
}

# Challenge definitions
DAILY_CHALLENGES = [
    {"id": "review_spot", "name": "Review a Spot", "description": "Write a review for any parking spot", "points": 25, "type": "review"},
    {"id": "help_driver", "name": "Help a Driver", "description": "Answer a question in the community", "points": 30, "type": "comment"},
    {"id": "update_location", "name": "Share Location", "description": "Update a parking spot's availability", "points": 20, "type": "live_update"},
    {"id": "check_in", "name": "Daily Check-in", "description": "Open the app and check in", "points": 10, "type": "checkin"},
]

WEEKLY_CHALLENGES = [
    {"id": "weekly_reviews", "name": "Review Master", "description": "Write 5 reviews this week", "points": 100, "target": 5, "type": "review"},
    {"id": "weekly_helpful", "name": "Community Helper", "description": "Get 10 helpful votes this week", "points": 150, "target": 10, "type": "helpful"},
    {"id": "weekly_posts", "name": "Active Poster", "description": "Create 3 community posts", "points": 75, "target": 3, "type": "post"},
    {"id": "weekly_referral", "name": "Spread the Word", "description": "Refer 1 new driver", "points": 200, "target": 1, "type": "referral"},
]

class UserBadge(BaseModel):
    badge_id: str
    earned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserStreak(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    last_checkin: Optional[datetime] = None

class ChallengeProgress(BaseModel):
    challenge_id: str
    progress: int = 0
    target: int
    completed: bool = False
    completed_at: Optional[datetime] = None

@api_router.get("/gamification/badges")
async def get_all_badges():
    """Get all available badges"""
    badges = []
    for badge_id, badge in BADGE_DEFINITIONS.items():
        badges.append({"id": badge_id, **badge})
    return badges

@api_router.get("/gamification/user/{user_email}")
async def get_user_gamification(user_email: str):
    """Get user's gamification data (badges, streaks, challenges)"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's badges
    user_badges = await db.user_badges.find({"user_email": user_email}, {"_id": 0}).to_list(100)
    
    # Get streak data
    streak_data = await db.user_streaks.find_one({"user_email": user_email}, {"_id": 0})
    if not streak_data:
        streak_data = {"current_streak": 0, "longest_streak": 0}
    
    # Get challenge progress
    today = datetime.now(timezone.utc).date().isoformat()
    week_start = (datetime.now(timezone.utc) - timedelta(days=datetime.now(timezone.utc).weekday())).date().isoformat()
    
    daily_progress = await db.challenge_progress.find(
        {"user_email": user_email, "date": today, "type": "daily"},
        {"_id": 0}
    ).to_list(10)
    
    weekly_progress = await db.challenge_progress.find(
        {"user_email": user_email, "week": week_start, "type": "weekly"},
        {"_id": 0}
    ).to_list(10)
    
    # Calculate level based on total points
    total_points = user.get('reward_points', 0)
    level = 1 + (total_points // 500)  # Level up every 500 points
    level_progress = (total_points % 500) / 500 * 100
    
    return {
        "badges": user_badges,
        "total_badges": len(user_badges),
        "streak": streak_data,
        "daily_challenges": daily_progress,
        "weekly_challenges": weekly_progress,
        "level": level,
        "level_progress": level_progress,
        "total_points": total_points
    }

@api_router.post("/gamification/checkin")
async def daily_checkin(user_email: str):
    """Daily check-in to maintain streak"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    today = datetime.now(timezone.utc).date()
    streak_data = await db.user_streaks.find_one({"user_email": user_email})
    
    points_earned = 10
    streak_bonus = 0
    new_badges = []
    
    if streak_data:
        last_checkin = streak_data.get('last_checkin')
        if last_checkin:
            last_date = datetime.fromisoformat(last_checkin).date() if isinstance(last_checkin, str) else last_checkin.date()
            
            if last_date == today:
                return {"message": "Already checked in today", "points_earned": 0}
            elif last_date == today - timedelta(days=1):
                # Continue streak
                new_streak = streak_data['current_streak'] + 1
                streak_bonus = min(new_streak * 5, 50)  # Max 50 bonus points
            else:
                # Streak broken
                new_streak = 1
        else:
            new_streak = 1
        
        longest = max(streak_data.get('longest_streak', 0), new_streak)
        
        await db.user_streaks.update_one(
            {"user_email": user_email},
            {"$set": {
                "current_streak": new_streak,
                "longest_streak": longest,
                "last_checkin": today.isoformat()
            }}
        )
    else:
        new_streak = 1
        await db.user_streaks.insert_one({
            "user_email": user_email,
            "current_streak": 1,
            "longest_streak": 1,
            "last_checkin": today.isoformat()
        })
    
    # Check for streak badges
    streak_badges = {"streak_7": 7, "streak_30": 30, "streak_100": 100}
    for badge_id, required in streak_badges.items():
        if new_streak >= required:
            existing = await db.user_badges.find_one({"user_email": user_email, "badge_id": badge_id})
            if not existing:
                await db.user_badges.insert_one({
                    "user_email": user_email,
                    "badge_id": badge_id,
                    "earned_at": datetime.now(timezone.utc).isoformat()
                })
                new_badges.append(BADGE_DEFINITIONS[badge_id])
                points_earned += BADGE_DEFINITIONS[badge_id]['points']
    
    # Award points
    total_points = points_earned + streak_bonus
    await db.users.update_one(
        {"email": user_email},
        {"$inc": {"reward_points": total_points}}
    )
    
    return {
        "message": "Checked in!",
        "current_streak": new_streak,
        "points_earned": total_points,
        "streak_bonus": streak_bonus,
        "new_badges": new_badges
    }

@api_router.get("/gamification/leaderboard")
async def get_leaderboard(category: str = "points", limit: int = 10):
    """Get leaderboard by category (points, reviews, referrals, streak)"""
    if category == "points":
        users = await db.users.find(
            {},
            {"_id": 0, "name": 1, "email": 1, "reward_points": 1}
        ).sort("reward_points", -1).limit(limit).to_list(limit)
        
        for i, user in enumerate(users):
            user['rank'] = i + 1
            user['value'] = user.get('reward_points', 0)
            user['email'] = user['email'][:3] + "***"  # Privacy
        return users
    
    elif category == "streak":
        streaks = await db.user_streaks.find(
            {},
            {"_id": 0}
        ).sort("current_streak", -1).limit(limit).to_list(limit)
        
        result = []
        for i, s in enumerate(streaks):
            user = await db.users.find_one({"email": s['user_email']}, {"name": 1})
            result.append({
                "rank": i + 1,
                "name": user.get('name', 'Driver') if user else 'Driver',
                "value": s['current_streak'],
                "email": s['user_email'][:3] + "***"
            })
        return result
    
    elif category == "reviews":
        pipeline = [
            {"$group": {"_id": "$driver_email", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit}
        ]
        reviews = await db.reviews.aggregate(pipeline).to_list(limit)
        
        result = []
        for i, r in enumerate(reviews):
            user = await db.users.find_one({"email": r['_id']}, {"name": 1})
            result.append({
                "rank": i + 1,
                "name": user.get('name', 'Driver') if user else 'Driver',
                "value": r['count'],
                "email": r['_id'][:3] + "***"
            })
        return result
    
    return []

@api_router.get("/gamification/challenges")
async def get_available_challenges():
    """Get daily and weekly challenges"""
    return {
        "daily": DAILY_CHALLENGES,
        "weekly": WEEKLY_CHALLENGES
    }

# ============== DRIVER SPOTLIGHT ==============

@api_router.get("/spotlight/weekly")
async def get_weekly_spotlight():
    """Get featured drivers of the week"""
    # Top reviewer this week
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    pipeline = [
        {"$match": {"created_at": {"$gte": week_ago}}},
        {"$group": {"_id": "$driver_email", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    
    top_reviewer = await db.reviews.aggregate(pipeline).to_list(1)
    
    # Most helpful (most likes on posts)
    pipeline_helpful = [
        {"$match": {"created_at": {"$gte": week_ago}}},
        {"$group": {"_id": "$author_email", "total_likes": {"$sum": "$likes"}}},
        {"$sort": {"total_likes": -1}},
        {"$limit": 1}
    ]
    
    most_helpful = await db.community_posts.aggregate(pipeline_helpful).to_list(1)
    
    # Longest current streak
    top_streak = await db.user_streaks.find_one(
        {},
        {"_id": 0},
        sort=[("current_streak", -1)]
    )
    
    spotlights = []
    
    if top_reviewer:
        user = await db.users.find_one({"email": top_reviewer[0]['_id']}, {"name": 1, "reward_points": 1})
        if user:
            spotlights.append({
                "category": "Top Reviewer",
                "icon": "⭐",
                "name": user.get('name', 'Driver'),
                "stat": f"{top_reviewer[0]['count']} reviews this week",
                "points": user.get('reward_points', 0)
            })
    
    if most_helpful and most_helpful[0].get('total_likes', 0) > 0:
        user = await db.users.find_one({"email": most_helpful[0]['_id']}, {"name": 1, "reward_points": 1})
        if user:
            spotlights.append({
                "category": "Most Helpful",
                "icon": "🤝",
                "name": user.get('name', 'Driver'),
                "stat": f"{most_helpful[0]['total_likes']} likes received",
                "points": user.get('reward_points', 0)
            })
    
    if top_streak:
        user = await db.users.find_one({"email": top_streak['user_email']}, {"name": 1, "reward_points": 1})
        if user:
            spotlights.append({
                "category": "Streak Champion",
                "icon": "🔥",
                "name": user.get('name', 'Driver'),
                "stat": f"{top_streak['current_streak']}-day streak",
                "points": user.get('reward_points', 0)
            })
    
    return spotlights

# ============== MENTOR SYSTEM ==============

class MentorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentor_email: str
    mentor_name: str
    years_experience: int
    specialties: List[str] = []  # "long_haul", "flatbed", "hazmat", "regional", etc.
    bio: str
    availability: str = "available"  # "available", "busy", "unavailable"
    rating: float = 5.0
    total_mentees: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MentorRequest(BaseModel):
    mentee_email: str
    mentor_email: str
    message: str
    status: str = "pending"  # "pending", "accepted", "declined", "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/mentors/register")
async def register_as_mentor(
    years_experience: int,
    specialties: List[str],
    bio: str,
    user_email: str
):
    """Register as a mentor"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = await db.mentors.find_one({"mentor_email": user_email})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as mentor")
    
    mentor = MentorProfile(
        mentor_email=user_email,
        mentor_name=user['name'],
        years_experience=years_experience,
        specialties=specialties,
        bio=bio
    )
    
    mentor_doc = mentor.model_dump()
    mentor_doc['created_at'] = mentor_doc['created_at'].isoformat()
    
    await db.mentors.insert_one(mentor_doc)
    
    # Award mentor badge
    await db.user_badges.insert_one({
        "user_email": user_email,
        "badge_id": "mentor",
        "earned_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.users.update_one(
        {"email": user_email},
        {"$inc": {"reward_points": 100}}
    )
    
    return {"message": "Registered as mentor!", "points_earned": 100}

@api_router.get("/mentors")
async def get_available_mentors(specialty: Optional[str] = None):
    """Get available mentors"""
    query = {"availability": "available"}
    if specialty:
        query['specialties'] = specialty
    
    mentors = await db.mentors.find(query, {"_id": 0}).sort("rating", -1).to_list(20)
    return mentors

@api_router.post("/mentors/request")
async def request_mentor(mentor_email: str, message: str, user_email: str):
    """Request a mentor"""
    mentor = await db.mentors.find_one({"mentor_email": mentor_email})
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    request = {
        "id": str(uuid.uuid4()),
        "mentee_email": user_email,
        "mentee_name": user['name'],
        "mentor_email": mentor_email,
        "message": message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.mentor_requests.insert_one(request)
    
    # Notify mentor
    notification = Notification(
        recipient_email=mentor_email,
        type="mentor_request",
        title="New Mentee Request!",
        message=f"{user['name']} wants you as their mentor",
        data={"request_id": request['id'], "mentee_email": user_email}
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Request sent!", "request_id": request['id']}

@api_router.get("/mentors/requests/{user_email}")
async def get_mentor_requests(user_email: str, role: str = "mentee"):
    """Get mentor requests (as mentee or mentor)"""
    if role == "mentor":
        requests = await db.mentor_requests.find(
            {"mentor_email": user_email},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
    else:
        requests = await db.mentor_requests.find(
            {"mentee_email": user_email},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
    
    return requests

@api_router.put("/mentors/requests/{request_id}/respond")
async def respond_to_mentor_request(request_id: str, status: str, user_email: str):
    """Accept or decline mentor request"""
    request = await db.mentor_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request['mentor_email'] != user_email:
        raise HTTPException(status_code=403, detail="Not your request")
    
    await db.mentor_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status}}
    )
    
    if status == "accepted":
        # Update mentor stats
        await db.mentors.update_one(
            {"mentor_email": user_email},
            {"$inc": {"total_mentees": 1}}
        )
        
        # Award points to both
        await db.users.update_one(
            {"email": user_email},
            {"$inc": {"reward_points": 50}}
        )
        await db.users.update_one(
            {"email": request['mentee_email']},
            {"$inc": {"reward_points": 25}}
        )
    
    return {"message": f"Request {status}"}

# ============== MAINTENANCE TRACKER ==============

class MaintenanceItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    item_type: str  # "oil_change", "tire_rotation", "brake_inspection", "filter", "transmission", "coolant"
    description: str
    last_service_date: str
    last_service_miles: int
    interval_miles: int
    interval_days: int
    next_due_miles: int
    next_due_date: str
    notes: str = ""
    is_completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

MAINTENANCE_DEFAULTS = {
    "oil_change": {"name": "Oil Change", "interval_miles": 15000, "interval_days": 90, "icon": "🛢️"},
    "tire_rotation": {"name": "Tire Rotation", "interval_miles": 10000, "interval_days": 60, "icon": "🔄"},
    "brake_inspection": {"name": "Brake Inspection", "interval_miles": 25000, "interval_days": 180, "icon": "🛑"},
    "air_filter": {"name": "Air Filter", "interval_miles": 30000, "interval_days": 365, "icon": "💨"},
    "transmission": {"name": "Transmission Service", "interval_miles": 60000, "interval_days": 730, "icon": "⚙️"},
    "coolant": {"name": "Coolant Flush", "interval_miles": 100000, "interval_days": 730, "icon": "❄️"},
    "def_fluid": {"name": "DEF Fluid", "interval_miles": 5000, "interval_days": 30, "icon": "💧"},
    "fuel_filter": {"name": "Fuel Filter", "interval_miles": 25000, "interval_days": 365, "icon": "⛽"},
}

@api_router.get("/maintenance/defaults")
async def get_maintenance_defaults():
    """Get default maintenance schedules"""
    return MAINTENANCE_DEFAULTS

@api_router.get("/maintenance/{user_email}")
async def get_user_maintenance(user_email: str):
    """Get user's maintenance items"""
    items = await db.maintenance.find(
        {"user_email": user_email},
        {"_id": 0}
    ).sort("next_due_date", 1).to_list(50)
    
    # Calculate status for each item
    today = datetime.now(timezone.utc).date()
    for item in items:
        due_date = datetime.fromisoformat(item['next_due_date']).date()
        days_until = (due_date - today).days
        
        if days_until < 0:
            item['status'] = "overdue"
        elif days_until <= 7:
            item['status'] = "due_soon"
        else:
            item['status'] = "ok"
        
        item['days_until_due'] = days_until
    
    return items

@api_router.post("/maintenance")
async def add_maintenance_item(
    item_type: str,
    last_service_date: str,
    last_service_miles: int,
    notes: str = "",
    user_email: str = ""
):
    """Add a maintenance item"""
    if item_type not in MAINTENANCE_DEFAULTS:
        raise HTTPException(status_code=400, detail="Invalid maintenance type")
    
    defaults = MAINTENANCE_DEFAULTS[item_type]
    
    # Calculate next due
    last_date = datetime.fromisoformat(last_service_date)
    next_due_date = last_date + timedelta(days=defaults['interval_days'])
    next_due_miles = last_service_miles + defaults['interval_miles']
    
    item = MaintenanceItem(
        user_email=user_email,
        item_type=item_type,
        description=defaults['name'],
        last_service_date=last_service_date,
        last_service_miles=last_service_miles,
        interval_miles=defaults['interval_miles'],
        interval_days=defaults['interval_days'],
        next_due_miles=next_due_miles,
        next_due_date=next_due_date.date().isoformat(),
        notes=notes
    )
    
    item_doc = item.model_dump()
    item_doc['created_at'] = item_doc['created_at'].isoformat()
    
    await db.maintenance.insert_one(item_doc)
    
    return {"message": "Maintenance item added!", "item_id": item.id}

@api_router.put("/maintenance/{item_id}/complete")
async def complete_maintenance(
    item_id: str,
    service_date: str,
    service_miles: int,
    user_email: str
):
    """Mark maintenance as complete and schedule next"""
    item = await db.maintenance.find_one({"id": item_id, "user_email": user_email})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Calculate next due
    service_dt = datetime.fromisoformat(service_date)
    next_due_date = service_dt + timedelta(days=item['interval_days'])
    next_due_miles = service_miles + item['interval_miles']
    
    await db.maintenance.update_one(
        {"id": item_id},
        {"$set": {
            "last_service_date": service_date,
            "last_service_miles": service_miles,
            "next_due_date": next_due_date.date().isoformat(),
            "next_due_miles": next_due_miles,
            "is_completed": False
        }}
    )
    
    # Award points
    await db.users.update_one(
        {"email": user_email},
        {"$inc": {"reward_points": 15}}
    )
    
    return {"message": "Maintenance logged!", "points_earned": 15, "next_due_date": next_due_date.date().isoformat()}

@api_router.delete("/maintenance/{item_id}")
async def delete_maintenance_item(item_id: str, user_email: str):
    """Delete a maintenance item"""
    result = await db.maintenance.delete_one({"id": item_id, "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# ============== REWARDS STORE ==============

REWARDS_CATALOG = [
    {"id": "premium_week", "name": "Premium Features (1 Week)", "description": "Unlock all premium features for 7 days", "cost": 500, "icon": "👑", "category": "features"},
    {"id": "premium_month", "name": "Premium Features (1 Month)", "description": "Unlock all premium features for 30 days", "cost": 1500, "icon": "💎", "category": "features"},
    {"id": "custom_badge", "name": "Custom Profile Badge", "description": "Display a custom badge on your profile", "cost": 300, "icon": "🎖️", "category": "cosmetic"},
    {"id": "priority_support", "name": "Priority Support", "description": "Get priority response from support team", "cost": 200, "icon": "⚡", "category": "service"},
    {"id": "ad_free_week", "name": "Ad-Free Experience (1 Week)", "description": "Remove all ads for 7 days", "cost": 250, "icon": "🚫", "category": "features"},
    {"id": "spotlight_boost", "name": "Spotlight Boost", "description": "Feature your profile in Driver Spotlight", "cost": 400, "icon": "🌟", "category": "visibility"},
    {"id": "mentor_badge", "name": "Verified Mentor Badge", "description": "Get a verified mentor badge", "cost": 600, "icon": "🎓", "category": "cosmetic"},
    {"id": "early_access", "name": "Early Access to Features", "description": "Try new features before everyone else", "cost": 350, "icon": "🚀", "category": "features"},
]

class RewardRedemption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    reward_id: str
    reward_name: str
    cost: int
    status: str = "active"
    expires_at: Optional[str] = None
    redeemed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/rewards/catalog")
async def get_rewards_catalog():
    """Get available rewards"""
    return REWARDS_CATALOG

@api_router.get("/rewards/user/{user_email}")
async def get_user_rewards(user_email: str):
    """Get user's redeemed rewards"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    redemptions = await db.reward_redemptions.find(
        {"user_email": user_email},
        {"_id": 0}
    ).sort("redeemed_at", -1).to_list(50)
    
    return {
        "available_points": user.get('reward_points', 0),
        "redemptions": redemptions
    }

@api_router.post("/rewards/redeem")
async def redeem_reward(reward_id: str, user_email: str):
    """Redeem a reward"""
    # Find reward
    reward = next((r for r in REWARDS_CATALOG if r['id'] == reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    # Check user points
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get('reward_points', 0) < reward['cost']:
        raise HTTPException(status_code=400, detail="Not enough points")
    
    # Calculate expiration for time-based rewards
    expires_at = None
    if "week" in reward_id.lower():
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    elif "month" in reward_id.lower():
        expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    # Create redemption
    redemption = RewardRedemption(
        user_email=user_email,
        reward_id=reward_id,
        reward_name=reward['name'],
        cost=reward['cost'],
        expires_at=expires_at
    )
    
    redemption_doc = redemption.model_dump()
    redemption_doc['redeemed_at'] = redemption_doc['redeemed_at'].isoformat()
    
    await db.reward_redemptions.insert_one(redemption_doc)
    
    # Deduct points
    await db.users.update_one(
        {"email": user_email},
        {"$inc": {"reward_points": -reward['cost']}}
    )
    
    logger.info(f"Reward redeemed: {user_email} - {reward['name']} for {reward['cost']} points")
    
    return {
        "message": f"Redeemed {reward['name']}!",
        "redemption_id": redemption.id,
        "expires_at": expires_at,
        "remaining_points": user.get('reward_points', 0) - reward['cost']
    }

# ============== TRUCK WEIGHT MANAGEMENT ==============

# Federal weight limits (in lbs)
FEDERAL_WEIGHT_LIMITS = {
    "single_axle": 20000,
    "tandem_axle": 34000,
    "tridem_axle": 42000,
    "gross_weight": 80000,
    "bridge_formula_note": "Total weight also limited by bridge formula based on axle spacing"
}

# State-specific variations (simplified - some states allow more)
STATE_WEIGHT_LIMITS = {
    "default": {"gross": 80000, "single": 20000, "tandem": 34000},
    "MI": {"gross": 164000, "single": 20000, "tandem": 34000, "note": "With special permit on designated roads"},
    "TX": {"gross": 84000, "single": 20000, "tandem": 34000, "note": "On designated highways"},
    "NY": {"gross": 80000, "single": 22400, "tandem": 36000},
    "CA": {"gross": 80000, "single": 20000, "tandem": 34000, "note": "Kingpin to rear axle max 40ft"},
}

class TruckWeightProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    truck_name: str  # e.g., "My Freightliner", "Unit 501"
    truck_type: str  # "semi", "straight", "tandem", "tri-axle"
    
    # Weight specs (all in lbs)
    empty_weight: int  # Truck + trailer empty
    gvwr: int  # Gross Vehicle Weight Rating
    gcwr: int  # Gross Combined Weight Rating (truck + trailer + cargo)
    
    # Axle configuration
    steer_axle_weight: int = 0  # Front axle empty
    drive_axle_weight: int = 0  # Drive axles empty (tandem usually)
    trailer_axle_weight: int = 0  # Trailer axles empty
    
    # Axle types
    drive_axle_type: str = "tandem"  # "single", "tandem", "tridem"
    trailer_axle_type: str = "tandem"  # "single", "tandem", "tridem", "spread"
    
    # Calculated max cargo
    max_cargo_weight: int = 0
    
    # Additional specs
    fuel_capacity_gallons: int = 0
    def_capacity_gallons: int = 0
    
    is_default: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TruckWeightProfileCreate(BaseModel):
    truck_name: str
    truck_type: str
    empty_weight: int
    gvwr: int
    gcwr: int
    steer_axle_weight: int = 0
    drive_axle_weight: int = 0
    trailer_axle_weight: int = 0
    drive_axle_type: str = "tandem"
    trailer_axle_type: str = "tandem"
    fuel_capacity_gallons: int = 0
    def_capacity_gallons: int = 0

class WeightCalculation(BaseModel):
    cargo_weight: int
    fuel_gallons: int = 0  # Current fuel (7 lbs/gallon for diesel)
    def_gallons: int = 0  # DEF fluid (9 lbs/gallon)
    additional_weight: int = 0  # Tools, chains, etc.

@api_router.get("/truck-weight/limits")
async def get_weight_limits(state: Optional[str] = None):
    """Get federal and state weight limits"""
    response = {
        "federal": FEDERAL_WEIGHT_LIMITS,
        "state_limits": STATE_WEIGHT_LIMITS.get(state.upper(), STATE_WEIGHT_LIMITS["default"]) if state else STATE_WEIGHT_LIMITS["default"],
        "tips": [
            "Weigh your truck empty to know exact weights",
            "Fuel weighs ~7 lbs/gallon, DEF ~9 lbs/gallon",
            "Scale tickets are proof - keep them",
            "Slide tandems to redistribute weight",
            "Bridge formula affects long wheelbase trucks"
        ]
    }
    if state:
        response["selected_state"] = state.upper()
    return response

@api_router.get("/truck-weight/profiles/{user_email}")
async def get_truck_profiles(user_email: str):
    """Get user's saved truck weight profiles"""
    profiles = await db.truck_weight_profiles.find(
        {"user_email": user_email},
        {"_id": 0}
    ).sort("is_default", -1).to_list(10)
    return profiles

@api_router.post("/truck-weight/profiles")
async def create_truck_profile(profile_data: TruckWeightProfileCreate, user_email: str):
    """Create a truck weight profile"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate max cargo
    max_cargo = profile_data.gcwr - profile_data.empty_weight
    
    profile = TruckWeightProfile(
        user_email=user_email,
        max_cargo_weight=max_cargo,
        **profile_data.model_dump()
    )
    
    # Check if this is first profile - make it default
    existing = await db.truck_weight_profiles.count_documents({"user_email": user_email})
    if existing == 0:
        profile.is_default = True
    
    profile_doc = profile.model_dump()
    profile_doc['created_at'] = profile_doc['created_at'].isoformat()
    profile_doc['updated_at'] = profile_doc['updated_at'].isoformat()
    
    await db.truck_weight_profiles.insert_one(profile_doc)
    
    # Award points
    await db.users.update_one(
        {"email": user_email},
        {"$inc": {"reward_points": 25}}
    )
    
    logger.info(f"Truck weight profile created: {user_email} - {profile.truck_name}")
    return {"message": "Truck profile saved!", "points_earned": 25, "profile_id": profile.id, "max_cargo_weight": max_cargo}

@api_router.put("/truck-weight/profiles/{profile_id}")
async def update_truck_profile(profile_id: str, profile_data: TruckWeightProfileCreate, user_email: str):
    """Update a truck weight profile"""
    max_cargo = profile_data.gcwr - profile_data.empty_weight
    
    result = await db.truck_weight_profiles.update_one(
        {"id": profile_id, "user_email": user_email},
        {"$set": {
            **profile_data.model_dump(),
            "max_cargo_weight": max_cargo,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"message": "Profile updated!", "max_cargo_weight": max_cargo}

@api_router.put("/truck-weight/profiles/{profile_id}/default")
async def set_default_profile(profile_id: str, user_email: str):
    """Set a profile as default"""
    # Remove default from all profiles
    await db.truck_weight_profiles.update_many(
        {"user_email": user_email},
        {"$set": {"is_default": False}}
    )
    
    # Set this one as default
    result = await db.truck_weight_profiles.update_one(
        {"id": profile_id, "user_email": user_email},
        {"$set": {"is_default": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"message": "Default profile set!"}

@api_router.delete("/truck-weight/profiles/{profile_id}")
async def delete_truck_profile(profile_id: str, user_email: str):
    """Delete a truck weight profile"""
    result = await db.truck_weight_profiles.delete_one(
        {"id": profile_id, "user_email": user_email}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"message": "Profile deleted!"}

@api_router.post("/truck-weight/calculate")
async def calculate_weight(
    profile_id: str,
    calculation: WeightCalculation,
    user_email: str
):
    """Calculate total weight and check against limits"""
    profile = await db.truck_weight_profiles.find_one(
        {"id": profile_id, "user_email": user_email},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Calculate weights
    fuel_weight = calculation.fuel_gallons * 7  # Diesel ~7 lbs/gallon
    def_weight = calculation.def_gallons * 9  # DEF ~9 lbs/gallon
    
    total_cargo = calculation.cargo_weight + calculation.additional_weight
    total_weight = profile['empty_weight'] + total_cargo + fuel_weight + def_weight
    
    # Estimate axle weights (simplified distribution)
    # Typically: 12% steer, 34% drives, 54% trailer for loaded semi
    steer_loaded = int(total_weight * 0.12)
    drive_loaded = int(total_weight * 0.34)
    trailer_loaded = int(total_weight * 0.54)
    
    # Get axle limits based on type
    def get_axle_limit(axle_type):
        limits = {"single": 20000, "tandem": 34000, "tridem": 42000, "spread": 34000}
        return limits.get(axle_type, 34000)
    
    drive_limit = get_axle_limit(profile.get('drive_axle_type', 'tandem'))
    trailer_limit = get_axle_limit(profile.get('trailer_axle_type', 'tandem'))
    
    # Check against limits
    warnings = []
    is_legal = True
    
    if total_weight > 80000:
        warnings.append(f"⚠️ OVERWEIGHT: {total_weight:,} lbs exceeds 80,000 lb federal limit by {total_weight - 80000:,} lbs")
        is_legal = False
    
    if steer_loaded > 12000:
        warnings.append(f"⚠️ Steer axle heavy: ~{steer_loaded:,} lbs (limit 12,000)")
        
    if drive_loaded > drive_limit:
        warnings.append(f"⚠️ Drive axles over: ~{drive_loaded:,} lbs (limit {drive_limit:,})")
        is_legal = False
        
    if trailer_loaded > trailer_limit:
        warnings.append(f"⚠️ Trailer axles over: ~{trailer_loaded:,} lbs (limit {trailer_limit:,})")
        is_legal = False
    
    # Calculate remaining capacity
    remaining_capacity = 80000 - total_weight
    
    # Tips
    tips = []
    if not is_legal:
        tips.append("Slide tandems to redistribute weight between axles")
        tips.append("Consider removing some cargo or fuel")
    if remaining_capacity > 0 and remaining_capacity < 5000:
        tips.append(f"Close to limit - only {remaining_capacity:,} lbs remaining")
    
    return {
        "is_legal": is_legal,
        "total_weight": total_weight,
        "remaining_capacity": max(0, remaining_capacity),
        "breakdown": {
            "empty_weight": profile['empty_weight'],
            "cargo_weight": calculation.cargo_weight,
            "fuel_weight": fuel_weight,
            "def_weight": def_weight,
            "additional_weight": calculation.additional_weight
        },
        "estimated_axle_weights": {
            "steer": steer_loaded,
            "drives": drive_loaded,
            "trailer": trailer_loaded
        },
        "limits": {
            "gross": 80000,
            "steer": 12000,
            "drives": drive_limit,
            "trailer": trailer_limit
        },
        "warnings": warnings,
        "tips": tips
    }

@api_router.get("/truck-weight/quick-check")
async def quick_weight_check(
    empty_weight: int,
    cargo_weight: int,
    fuel_gallons: int = 100
):
    """Quick weight check without profile"""
    fuel_weight = fuel_gallons * 7
    total = empty_weight + cargo_weight + fuel_weight
    
    is_legal = total <= 80000
    remaining = 80000 - total
    
    return {
        "is_legal": is_legal,
        "total_weight": total,
        "remaining_capacity": max(0, remaining),
        "breakdown": {
            "empty": empty_weight,
            "cargo": cargo_weight,
            "fuel": fuel_weight
        },
        "message": "✅ Legal weight" if is_legal else f"⚠️ OVERWEIGHT by {-remaining:,} lbs"
    }

# ============== HOURS OF SERVICE (HOS) TRACKER ==============

# HOS Rules (Federal Motor Carrier Safety Regulations)
HOS_RULES = {
    "driving_limit": 11 * 60,  # 11 hours in minutes
    "duty_window": 14 * 60,  # 14-hour duty window in minutes
    "weekly_limit": 70 * 60,  # 70 hours in 8 days in minutes
    "break_required_after": 8 * 60,  # 30-min break required after 8 hours driving
    "break_duration": 30,  # 30-minute break
    "sleeper_split_option": True,  # 7/3 or 8/2 split sleeper
    "restart_hours": 34,  # 34-hour restart
}

DUTY_STATUSES = ["off_duty", "sleeper", "driving", "on_duty"]

class HOSLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    status: str  # "off_duty", "sleeper", "driving", "on_duty"
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int = 0
    location: str = ""
    notes: str = ""
    vehicle_id: str = ""
    odometer_start: int = 0
    odometer_end: int = 0

class HOSLogCreate(BaseModel):
    status: str
    location: str = ""
    notes: str = ""
    vehicle_id: str = ""
    odometer: int = 0

class HOSSummary(BaseModel):
    driving_today: int = 0  # minutes
    duty_today: int = 0  # minutes (driving + on_duty)
    driving_remaining: int = 660  # 11 hours in minutes
    duty_window_remaining: int = 840  # 14 hours in minutes
    weekly_hours: int = 0  # minutes in last 8 days
    weekly_remaining: int = 4200  # 70 hours in minutes
    break_needed: bool = False
    time_until_break: int = 480  # minutes until break needed
    last_34_hour_restart: Optional[str] = None
    current_status: str = "off_duty"
    violations: List[str] = []

@api_router.get("/hos/rules")
async def get_hos_rules():
    """Get HOS rules reference"""
    return {
        "rules": {
            "driving_limit": "11 hours",
            "duty_window": "14 hours", 
            "weekly_limit": "70 hours in 8 days",
            "break_required": "30-min break after 8 hours driving",
            "restart": "34-hour restart resets weekly hours"
        },
        "statuses": [
            {"id": "off_duty", "name": "Off Duty", "icon": "🏠", "color": "gray"},
            {"id": "sleeper", "name": "Sleeper Berth", "icon": "😴", "color": "blue"},
            {"id": "driving", "name": "Driving", "icon": "🚛", "color": "green"},
            {"id": "on_duty", "name": "On Duty (Not Driving)", "icon": "📋", "color": "amber"}
        ],
        "tips": [
            "Start your 14-hour window when you first go On Duty or Driving",
            "The 14-hour window cannot be extended with breaks",
            "Sleeper berth time of 7+ hours pauses your 14-hour clock",
            "34-hour restart must include two 1am-5am periods"
        ]
    }

@api_router.get("/hos/summary/{user_email}")
async def get_hos_summary(user_email: str):
    """Get current HOS summary with remaining time"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    eight_days_ago = now - timedelta(days=8)
    
    # Get today's logs
    today_logs = await db.hos_logs.find({
        "user_email": user_email,
        "start_time": {"$gte": today_start.isoformat()}
    }, {"_id": 0}).sort("start_time", 1).to_list(100)
    
    # Get last 8 days logs for weekly calculation
    weekly_logs = await db.hos_logs.find({
        "user_email": user_email,
        "start_time": {"$gte": eight_days_ago.isoformat()}
    }, {"_id": 0}).sort("start_time", 1).to_list(500)
    
    # Calculate today's hours
    driving_today = 0
    on_duty_today = 0
    duty_window_start = None
    
    for log in today_logs:
        duration = log.get('duration_minutes', 0)
        if log['status'] == 'driving':
            driving_today += duration
            if not duty_window_start:
                duty_window_start = log['start_time']
        elif log['status'] == 'on_duty':
            on_duty_today += duration
            if not duty_window_start:
                duty_window_start = log['start_time']
    
    # Calculate weekly hours
    weekly_driving = 0
    weekly_on_duty = 0
    
    for log in weekly_logs:
        duration = log.get('duration_minutes', 0)
        if log['status'] == 'driving':
            weekly_driving += duration
        elif log['status'] == 'on_duty':
            weekly_on_duty += duration
    
    total_duty_today = driving_today + on_duty_today
    weekly_total = weekly_driving + weekly_on_duty
    
    # Calculate duty window remaining
    duty_window_remaining = HOS_RULES['duty_window']
    if duty_window_start:
        start_dt = datetime.fromisoformat(duty_window_start.replace('Z', '+00:00')) if isinstance(duty_window_start, str) else duty_window_start
        elapsed = (now - start_dt).total_seconds() / 60
        duty_window_remaining = max(0, HOS_RULES['duty_window'] - elapsed)
    
    # Check for break requirement
    time_since_break = 0
    break_needed = False
    for log in reversed(today_logs):
        if log['status'] in ['off_duty', 'sleeper'] and log.get('duration_minutes', 0) >= 30:
            break
        if log['status'] == 'driving':
            time_since_break += log.get('duration_minutes', 0)
    
    if time_since_break >= HOS_RULES['break_required_after']:
        break_needed = True
    
    # Get current status
    current_status = "off_duty"
    current_log = await db.hos_logs.find_one(
        {"user_email": user_email, "end_time": None},
        {"_id": 0},
        sort=[("start_time", -1)]
    )
    if current_log:
        current_status = current_log['status']
    
    # Check for violations
    violations = []
    if driving_today > HOS_RULES['driving_limit']:
        violations.append(f"⚠️ Driving limit exceeded: {driving_today // 60}h {driving_today % 60}m / 11h")
    if duty_window_remaining <= 0:
        violations.append("⚠️ 14-hour duty window exhausted")
    if weekly_total > HOS_RULES['weekly_limit']:
        violations.append(f"⚠️ Weekly limit exceeded: {weekly_total // 60}h / 70h")
    if break_needed:
        violations.append("⚠️ 30-minute break required (8 hours driving)")
    
    return {
        "current_status": current_status,
        "today": {
            "driving_minutes": driving_today,
            "driving_display": f"{driving_today // 60}h {driving_today % 60}m",
            "driving_remaining": max(0, HOS_RULES['driving_limit'] - driving_today),
            "driving_remaining_display": f"{max(0, HOS_RULES['driving_limit'] - driving_today) // 60}h {max(0, HOS_RULES['driving_limit'] - driving_today) % 60}m",
            "duty_minutes": total_duty_today,
            "duty_display": f"{total_duty_today // 60}h {total_duty_today % 60}m",
            "duty_window_remaining": int(duty_window_remaining),
            "duty_window_remaining_display": f"{int(duty_window_remaining) // 60}h {int(duty_window_remaining) % 60}m"
        },
        "weekly": {
            "total_minutes": weekly_total,
            "total_display": f"{weekly_total // 60}h {weekly_total % 60}m",
            "remaining_minutes": max(0, HOS_RULES['weekly_limit'] - weekly_total),
            "remaining_display": f"{max(0, HOS_RULES['weekly_limit'] - weekly_total) // 60}h {max(0, HOS_RULES['weekly_limit'] - weekly_total) % 60}m"
        },
        "break": {
            "needed": break_needed,
            "time_since_last": time_since_break,
            "time_until_required": max(0, HOS_RULES['break_required_after'] - time_since_break)
        },
        "violations": violations,
        "is_compliant": len(violations) == 0
    }

@api_router.post("/hos/log")
async def log_duty_status(log_data: HOSLogCreate, user_email: str):
    """Log a duty status change"""
    if log_data.status not in DUTY_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {DUTY_STATUSES}")
    
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.now(timezone.utc)
    
    # End any current active log
    current_log = await db.hos_logs.find_one(
        {"user_email": user_email, "end_time": None}
    )
    
    if current_log:
        start_time = datetime.fromisoformat(current_log['start_time'].replace('Z', '+00:00')) if isinstance(current_log['start_time'], str) else current_log['start_time']
        duration = int((now - start_time).total_seconds() / 60)
        
        await db.hos_logs.update_one(
            {"id": current_log['id']},
            {"$set": {
                "end_time": now.isoformat(),
                "duration_minutes": duration,
                "odometer_end": log_data.odometer if log_data.odometer > 0 else current_log.get('odometer_start', 0)
            }}
        )
    
    # Create new log
    new_log = HOSLog(
        user_email=user_email,
        status=log_data.status,
        start_time=now,
        location=log_data.location,
        notes=log_data.notes,
        vehicle_id=log_data.vehicle_id,
        odometer_start=log_data.odometer
    )
    
    log_doc = new_log.model_dump()
    log_doc['start_time'] = log_doc['start_time'].isoformat()
    
    await db.hos_logs.insert_one(log_doc)
    
    # Get updated summary
    summary = await get_hos_summary(user_email)
    
    # Create notification if violation
    if summary.get('violations'):
        notification = Notification(
            recipient_email=user_email,
            type="hos_violation",
            title="⚠️ HOS Violation Warning",
            message=summary['violations'][0],
            data={"violations": summary['violations']}
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
    
    logger.info(f"HOS logged: {user_email} - {log_data.status}")
    
    return {
        "message": f"Status changed to {log_data.status}",
        "log_id": new_log.id,
        "summary": summary
    }

@api_router.get("/hos/logs/{user_email}")
async def get_hos_logs(user_email: str, days: int = 7):
    """Get HOS logs for specified days"""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    logs = await db.hos_logs.find({
        "user_email": user_email,
        "start_time": {"$gte": start_date.isoformat()}
    }, {"_id": 0}).sort("start_time", -1).to_list(500)
    
    return logs

@api_router.get("/hos/daily/{user_email}/{date}")
async def get_daily_hos(user_email: str, date: str):
    """Get HOS logs for a specific day"""
    try:
        day_start = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    logs = await db.hos_logs.find({
        "user_email": user_email,
        "start_time": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
    }, {"_id": 0}).sort("start_time", 1).to_list(100)
    
    # Calculate totals for the day
    totals = {"driving": 0, "on_duty": 0, "off_duty": 0, "sleeper": 0}
    for log in logs:
        status = log['status']
        duration = log.get('duration_minutes', 0)
        totals[status] = totals.get(status, 0) + duration
    
    return {
        "date": date,
        "logs": logs,
        "totals": {
            "driving": f"{totals['driving'] // 60}h {totals['driving'] % 60}m",
            "on_duty": f"{totals['on_duty'] // 60}h {totals['on_duty'] % 60}m",
            "off_duty": f"{totals['off_duty'] // 60}h {totals['off_duty'] % 60}m",
            "sleeper": f"{totals['sleeper'] // 60}h {totals['sleeper'] % 60}m"
        }
    }

@api_router.get("/hos/restart-calculator/{user_email}")
async def calculate_restart(user_email: str):
    """Calculate when 34-hour restart will complete"""
    # Find last duty activity
    last_duty = await db.hos_logs.find_one(
        {"user_email": user_email, "status": {"$in": ["driving", "on_duty"]}},
        {"_id": 0},
        sort=[("end_time", -1)]
    )
    
    if not last_duty or not last_duty.get('end_time'):
        return {
            "can_restart": True,
            "message": "No recent duty activity found",
            "restart_available": True
        }
    
    last_duty_end = datetime.fromisoformat(last_duty['end_time'].replace('Z', '+00:00')) if isinstance(last_duty['end_time'], str) else last_duty['end_time']
    now = datetime.now(timezone.utc)
    hours_off = (now - last_duty_end).total_seconds() / 3600
    
    if hours_off >= 34:
        return {
            "can_restart": True,
            "hours_off": round(hours_off, 1),
            "message": "34-hour restart complete! Weekly hours reset.",
            "restart_completed_at": (last_duty_end + timedelta(hours=34)).isoformat()
        }
    else:
        restart_time = last_duty_end + timedelta(hours=34)
        hours_remaining = 34 - hours_off
        return {
            "can_restart": False,
            "hours_off": round(hours_off, 1),
            "hours_remaining": round(hours_remaining, 1),
            "restart_completes_at": restart_time.isoformat(),
            "message": f"{round(hours_remaining, 1)} hours until 34-hour restart completes"
        }

@api_router.delete("/hos/log/{log_id}")
async def delete_hos_log(log_id: str, user_email: str):
    """Delete a HOS log entry (admin/correction)"""
    result = await db.hos_logs.delete_one({"id": log_id, "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted"}

# ============== FORGOT PASSWORD ==============

# Pydantic models for password reset
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset - sends 6-digit code"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists - still return success
        return {"message": "If email exists, reset code will be sent"}
    
    # Generate 6-digit reset code (easier for users to enter)
    reset_code = str(random.randint(100000, 999999))
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Delete any existing reset codes for this email
    await db.password_resets.delete_many({"email": request.email})
    
    await db.password_resets.insert_one({
        "email": request.email,
        "reset_code": reset_code,
        "expires": expires.isoformat(),
        "used": False
    })
    
    # In production, send email here
    logger.info(f"Password reset requested for {request.email}, code: {reset_code}")
    
    # For testing, return the code (MOCKED - remove in production)
    return {
        "message": "Reset code sent! Check your email.",
        "reset_code": reset_code  # MOCKED for testing - shows in UI toast
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with 6-digit code"""
    reset = await db.password_resets.find_one({
        "email": request.email,
        "reset_code": request.reset_code,
        "used": False
    })
    
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
    expires = datetime.fromisoformat(reset['expires'].replace('Z', '+00:00')) if isinstance(reset['expires'], str) else reset['expires']
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    # Hash new password using bcrypt (same as registration)
    hashed = hash_password(request.new_password)
    
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"password_hash": hashed}}
    )
    
    await db.password_resets.update_one(
        {"email": request.email, "reset_code": request.reset_code},
        {"$set": {"used": True}}
    )
    
    logger.info(f"Password reset successful for {request.email}")
    return {"message": "Password reset successfully"}

# ============== DEMO ACCOUNT ==============

DEMO_ACCOUNT = {
    "email": "demo@trukall.app",
    "password": "demo123",
    "name": "Demo Driver",
    "role": "driver"
}

@api_router.post("/auth/demo-login")
async def demo_login():
    """Login with demo account"""
    # Check if demo account exists
    demo_user = await db.users.find_one({"email": DEMO_ACCOUNT["email"]}, {"_id": 0})
    
    if not demo_user:
        # Create demo account using the same password hashing as regular users
        hashed = hash_password(DEMO_ACCOUNT["password"])
        demo_user = {
            "email": DEMO_ACCOUNT["email"],
            "password_hash": hashed,
            "name": DEMO_ACCOUNT["name"],
            "role": DEMO_ACCOUNT["role"],
            "reward_points": 500,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_demo": True
        }
        await db.users.insert_one(demo_user)
        # Refetch without _id
        demo_user = await db.users.find_one({"email": DEMO_ACCOUNT["email"]}, {"_id": 0})
    
    # Remove password hash from response
    demo_user.pop('password_hash', None)
    
    return {
        "user": {
            "email": demo_user.get("email"),
            "name": demo_user.get("name"),
            "role": demo_user.get("role", "driver"),
            "reward_points": demo_user.get("reward_points", 500),
            "is_demo": True
        },
        "message": "Demo login successful! Explore all features."
    }

# ============== APP STATS & LAUNCH CONFIG ==============

LAUNCH_CONFIG = {
    "launch_offer_active": True,
    "launch_offer_text": "🚀 Launch Special: Free Pro for 30 days!",
    "launch_offer_slots": 500,
    "boosted_referral_active": True,
    "boosted_referral_points": 1000,  # Instead of 500
    "boosted_referral_new_user": 500,  # Instead of 250
}

@api_router.get("/app/stats")
async def get_app_stats():
    """Get app statistics for social proof"""
    user_count = await db.users.count_documents({})
    review_count = await db.reviews.count_documents({})
    spot_count = await db.parking_spots.count_documents({})
    load_count = await db.loads.count_documents({})
    
    # Round up for social proof
    display_users = max(100, ((user_count // 100) + 1) * 100) if user_count < 1000 else user_count
    
    return {
        "users": user_count,
        "display_users": display_users,
        "reviews": review_count,
        "parking_spots": spot_count,
        "loads": load_count,
        "launch_config": LAUNCH_CONFIG
    }

@api_router.get("/app/launch-config")
async def get_launch_config():
    """Get launch configuration"""
    claimed = await db.users.count_documents({"launch_offer_claimed": True})
    remaining = max(0, LAUNCH_CONFIG["launch_offer_slots"] - claimed)
    
    return {
        **LAUNCH_CONFIG,
        "slots_claimed": claimed,
        "slots_remaining": remaining
    }

# ============== SEED DATA ==============

SEED_TRUCK_STOPS = [
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Atlanta", "state": "GA", "lat": 33.7490, "lng": -84.3880, "capacity": 150, "amenities": ["fuel", "showers", "food", "wifi", "scales"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Dallas", "state": "TX", "lat": 32.7767, "lng": -96.7970, "capacity": 200, "amenities": ["fuel", "showers", "food", "wifi", "def"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "Oklahoma City", "state": "OK", "lat": 35.4676, "lng": -97.5164, "capacity": 175, "amenities": ["fuel", "showers", "food", "wifi", "tire_care"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Nashville", "state": "TN", "lat": 36.1627, "lng": -86.7816, "capacity": 180, "amenities": ["fuel", "showers", "food", "wifi", "truck_wash"]},
    {"name": "Petro Stopping Center", "chain": "Petro", "city": "Chicago", "state": "IL", "lat": 41.8781, "lng": -87.6298, "capacity": 160, "amenities": ["fuel", "showers", "food", "wifi", "iron_skillet"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Los Angeles", "state": "CA", "lat": 34.0522, "lng": -118.2437, "capacity": 140, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Phoenix", "state": "AZ", "lat": 33.4484, "lng": -112.0740, "capacity": 190, "amenities": ["fuel", "showers", "food", "wifi", "def", "scales"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "Denver", "state": "CO", "lat": 39.7392, "lng": -104.9903, "capacity": 165, "amenities": ["fuel", "showers", "food", "wifi", "godfather_pizza"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Memphis", "state": "TN", "lat": 35.1495, "lng": -90.0490, "capacity": 155, "amenities": ["fuel", "showers", "food", "wifi", "truck_service"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Indianapolis", "state": "IN", "lat": 39.7684, "lng": -86.1581, "capacity": 145, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Kansas City", "state": "MO", "lat": 39.0997, "lng": -94.5786, "capacity": 185, "amenities": ["fuel", "showers", "food", "wifi", "def"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "Houston", "state": "TX", "lat": 29.7604, "lng": -95.3698, "capacity": 200, "amenities": ["fuel", "showers", "food", "wifi", "chester_chicken"]},
    {"name": "TA Express", "chain": "TA", "city": "San Antonio", "state": "TX", "lat": 29.4241, "lng": -98.4936, "capacity": 120, "amenities": ["fuel", "showers", "food"]},
    {"name": "Petro Stopping Center", "chain": "Petro", "city": "St. Louis", "state": "MO", "lat": 38.6270, "lng": -90.1994, "capacity": 170, "amenities": ["fuel", "showers", "food", "wifi", "iron_skillet"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Charlotte", "state": "NC", "lat": 35.2271, "lng": -80.8431, "capacity": 135, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Jacksonville", "state": "FL", "lat": 30.3322, "lng": -81.6557, "capacity": 175, "amenities": ["fuel", "showers", "food", "wifi", "def"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "Columbus", "state": "OH", "lat": 39.9612, "lng": -82.9988, "capacity": 160, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Louisville", "state": "KY", "lat": 38.2527, "lng": -85.7585, "capacity": 150, "amenities": ["fuel", "showers", "food", "wifi", "truck_wash"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Baltimore", "state": "MD", "lat": 39.2904, "lng": -76.6122, "capacity": 130, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Las Vegas", "state": "NV", "lat": 36.1699, "lng": -115.1398, "capacity": 195, "amenities": ["fuel", "showers", "food", "wifi", "def", "scales"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "Albuquerque", "state": "NM", "lat": 35.0844, "lng": -106.6504, "capacity": 155, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Little Rock", "state": "AR", "lat": 34.7465, "lng": -92.2896, "capacity": 140, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Petro Stopping Center", "chain": "Petro", "city": "Birmingham", "state": "AL", "lat": 33.5207, "lng": -86.8025, "capacity": 165, "amenities": ["fuel", "showers", "food", "wifi", "iron_skillet"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Salt Lake City", "state": "UT", "lat": 40.7608, "lng": -111.8910, "capacity": 145, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Portland", "state": "OR", "lat": 45.5152, "lng": -122.6784, "capacity": 170, "amenities": ["fuel", "showers", "food", "wifi", "def"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "Seattle", "state": "WA", "lat": 47.6062, "lng": -122.3321, "capacity": 150, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Minneapolis", "state": "MN", "lat": 44.9778, "lng": -93.2650, "capacity": 175, "amenities": ["fuel", "showers", "food", "wifi", "truck_service"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Detroit", "state": "MI", "lat": 42.3314, "lng": -83.0458, "capacity": 140, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Omaha", "state": "NE", "lat": 41.2565, "lng": -95.9345, "capacity": 180, "amenities": ["fuel", "showers", "food", "wifi", "def"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "Tulsa", "state": "OK", "lat": 36.1540, "lng": -95.9928, "capacity": 160, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Richmond", "state": "VA", "lat": 37.5407, "lng": -77.4360, "capacity": 135, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Petro Stopping Center", "chain": "Petro", "city": "Knoxville", "state": "TN", "lat": 35.9606, "lng": -83.9207, "capacity": 155, "amenities": ["fuel", "showers", "food", "wifi", "iron_skillet"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Raleigh", "state": "NC", "lat": 35.7796, "lng": -78.6382, "capacity": 130, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Boise", "state": "ID", "lat": 43.6150, "lng": -116.2023, "capacity": 165, "amenities": ["fuel", "showers", "food", "wifi", "def"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "El Paso", "state": "TX", "lat": 31.7619, "lng": -106.4850, "capacity": 145, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Fresno", "state": "CA", "lat": 36.7378, "lng": -119.7871, "capacity": 170, "amenities": ["fuel", "showers", "food", "wifi", "truck_wash"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Bakersfield", "state": "CA", "lat": 35.3733, "lng": -119.0187, "capacity": 155, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Sacramento", "state": "CA", "lat": 38.5816, "lng": -121.4944, "capacity": 185, "amenities": ["fuel", "showers", "food", "wifi", "def", "scales"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "San Diego", "state": "CA", "lat": 32.7157, "lng": -117.1611, "capacity": 140, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Tucson", "state": "AZ", "lat": 32.2226, "lng": -110.9747, "capacity": 160, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Petro Stopping Center", "chain": "Petro", "city": "Amarillo", "state": "TX", "lat": 35.2220, "lng": -101.8313, "capacity": 175, "amenities": ["fuel", "showers", "food", "wifi", "iron_skillet"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Lubbock", "state": "TX", "lat": 33.5779, "lng": -101.8552, "capacity": 135, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Wichita", "state": "KS", "lat": 37.6872, "lng": -97.3301, "capacity": 170, "amenities": ["fuel", "showers", "food", "wifi", "def"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "Des Moines", "state": "IA", "lat": 41.5868, "lng": -93.6250, "capacity": 150, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Springfield", "state": "MO", "lat": 37.2090, "lng": -93.2923, "capacity": 145, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Pilot Travel Center", "chain": "Pilot", "city": "Jackson", "state": "MS", "lat": 32.2988, "lng": -90.1848, "capacity": 140, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Flying J Travel Center", "chain": "Flying J", "city": "Mobile", "state": "AL", "lat": 30.6954, "lng": -88.0399, "capacity": 165, "amenities": ["fuel", "showers", "food", "wifi", "def"]},
    {"name": "Love's Travel Stop", "chain": "Love's", "city": "New Orleans", "state": "LA", "lat": 29.9511, "lng": -90.0715, "capacity": 155, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "TA Travel Center", "chain": "TA", "city": "Shreveport", "state": "LA", "lat": 32.5252, "lng": -93.7502, "capacity": 150, "amenities": ["fuel", "showers", "food", "wifi"]},
    {"name": "Petro Stopping Center", "chain": "Petro", "city": "Baton Rouge", "state": "LA", "lat": 30.4515, "lng": -91.1871, "capacity": 160, "amenities": ["fuel", "showers", "food", "wifi", "iron_skillet"]},
]

SEED_LOADS = [
    {"origin": "Atlanta, GA", "destination": "Dallas, TX", "weight": 42000, "rate": 3200, "miles": 780, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Chicago, IL", "destination": "Los Angeles, CA", "weight": 38000, "rate": 5500, "miles": 2015, "equipment": "Reefer", "pickup": "Tomorrow"},
    {"origin": "Houston, TX", "destination": "Miami, FL", "weight": 44000, "rate": 2800, "miles": 1190, "equipment": "Flatbed", "pickup": "ASAP"},
    {"origin": "Phoenix, AZ", "destination": "Denver, CO", "weight": 35000, "rate": 1800, "miles": 600, "equipment": "Dry Van", "pickup": "2 Days"},
    {"origin": "Seattle, WA", "destination": "Portland, OR", "weight": 40000, "rate": 650, "miles": 175, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Nashville, TN", "destination": "Memphis, TN", "weight": 36000, "rate": 550, "miles": 210, "equipment": "Reefer", "pickup": "Tomorrow"},
    {"origin": "Las Vegas, NV", "destination": "Salt Lake City, UT", "weight": 41000, "rate": 1400, "miles": 420, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Kansas City, MO", "destination": "St. Louis, MO", "weight": 39000, "rate": 600, "miles": 250, "equipment": "Flatbed", "pickup": "Tomorrow"},
    {"origin": "Indianapolis, IN", "destination": "Columbus, OH", "weight": 43000, "rate": 480, "miles": 175, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Charlotte, NC", "destination": "Raleigh, NC", "weight": 37000, "rate": 380, "miles": 165, "equipment": "Reefer", "pickup": "2 Days"},
    {"origin": "Detroit, MI", "destination": "Cleveland, OH", "weight": 40000, "rate": 520, "miles": 170, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Minneapolis, MN", "destination": "Milwaukee, WI", "weight": 38000, "rate": 680, "miles": 340, "equipment": "Reefer", "pickup": "Tomorrow"},
    {"origin": "San Antonio, TX", "destination": "Austin, TX", "weight": 42000, "rate": 320, "miles": 80, "equipment": "Flatbed", "pickup": "ASAP"},
    {"origin": "Jacksonville, FL", "destination": "Tampa, FL", "weight": 35000, "rate": 480, "miles": 200, "equipment": "Dry Van", "pickup": "Tomorrow"},
    {"origin": "Oklahoma City, OK", "destination": "Tulsa, OK", "weight": 39000, "rate": 350, "miles": 105, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Omaha, NE", "destination": "Lincoln, NE", "weight": 41000, "rate": 280, "miles": 55, "equipment": "Reefer", "pickup": "2 Days"},
    {"origin": "Albuquerque, NM", "destination": "El Paso, TX", "weight": 36000, "rate": 720, "miles": 265, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Louisville, KY", "destination": "Lexington, KY", "weight": 38000, "rate": 320, "miles": 80, "equipment": "Flatbed", "pickup": "Tomorrow"},
    {"origin": "Richmond, VA", "destination": "Norfolk, VA", "weight": 40000, "rate": 380, "miles": 95, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Boise, ID", "destination": "Spokane, WA", "weight": 37000, "rate": 850, "miles": 290, "equipment": "Reefer", "pickup": "2 Days"},
    {"origin": "New York, NY", "destination": "Boston, MA", "weight": 35000, "rate": 680, "miles": 215, "equipment": "Dry Van", "pickup": "ASAP"},
    {"origin": "Philadelphia, PA", "destination": "Pittsburgh, PA", "weight": 42000, "rate": 750, "miles": 305, "equipment": "Flatbed", "pickup": "Tomorrow"},
]

SEED_COMMUNITY_POSTS = [
    {"category": "tips", "title": "Best fuel stops on I-40", "content": "Hey drivers! Just wanted to share my favorite fuel stops along I-40. The Love's in Amarillo has great prices and clean showers. Flying J in OKC is also solid. What are your favorites?", "author": "RoadWarrior_Mike"},
    {"category": "routes", "title": "Avoiding Chicago traffic - my strategy", "content": "After 15 years of trucking, I've figured out the best times to hit Chicago. Early morning (3-5am) or late night (10pm+). I-294 tolls are worth it during rush hour. Share your tips!", "author": "ChicagoHauler"},
    {"category": "parking", "title": "Hidden gem rest area in Tennessee", "content": "Found an amazing rest area on I-40 near Cookeville. Usually has spots even at night, clean facilities, and there's a small diner within walking distance. Mile marker 287.", "author": "NightOwlTrucker"},
    {"category": "deals", "title": "Free shower hack at Pilot/Flying J", "content": "Pro tip: Download the myRewards app and you get a free shower for every 100 gallons. Stack your points across both chains! Also, they often have bonus point days.", "author": "SaverDriver"},
    {"category": "questions", "title": "New driver - best ELD recommendations?", "content": "Just got my CDL and starting with a small fleet. Looking for ELD recommendations that are reliable and easy to use. What do you all recommend? Budget is around $200-300.", "author": "NewbieNate"},
    {"category": "general", "title": "Dealing with dispatcher issues", "content": "How do you all handle dispatchers who consistently give unrealistic delivery times? Looking for advice on professional ways to push back. Been in this industry 5 years.", "author": "FrustratedFred"},
    {"category": "tips", "title": "Cold weather starting tips", "content": "Winter is coming! Here are my tips for cold weather: 1) Block heater is your friend 2) Keep fuel tank above half 3) Check air dryer daily 4) Anti-gel additive works. Stay safe out there!", "author": "WinterTrucker"},
    {"category": "parking", "title": "Walmart parking - which ones allow trucks?", "content": "Made a list of Walmarts that still allow overnight truck parking. Will update as I find more. Note: Always check with security first. List in comments below.", "author": "WalmartMapper"},
    {"category": "routes", "title": "Mountain driving tips for new drivers", "content": "Heading through the Rockies for the first time? Key tips: Use lower gears going down, jake brake is your friend, watch tire temps, and pull over if brakes smell. Take your time!", "author": "MountainMaster"},
    {"category": "deals", "title": "TA Rewards program changes", "content": "Just got an email about TA changing their rewards program. Looks like they're matching Love's now. 1 point per gallon, free shower at 50 gallons. Not bad!", "author": "RewardsHunter"},
]

@api_router.post("/admin/seed-data")
async def seed_data():
    """Seed the database with sample data for launch"""
    results = {"parking_spots": 0, "loads": 0, "community_posts": 0}
    
    # Seed parking spots
    for stop in SEED_TRUCK_STOPS:
        existing = await db.parking_spots.find_one({"name": stop["name"], "city": stop["city"]})
        if not existing:
            spot = {
                "id": str(uuid.uuid4()),
                "name": stop["name"],
                "chain": stop["chain"],
                "city": stop["city"],
                "state": stop["state"],
                "address": f"{stop['city']}, {stop['state']}",
                "latitude": stop["lat"],
                "longitude": stop["lng"],
                "total_spaces": stop["capacity"],
                "available_spaces": int(stop["capacity"] * 0.6),  # 60% available
                "amenities": stop["amenities"],
                "price_per_night": 0 if stop["chain"] in ["Pilot", "Flying J", "Love's"] else 15,
                "rating": round(3.5 + (hash(stop["name"]) % 15) / 10, 1),
                "review_count": hash(stop["name"]) % 50 + 5,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.parking_spots.insert_one(spot)
            results["parking_spots"] += 1
    
    # Seed loads
    for load in SEED_LOADS:
        existing = await db.loads.find_one({"origin": load["origin"], "destination": load["destination"], "rate": load["rate"]})
        if not existing:
            load_doc = {
                "id": str(uuid.uuid4()),
                "origin": load["origin"],
                "destination": load["destination"],
                "weight": load["weight"],
                "rate": load["rate"],
                "rate_per_mile": round(load["rate"] / load["miles"], 2),
                "miles": load["miles"],
                "equipment_type": load["equipment"],
                "pickup_date": load["pickup"],
                "delivery_date": "Flexible",
                "broker": f"TrukAll Verified #{hash(load['origin']) % 1000}",
                "broker_rating": round(3.8 + (hash(load["origin"]) % 12) / 10, 1),
                "status": "available",
                "posted_at": datetime.now(timezone.utc).isoformat()
            }
            await db.loads.insert_one(load_doc)
            results["loads"] += 1
    
    # Seed community posts
    for post in SEED_COMMUNITY_POSTS:
        existing = await db.community_posts.find_one({"title": post["title"]})
        if not existing:
            post_doc = {
                "id": str(uuid.uuid4()),
                "author_email": f"{post['author'].lower()}@trukall.app",
                "author_name": post["author"],
                "category": post["category"],
                "title": post["title"],
                "content": post["content"],
                "images": [],
                "likes": hash(post["title"]) % 30 + 5,
                "liked_by": [],
                "comments_count": hash(post["title"]) % 10,
                "is_pinned": False,
                "is_featured": post["category"] == "tips",
                "tags": [],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=hash(post["title"]) % 14)).isoformat()
            }
            await db.community_posts.insert_one(post_doc)
            results["community_posts"] += 1
    
    logger.info(f"Seed data created: {results}")
    return {"message": "Seed data created!", "results": results}

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
