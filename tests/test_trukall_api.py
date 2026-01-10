"""
TrukAll API Tests - Comprehensive backend testing
Tests: Authentication, Emergency SOS, Compliance, Parking, Subscriptions, 
       Live Updates, Fuel Prices, Load Board, Shower Credits, Broker Ratings, Retail Parking
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_DRIVER = {"email": "driver@test.com", "password": "password123"}
TEST_PARTNER = {"email": "partner@test.com", "password": "password123"}
TEST_ADMIN = {"email": "admin@test.com", "password": "password123"}


class TestAuthentication:
    """Test authentication flows for all user roles"""
    
    def test_driver_login(self):
        """Test driver login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_DRIVER)
        print(f"Driver login response: {response.status_code}")
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_DRIVER["email"]
        assert data["user"]["role"] == "driver"
        print(f"✓ Driver login successful: {data['user']['name']}")
    
    def test_partner_login(self):
        """Test partner login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_PARTNER)
        print(f"Partner login response: {response.status_code}")
        assert response.status_code == 200, f"Partner login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_PARTNER["email"]
        assert data["user"]["role"] == "partner"
        print(f"✓ Partner login successful: {data['user']['name']}")
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        print(f"Admin login response: {response.status_code}")
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_ADMIN["email"]
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        print(f"Invalid login response: {response.status_code}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid login correctly rejected")


class TestEmergencySOS:
    """Test Emergency SOS API"""
    
    def test_send_emergency_sos(self):
        """Test POST /api/emergency/sos with query params"""
        params = {
            "driver_email": TEST_DRIVER["email"],
            "emergency_type": "breakdown",
            "location_address": "Highway 45, Dallas TX"
        }
        response = requests.post(f"{BASE_URL}/api/emergency/sos", params=params)
        print(f"Emergency SOS response: {response.status_code}")
        print(f"Response body: {response.text}")
        assert response.status_code == 200, f"Emergency SOS failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "sos_id" in data
        assert "emergency_numbers" in data
        print(f"✓ Emergency SOS sent successfully: {data['sos_id']}")
    
    def test_get_active_emergencies(self):
        """Test GET /api/emergency/sos/active"""
        response = requests.get(f"{BASE_URL}/api/emergency/sos/active")
        print(f"Active emergencies response: {response.status_code}")
        assert response.status_code == 200, f"Get active emergencies failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} active emergencies")
    
    def test_get_driver_sos_history(self):
        """Test GET /api/emergency/sos/{driver_email}"""
        response = requests.get(f"{BASE_URL}/api/emergency/sos/{TEST_DRIVER['email']}")
        print(f"SOS history response: {response.status_code}")
        assert response.status_code == 200, f"Get SOS history failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} SOS records for driver")


class TestCompliance:
    """Test DOT Compliance API"""
    
    def test_get_compliance_status(self):
        """Test GET /api/compliance/{driver_email}"""
        response = requests.get(f"{BASE_URL}/api/compliance/{TEST_DRIVER['email']}")
        print(f"Compliance response: {response.status_code}")
        print(f"Response body: {response.text}")
        assert response.status_code == 200, f"Get compliance failed: {response.text}"
        data = response.json()
        # May return "No compliance data found" message or actual compliance data
        if "message" in data:
            print(f"✓ Compliance check returned: {data['message']}")
        else:
            assert "driver_email" in data or "cdl_expiry" in data
            print(f"✓ Got compliance data for driver")


class TestParkingSpots:
    """Test Parking Spots API"""
    
    def test_get_parking_spots(self):
        """Test GET /api/spots"""
        response = requests.get(f"{BASE_URL}/api/spots")
        print(f"Parking spots response: {response.status_code}")
        assert response.status_code == 200, f"Get parking spots failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} parking spots")
        if len(data) > 0:
            spot = data[0]
            assert "id" in spot
            assert "name" in spot
            assert "city" in spot
            assert "state" in spot
            print(f"✓ First spot: {spot['name']} in {spot['city']}, {spot['state']}")
    
    def test_get_parking_spots_by_city(self):
        """Test GET /api/spots with city filter"""
        response = requests.get(f"{BASE_URL}/api/spots", params={"city": "Dallas"})
        print(f"Parking spots by city response: {response.status_code}")
        assert response.status_code == 200, f"Get parking spots by city failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} parking spots in Dallas area")


class TestSubscriptionPlans:
    """Test Subscription Plans API"""
    
    def test_get_subscription_plans(self):
        """Test GET /api/subscriptions/plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        print(f"Subscription plans response: {response.status_code}")
        assert response.status_code == 200, f"Get subscription plans failed: {response.text}"
        data = response.json()
        assert "plans" in data
        assert isinstance(data["plans"], list)
        print(f"✓ Got {len(data['plans'])} subscription plans")
        for plan in data["plans"]:
            print(f"  - {plan['name']}: ${plan['price']}/month")
    
    def test_get_user_subscription(self):
        """Test GET /api/subscriptions/user/{user_email}"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/user/{TEST_DRIVER['email']}")
        print(f"User subscription response: {response.status_code}")
        assert response.status_code == 200, f"Get user subscription failed: {response.text}"
        data = response.json()
        assert "subscription" in data or "current_plan" in data
        print(f"✓ Got user subscription status")


class TestLiveParkingUpdates:
    """Test Live Parking Updates API"""
    
    def test_get_live_updates(self):
        """Test GET /api/spots/live-updates"""
        response = requests.get(f"{BASE_URL}/api/spots/live-updates")
        print(f"Live updates response: {response.status_code}")
        assert response.status_code == 200, f"Get live updates failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} spots with live update info")
        # Check for live report fields
        live_count = sum(1 for spot in data if spot.get('has_live_report'))
        print(f"✓ {live_count} spots have live reports")


class TestFuelPrices:
    """Test Fuel Prices API"""
    
    def test_get_fuel_prices(self):
        """Test GET /api/fuel/prices"""
        response = requests.get(f"{BASE_URL}/api/fuel/prices")
        print(f"Fuel prices response: {response.status_code}")
        assert response.status_code == 200, f"Get fuel prices failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} fuel price reports")
    
    def test_get_cheapest_fuel(self):
        """Test GET /api/fuel/prices/cheapest"""
        response = requests.get(f"{BASE_URL}/api/fuel/prices/cheapest", params={"limit": 10})
        print(f"Cheapest fuel response: {response.status_code}")
        assert response.status_code == 200, f"Get cheapest fuel failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} cheapest fuel locations")
    
    def test_get_fuel_averages(self):
        """Test GET /api/fuel/average"""
        response = requests.get(f"{BASE_URL}/api/fuel/average")
        print(f"Fuel averages response: {response.status_code}")
        assert response.status_code == 200, f"Get fuel averages failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got fuel averages for {len(data)} states")


class TestLoadBoard:
    """Test Load Board API"""
    
    def test_get_loads(self):
        """Test GET /api/loads"""
        response = requests.get(f"{BASE_URL}/api/loads")
        print(f"Loads response: {response.status_code}")
        assert response.status_code == 200, f"Get loads failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} available loads")
        if len(data) > 0:
            load = data[0]
            assert "origin_city" in load
            assert "destination_city" in load
            assert "rate" in load
            print(f"✓ First load: {load['origin_city']} to {load['destination_city']} - ${load['rate']}")


class TestShowerCredits:
    """Test Shower Credits API"""
    
    def test_get_shower_credits(self):
        """Test GET /api/shower-credits/{driver_email}"""
        response = requests.get(f"{BASE_URL}/api/shower-credits/{TEST_DRIVER['email']}")
        print(f"Shower credits response: {response.status_code}")
        assert response.status_code == 200, f"Get shower credits failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} shower credit records")
    
    def test_get_shower_totals(self):
        """Test GET /api/shower-credits/{driver_email}/total"""
        response = requests.get(f"{BASE_URL}/api/shower-credits/{TEST_DRIVER['email']}/total")
        print(f"Shower totals response: {response.status_code}")
        assert response.status_code == 200, f"Get shower totals failed: {response.text}"
        data = response.json()
        assert "total_available_showers" in data
        assert "total_points" in data
        print(f"✓ Total showers: {data['total_available_showers']}, Points: {data['total_points']}")


class TestBrokerRatings:
    """Test Broker Ratings API"""
    
    def test_get_fraud_alerts(self):
        """Test GET /api/brokers/fraud-alerts"""
        response = requests.get(f"{BASE_URL}/api/brokers/fraud-alerts")
        print(f"Fraud alerts response: {response.status_code}")
        assert response.status_code == 200, f"Get fraud alerts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} fraud alerts")


class TestRetailParking:
    """Test Retail Parking API"""
    
    def test_get_retail_parking(self):
        """Test GET /api/retail-parking"""
        response = requests.get(f"{BASE_URL}/api/retail-parking")
        print(f"Retail parking response: {response.status_code}")
        assert response.status_code == 200, f"Get retail parking failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} retail parking locations")
        if len(data) > 0:
            location = data[0]
            assert "name" in location
            assert "chain" in location
            print(f"✓ First location: {location['name']} ({location['chain']})")
    
    def test_get_retail_chains(self):
        """Test GET /api/retail-parking/chains"""
        response = requests.get(f"{BASE_URL}/api/retail-parking/chains")
        print(f"Retail chains response: {response.status_code}")
        assert response.status_code == 200, f"Get retail chains failed: {response.text}"
        data = response.json()
        assert "chains" in data
        print(f"✓ Got {len(data['chains'])} retail chains")


class TestDashboardNavigation:
    """Test dashboard-related endpoints"""
    
    def test_get_driver_bookings(self):
        """Test GET /api/bookings/driver/{driver_email}"""
        response = requests.get(f"{BASE_URL}/api/bookings/driver/{TEST_DRIVER['email']}")
        print(f"Driver bookings response: {response.status_code}")
        assert response.status_code == 200, f"Get driver bookings failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} bookings for driver")
    
    def test_get_driver_expenses(self):
        """Test GET /api/expenses/{driver_email}"""
        response = requests.get(f"{BASE_URL}/api/expenses/{TEST_DRIVER['email']}")
        print(f"Driver expenses response: {response.status_code}")
        assert response.status_code == 200, f"Get driver expenses failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} expenses for driver")
    
    def test_get_convoy_posts(self):
        """Test GET /api/convoy/posts"""
        response = requests.get(f"{BASE_URL}/api/convoy/posts")
        print(f"Convoy posts response: {response.status_code}")
        assert response.status_code == 200, f"Get convoy posts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} convoy posts")
    
    def test_get_hos_status(self):
        """Test GET /api/hos/{driver_email}"""
        response = requests.get(f"{BASE_URL}/api/hos/{TEST_DRIVER['email']}")
        print(f"HOS status response: {response.status_code}")
        assert response.status_code == 200, f"Get HOS status failed: {response.text}"
        data = response.json()
        assert "hours_remaining" in data
        assert "status" in data
        print(f"✓ HOS status: {data['status']}, Hours remaining: {data['hours_remaining']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
