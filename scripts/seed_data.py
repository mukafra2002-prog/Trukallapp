#!/usr/bin/env python3
"""
Seed script to populate the database with sample data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import sys
sys.path.append('/app/backend')

from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🌱 Seeding database: {db_name}")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.parking_spots.delete_many({})
    await db.bookings.delete_many({})
    await db.payment_transactions.delete_many({})
    
    print("✓ Cleared existing data")
    
    # Create users (passwords are all 'password123')
    import bcrypt
    password_hash = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    users = [
        {
            "id": "driver-001",
            "email": "driver@test.com",
            "name": "John Driver",
            "role": "driver",
            "phone": "555-1234",
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "partner-001",
            "email": "partner@test.com",
            "name": "Mike Partner",
            "role": "partner",
            "phone": "555-5678",
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "admin-001",
            "email": "admin@test.com",
            "name": "Admin User",
            "role": "admin",
            "phone": "555-9999",
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.users.insert_many(users)
    print(f"✓ Created {len(users)} users")
    print("  - driver@test.com / password123")
    print("  - partner@test.com / password123")
    print("  - admin@test.com / password123")
    
    # Create parking spots
    parking_spots = [
        {
            "id": "spot-001",
            "name": "Dallas Highway 45 Truck Stop",
            "address": "1234 Highway 45 North",
            "city": "Dallas",
            "state": "TX",
            "latitude": 32.7767,
            "longitude": -96.7970,
            "total_spaces": 50,
            "available_spaces": 12,
            "price_per_night": 25.00,
            "amenities": ["shower", "restroom", "food", "fuel", "security", "wifi"],
            "is_free": False,
            "security_level": "high",
            "partner_id": "partner-001",
            "description": "Well-lit 24/7 secure parking with full amenities. Diesel and gas station on-site.",
            "images": [],
            "fuel_price_diesel": 3.89,
            "fuel_price_unleaded": 3.29,
            "status": "active",
            "rating": 4.5,
            "total_reviews": 125,
            "weather_alert": "clear",
            "weigh_station_nearby": True,
            "weigh_station_status": "open",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "spot-002",
            "name": "Atlanta Rest Area",
            "address": "5678 Interstate 85",
            "city": "Atlanta",
            "state": "GA",
            "latitude": 33.7490,
            "longitude": -84.3880,
            "total_spaces": 30,
            "available_spaces": 5,
            "price_per_night": 20.00,
            "amenities": ["restroom", "food", "security"],
            "is_free": False,
            "security_level": "medium",
            "partner_id": "partner-001",
            "description": "Convenient location off I-85. Clean facilities and good food options nearby.",
            "images": [],
            "fuel_price_diesel": 3.79,
            "fuel_price_unleaded": None,
            "status": "active",
            "rating": 4.2,
            "total_reviews": 89,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "spot-003",
            "name": "Phoenix Free Parking",
            "address": "9012 Desert Highway",
            "city": "Phoenix",
            "state": "AZ",
            "latitude": 33.4484,
            "longitude": -112.0740,
            "total_spaces": 20,
            "available_spaces": 20,
            "price_per_night": 0.00,
            "amenities": ["restroom", "wifi"],
            "is_free": True,
            "security_level": "low",
            "partner_id": "partner-001",
            "description": "Free overnight parking for truckers. Basic facilities available.",
            "images": [],
            "fuel_price_diesel": None,
            "fuel_price_unleaded": None,
            "status": "active",
            "rating": 3.8,
            "total_reviews": 45,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "spot-004",
            "name": "Chicago Premium Parking",
            "address": "3456 Truck Route 94",
            "city": "Chicago",
            "state": "IL",
            "latitude": 41.8781,
            "longitude": -87.6298,
            "total_spaces": 40,
            "available_spaces": 15,
            "price_per_night": 35.00,
            "amenities": ["shower", "restroom", "food", "fuel", "security", "wifi"],
            "is_free": False,
            "security_level": "high",
            "partner_id": "partner-001",
            "description": "Premium facility with heated showers, 24/7 security, and on-site diner.",
            "images": [],
            "fuel_price_diesel": 4.09,
            "fuel_price_unleaded": 3.59,
            "status": "active",
            "rating": 4.8,
            "total_reviews": 234,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "spot-005",
            "name": "Miami Coastal Stop",
            "address": "7890 Ocean Drive",
            "city": "Miami",
            "state": "FL",
            "latitude": 25.7617,
            "longitude": -80.1918,
            "total_spaces": 25,
            "available_spaces": 0,
            "price_per_night": 30.00,
            "amenities": ["shower", "restroom", "food", "security"],
            "is_free": False,
            "security_level": "high",
            "partner_id": "partner-001",
            "description": "Coastal parking with ocean views. Close to port facilities.",
            "images": [],
            "fuel_price_diesel": 3.99,
            "fuel_price_unleaded": 3.49,
            "status": "active",
            "rating": 4.3,
            "total_reviews": 156,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.parking_spots.insert_many(parking_spots)
    print(f"✓ Created {len(parking_spots)} parking spots across different cities")
    
    # Create sample loads for load board
    loads = [
        {
            "id": "load-001",
            "origin_city": "Dallas",
            "origin_state": "TX",
            "destination_city": "Atlanta",
            "destination_state": "GA",
            "pickup_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "delivery_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "weight": 42000,
            "distance": 780,
            "rate": 1950.00,
            "equipment_type": "dry_van",
            "contact_name": "ABC Logistics",
            "contact_phone": "555-1001",
            "status": "available",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "load-002",
            "origin_city": "Chicago",
            "origin_state": "IL",
            "destination_city": "Phoenix",
            "destination_state": "AZ",
            "pickup_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "delivery_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
            "weight": 38000,
            "distance": 1750,
            "rate": 3500.00,
            "equipment_type": "reefer",
            "contact_name": "Cold Chain Express",
            "contact_phone": "555-2002",
            "status": "available",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "load-003",
            "origin_city": "Miami",
            "origin_state": "FL",
            "destination_city": "Dallas",
            "destination_state": "TX",
            "pickup_date": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
            "delivery_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "weight": 45000,
            "distance": 1300,
            "rate": 2600.00,
            "equipment_type": "flatbed",
            "contact_name": "Heavy Haul Inc",
            "contact_phone": "555-3003",
            "status": "available",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.loads.insert_many(loads)
    print(f"✓ Created {len(loads)} available loads on load board")
    
    print("\n🎉 Database seeded successfully!")
    print("\n📝 Test accounts created:")
    print("   Driver: driver@test.com / password123")
    print("   Partner: partner@test.com / password123")
    print("   Admin: admin@test.com / password123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
