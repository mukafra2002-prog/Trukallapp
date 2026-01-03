#!/usr/bin/env python3
"""
Seed script to populate the database with sample data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
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
    
    # Create sample broker ratings
    await db.broker_ratings.delete_many({})
    broker_ratings = [
        {
            "id": "br-001",
            "broker_name": "ABC Logistics",
            "mc_number": "MC-123456",
            "driver_email": "driver@test.com",
            "driver_name": "John Driver",
            "rating": 5,
            "payment_rating": 5,
            "communication_rating": 5,
            "load_accuracy_rating": 5,
            "would_work_again": True,
            "payment_days": 15,
            "fraud_reported": False,
            "fraud_type": None,
            "comment": "Great broker! Always pays on time and load details are accurate.",
            "verified_load": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "br-002",
            "broker_name": "Quick Freight Services",
            "mc_number": "MC-789012",
            "driver_email": "driver@test.com",
            "driver_name": "John Driver",
            "rating": 2,
            "payment_rating": 1,
            "communication_rating": 3,
            "load_accuracy_rating": 2,
            "would_work_again": False,
            "payment_days": 45,
            "fraud_reported": True,
            "fraud_type": "double_broker",
            "comment": "Double brokered my load! Took 45 days to get paid. AVOID!",
            "verified_load": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "br-003",
            "broker_name": "Reliable Transport Brokers",
            "mc_number": "MC-345678",
            "driver_email": "driver@test.com",
            "driver_name": "John Driver",
            "rating": 4,
            "payment_rating": 4,
            "communication_rating": 5,
            "load_accuracy_rating": 4,
            "would_work_again": True,
            "payment_days": 21,
            "fraud_reported": False,
            "fraud_type": None,
            "comment": "Good broker overall. Communication is excellent.",
            "verified_load": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.broker_ratings.insert_many(broker_ratings)
    print(f"✓ Created {len(broker_ratings)} broker ratings")
    
    # Create sample shower credits
    await db.shower_credits.delete_many({})
    shower_credits = [
        {
            "id": "sc-001",
            "driver_email": "driver@test.com",
            "chain": "pilot_flying_j",
            "rewards_number": "PFJ-12345678",
            "available_showers": 3,
            "points_balance": 2500,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "sc-002",
            "driver_email": "driver@test.com",
            "chain": "loves",
            "rewards_number": "LOVES-87654321",
            "available_showers": 2,
            "points_balance": 1800,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "sc-003",
            "driver_email": "driver@test.com",
            "chain": "ta_petro",
            "rewards_number": "TAPETRO-55555",
            "available_showers": 1,
            "points_balance": 950,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.shower_credits.insert_many(shower_credits)
    print(f"✓ Created {len(shower_credits)} shower credit records")
    
    # Create sample retail parking locations
    await db.retail_parking.delete_many({})
    retail_parking = [
        {
            "id": "rp-001",
            "name": "Walmart Supercenter - Dallas",
            "chain": "walmart",
            "address": "4545 S Lamar St",
            "city": "Dallas",
            "state": "TX",
            "latitude": 32.7357,
            "longitude": -96.8271,
            "allows_overnight": True,
            "truck_parking_spaces": 15,
            "restrictions": ["no_idling", "max_12_hours"],
            "amenities": ["restroom", "food", "wifi"],
            "last_verified": datetime.now(timezone.utc).isoformat(),
            "community_verified": True,
            "total_reviews": 45,
            "average_rating": 4.2,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "rp-002",
            "name": "Cracker Barrel - Atlanta",
            "chain": "cracker_barrel",
            "address": "2801 Cobb Pkwy SE",
            "city": "Atlanta",
            "state": "GA",
            "latitude": 33.8923,
            "longitude": -84.4678,
            "allows_overnight": True,
            "truck_parking_spaces": 8,
            "restrictions": ["must_shop", "max_10_hours"],
            "amenities": ["restroom", "food"],
            "last_verified": datetime.now(timezone.utc).isoformat(),
            "community_verified": True,
            "total_reviews": 32,
            "average_rating": 4.5,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "rp-003",
            "name": "Cabela's - Phoenix",
            "chain": "cabelas",
            "address": "9380 W Glendale Ave",
            "city": "Phoenix",
            "state": "AZ",
            "latitude": 33.5326,
            "longitude": -112.2274,
            "allows_overnight": True,
            "truck_parking_spaces": 20,
            "restrictions": [],
            "amenities": ["restroom", "security_patrol"],
            "last_verified": datetime.now(timezone.utc).isoformat(),
            "community_verified": True,
            "total_reviews": 28,
            "average_rating": 4.7,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "rp-004",
            "name": "Lowe's Home Improvement - Chicago",
            "chain": "lowes",
            "address": "1111 N Larrabee St",
            "city": "Chicago",
            "state": "IL",
            "latitude": 41.9030,
            "longitude": -87.6432,
            "allows_overnight": True,
            "truck_parking_spaces": 10,
            "restrictions": ["no_idling", "security_patrol"],
            "amenities": ["restroom"],
            "last_verified": datetime.now(timezone.utc).isoformat(),
            "community_verified": False,
            "total_reviews": 15,
            "average_rating": 3.8,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "rp-005",
            "name": "Rest Area - I-10 Mile Marker 234",
            "chain": "rest_area",
            "address": "I-10 Mile Marker 234",
            "city": "Houston",
            "state": "TX",
            "latitude": 29.7604,
            "longitude": -95.3698,
            "allows_overnight": True,
            "truck_parking_spaces": 50,
            "restrictions": ["max_8_hours"],
            "amenities": ["restroom", "picnic_area"],
            "last_verified": datetime.now(timezone.utc).isoformat(),
            "community_verified": True,
            "total_reviews": 89,
            "average_rating": 3.5,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.retail_parking.insert_many(retail_parking)
    print(f"✓ Created {len(retail_parking)} retail parking locations")
    
    # Create sample fuel prices
    await db.fuel_prices.delete_many({})
    fuel_prices = [
        {
            "id": "fuel-001",
            "station_name": "Pilot Flying J - Dallas",
            "chain": "pilot",
            "city": "Dallas",
            "state": "TX",
            "latitude": 32.7767,
            "longitude": -96.7970,
            "diesel_price": 3.459,
            "unleaded_price": 2.899,
            "def_price": 2.799,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "reported_by": "driver@test.com"
        },
        {
            "id": "fuel-002",
            "station_name": "Love's Travel Stop - Atlanta",
            "chain": "loves",
            "city": "Atlanta",
            "state": "GA",
            "latitude": 33.7490,
            "longitude": -84.3880,
            "diesel_price": 3.529,
            "unleaded_price": 2.959,
            "def_price": 2.849,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "reported_by": "driver@test.com"
        },
        {
            "id": "fuel-003",
            "station_name": "TA Petro - Phoenix",
            "chain": "ta_petro",
            "city": "Phoenix",
            "state": "AZ",
            "latitude": 33.4484,
            "longitude": -112.0740,
            "diesel_price": 3.389,
            "unleaded_price": 2.849,
            "def_price": 2.699,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "reported_by": "driver@test.com"
        },
        {
            "id": "fuel-004",
            "station_name": "Pilot Flying J - Chicago",
            "chain": "pilot",
            "city": "Chicago",
            "state": "IL",
            "latitude": 41.8781,
            "longitude": -87.6298,
            "diesel_price": 3.659,
            "unleaded_price": 3.099,
            "def_price": 2.899,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "reported_by": "driver@test.com"
        },
        {
            "id": "fuel-005",
            "station_name": "Love's - Houston",
            "chain": "loves",
            "city": "Houston",
            "state": "TX",
            "latitude": 29.7604,
            "longitude": -95.3698,
            "diesel_price": 3.419,
            "unleaded_price": 2.879,
            "def_price": 2.749,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "reported_by": "driver@test.com"
        }
    ]
    await db.fuel_prices.insert_many(fuel_prices)
    print(f"✓ Created {len(fuel_prices)} fuel price records")
    
    # Create sample emergency contacts
    await db.emergency_contacts.delete_many({})
    emergency_contacts = [
        {
            "id": "ec-001",
            "driver_email": "driver@test.com",
            "name": "Jane Driver",
            "phone": "+1-555-123-4567",
            "relationship": "spouse",
            "is_primary": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "ec-002",
            "driver_email": "driver@test.com",
            "name": "ABC Trucking Dispatch",
            "phone": "+1-800-555-0199",
            "relationship": "employer",
            "is_primary": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.emergency_contacts.insert_many(emergency_contacts)
    print(f"✓ Created {len(emergency_contacts)} emergency contacts")
    
    print("\n🎉 Database seeded successfully!")
    print("\n📝 Test accounts created:")
    print("   Driver: driver@test.com / password123")
    print("   Partner: partner@test.com / password123")
    print("   Admin: admin@test.com / password123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
