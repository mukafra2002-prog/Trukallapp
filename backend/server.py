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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# ============== EMERGENCY SOS ==============

@api_router.post("/emergency/sos", response_model=EmergencySOS)
async def create_emergency_sos(sos_data: EmergencySOSCreate, driver_email: str):
    user = await db.users.find_one({"email": driver_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sos = EmergencySOS(
        driver_email=user['email'],
        driver_name=user['name'],
        driver_phone=user.get('phone', 'N/A'),
        **sos_data.model_dump()
    )
    
    sos_doc = sos.model_dump()
    sos_doc['created_at'] = sos_doc['created_at'].isoformat()
    
    await db.emergency_sos.insert_one(sos_doc)
    logger.critical(f"EMERGENCY SOS: {user['name']} at ({sos.latitude}, {sos.longitude}) - {sos.emergency_type}")
    
    return sos

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
    
    # Calculate hours since last reset
    last_reset = datetime.fromisoformat(user['hos_last_reset'])
    hours_since_reset = (datetime.now(timezone.utc) - last_reset).total_seconds() / 3600
    
    hours_remaining = max(0, user['hos_hours_remaining'] - hours_since_reset)
    
    return {
        "hours_remaining": round(hours_remaining, 1),
        "last_reset": user['hos_last_reset'],
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
