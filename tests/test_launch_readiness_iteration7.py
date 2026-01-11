"""
TrukAll Launch Readiness Test Suite - Iteration 7
Tests all critical features for production readiness:
- Authentication
- HOS Tracker (new)
- Truck Weight Manager
- Gamification/Achievements
- Rewards Store
- Community Board
- Referral System
- Maintenance Tracker
- Mentor System
- Route Planner
- Analytics Dashboard
- Feedback Form
- Load Board
- Emergency SOS
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://roadmates-1.preview.emergentagent.com').rstrip('/')

# Test credentials
DRIVER_EMAIL = "driver@test.com"
DRIVER_PASSWORD = "password123"
PARTNER_EMAIL = "partner@test.com"
ADMIN_EMAIL = "admin@test.com"


class TestHealthAndAuth:
    """Health check and authentication tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ API Health check passed")
    
    def test_driver_login(self):
        """Test driver login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == DRIVER_EMAIL
        assert data["user"]["role"] == "driver"
        print(f"✅ Driver login successful: {data['user']['name']}")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid login correctly rejected")


class TestHOSTracker:
    """Hours of Service Tracker tests - NEW FEATURE"""
    
    def test_hos_rules(self):
        """Test HOS rules endpoint"""
        response = requests.get(f"{BASE_URL}/api/hos/rules")
        assert response.status_code == 200
        data = response.json()
        assert "rules" in data
        assert "statuses" in data
        assert "tips" in data
        print(f"✅ HOS Rules: {data['rules']}")
    
    def test_hos_summary(self):
        """Test HOS summary for driver"""
        response = requests.get(f"{BASE_URL}/api/hos/summary/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "current_status" in data
        assert "is_compliant" in data
        assert "today" in data
        assert "weekly" in data
        assert "break" in data
        print(f"✅ HOS Summary: Status={data['current_status']}, Compliant={data['is_compliant']}")
    
    def test_hos_log_status_change(self):
        """Test logging a status change"""
        response = requests.post(
            f"{BASE_URL}/api/hos/log?user_email={DRIVER_EMAIL}",
            json={
                "status": "off_duty",
                "location": "Test Location",
                "notes": "Test status change"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "summary" in data
        print(f"✅ HOS Log: {data['message']}")
    
    def test_hos_logs_retrieval(self):
        """Test retrieving HOS logs"""
        response = requests.get(f"{BASE_URL}/api/hos/logs/{DRIVER_EMAIL}?days=1")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ HOS Logs retrieved: {len(data)} entries")
    
    def test_hos_restart_calculator(self):
        """Test 34-hour restart calculator"""
        response = requests.get(f"{BASE_URL}/api/hos/restart-calculator/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "can_restart" in data
        assert "message" in data
        print(f"✅ HOS Restart: can_restart={data['can_restart']}, {data['message']}")


class TestTruckWeight:
    """Truck Weight Manager tests"""
    
    def test_weight_limits(self):
        """Test federal weight limits endpoint"""
        response = requests.get(f"{BASE_URL}/api/truck-weight/limits")
        assert response.status_code == 200
        data = response.json()
        assert "federal" in data
        assert "tips" in data
        print(f"✅ Weight Limits: Max gross={data['federal']['gross_weight']} lbs")
    
    def test_weight_profiles(self):
        """Test getting user's truck profiles"""
        response = requests.get(f"{BASE_URL}/api/truck-weight/profiles/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Truck Profiles: {len(data)} profiles found")
    
    def test_create_truck_profile(self):
        """Test creating a truck profile"""
        response = requests.post(
            f"{BASE_URL}/api/truck-weight/profiles?user_email={DRIVER_EMAIL}",
            json={
                "truck_name": "TEST_Freightliner",
                "truck_type": "semi",
                "empty_weight": 35000,
                "gvwr": 80000,
                "gcwr": 80000,
                "steer_axle_weight": 10000,
                "drive_axle_weight": 12000,
                "trailer_axle_weight": 13000,
                "drive_axle_type": "tandem",
                "trailer_axle_type": "tandem",
                "fuel_capacity_gallons": 300,
                "def_capacity_gallons": 20
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "max_cargo_weight" in data
        print(f"✅ Truck Profile created: Max cargo={data['max_cargo_weight']} lbs")
        return data.get("profile_id")


class TestGamification:
    """Gamification/Achievements tests"""
    
    def test_badges_list(self):
        """Test getting all available badges"""
        response = requests.get(f"{BASE_URL}/api/gamification/badges")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Badges: {len(data)} badges available")
    
    def test_user_gamification(self):
        """Test getting user's gamification data"""
        response = requests.get(f"{BASE_URL}/api/gamification/user/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "level" in data
        assert "total_points" in data
        assert "badges" in data
        assert "streak" in data
        print(f"✅ User Gamification: Level={data['level']}, Points={data['total_points']}")
    
    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/gamification/leaderboard?category=points")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Leaderboard: {len(data)} entries")
    
    def test_challenges(self):
        """Test challenges endpoint"""
        response = requests.get(f"{BASE_URL}/api/gamification/challenges")
        assert response.status_code == 200
        data = response.json()
        assert "daily" in data
        assert "weekly" in data
        print(f"✅ Challenges: {len(data['daily'])} daily, {len(data['weekly'])} weekly")


class TestRewardsStore:
    """Rewards Store tests"""
    
    def test_rewards_catalog(self):
        """Test getting rewards catalog"""
        response = requests.get(f"{BASE_URL}/api/rewards/catalog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Rewards Catalog: {len(data)} rewards available")
    
    def test_user_rewards(self):
        """Test getting user's rewards"""
        response = requests.get(f"{BASE_URL}/api/rewards/user/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "available_points" in data
        assert "redemptions" in data
        print(f"✅ User Rewards: {data['available_points']} points available")


class TestCommunityBoard:
    """Community Board tests"""
    
    def test_community_categories(self):
        """Test getting community categories"""
        response = requests.get(f"{BASE_URL}/api/community/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Community Categories: {len(data)} categories")
    
    def test_community_posts(self):
        """Test getting community posts"""
        response = requests.get(f"{BASE_URL}/api/community/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Community Posts: {len(data)} posts")


class TestReferralSystem:
    """Referral System tests"""
    
    def test_referral_code(self):
        """Test getting user's referral code"""
        response = requests.get(f"{BASE_URL}/api/referral/code/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data
        print(f"✅ Referral Code: {data['referral_code']}")
    
    def test_referral_stats(self):
        """Test getting referral stats"""
        response = requests.get(f"{BASE_URL}/api/referral/stats/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "total_referrals" in data
        assert "total_earned" in data
        print(f"✅ Referral Stats: {data['total_referrals']} referrals, {data['total_earned']} points earned")


class TestMaintenanceTracker:
    """Maintenance Tracker tests"""
    
    def test_maintenance_defaults(self):
        """Test getting maintenance defaults"""
        response = requests.get(f"{BASE_URL}/api/maintenance/defaults")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)  # Returns dict with maintenance types as keys
        assert len(data) > 0
        print(f"✅ Maintenance Defaults: {len(data)} types")
    
    def test_user_maintenance(self):
        """Test getting user's maintenance items"""
        response = requests.get(f"{BASE_URL}/api/maintenance/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ User Maintenance: {len(data)} items")


class TestMentorSystem:
    """Mentor System tests"""
    
    def test_mentors_list(self):
        """Test getting available mentors"""
        response = requests.get(f"{BASE_URL}/api/mentors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Mentors: {len(data)} available")
    
    def test_mentor_requests(self):
        """Test getting mentor requests"""
        response = requests.get(f"{BASE_URL}/api/mentors/requests/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Mentor Requests: {len(data)} requests")


class TestRoutePlanner:
    """Route Planner tests"""
    
    def test_plan_route(self):
        """Test planning a route"""
        response = requests.post(
            f"{BASE_URL}/api/routes/plan?driver_email={DRIVER_EMAIL}",
            json={
                "origin_address": "Dallas, TX",
                "origin_lat": 32.7767,
                "origin_lng": -96.7970,
                "destination_address": "Houston, TX",
                "destination_lat": 29.7604,
                "destination_lng": -95.3698,
                "truck_type": "semi",
                "truck_height_ft": 13.6,
                "truck_weight_lbs": 80000,
                "hazmat": False,
                "avoid_tolls": False,
                "include_parking_stops": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_distance_miles" in data
        assert "estimated_drive_time_hours" in data
        print(f"✅ Route Planned: {data['total_distance_miles']} miles, {data['estimated_drive_time_hours']:.1f} hours")


class TestAnalyticsDashboard:
    """Analytics Dashboard tests"""
    
    def test_driver_analytics(self):
        """Test getting driver analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/{DRIVER_EMAIL}?period=month")
        assert response.status_code == 200
        data = response.json()
        assert "total_earnings" in data
        assert "total_miles" in data
        assert "total_expenses" in data
        print(f"✅ Analytics: Earnings=${data['total_earnings']}, Miles={data['total_miles']}")


class TestFeedbackForm:
    """Feedback Form tests"""
    
    def test_submit_feedback(self):
        """Test submitting feedback"""
        response = requests.post(
            f"{BASE_URL}/api/feedback?user_email={DRIVER_EMAIL}",
            json={
                "category": "feature_request",
                "subject": "TEST_Feedback",
                "message": "This is a test feedback submission",
                "rating": 5
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ Feedback submitted: {data['message']}")


class TestLoadBoard:
    """Load Board tests"""
    
    def test_get_loads(self):
        """Test getting available loads"""
        response = requests.get(f"{BASE_URL}/api/loads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Load Board: {len(data)} loads available")


class TestEmergencySOS:
    """Emergency SOS tests"""
    
    def test_emergency_contacts(self):
        """Test getting emergency contacts"""
        response = requests.get(f"{BASE_URL}/api/emergency/contacts/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Emergency Contacts: {len(data)} contacts")
    
    def test_add_emergency_contact(self):
        """Test adding emergency contact"""
        response = requests.post(
            f"{BASE_URL}/api/emergency/contacts",
            params={
                "driver_email": DRIVER_EMAIL,
                "name": "TEST_Emergency Contact",
                "phone": "555-123-4567",
                "relationship": "family"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ Emergency Contact added: {data['message']}")


class TestParkingSpots:
    """Parking Spots tests"""
    
    def test_get_spots(self):
        """Test getting parking spots"""
        response = requests.get(f"{BASE_URL}/api/spots")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Parking Spots: {len(data)} spots available")
    
    def test_live_updates(self):
        """Test live parking updates"""
        response = requests.get(f"{BASE_URL}/api/spots/live-updates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Live Updates: {len(data)} spots with live data")


class TestWeatherAlerts:
    """Weather Alerts tests"""
    
    def test_get_weather_alerts(self):
        """Test getting weather alerts"""
        response = requests.get(f"{BASE_URL}/api/weather/alerts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Weather Alerts: {len(data)} active alerts")


class TestMessaging:
    """In-App Messaging tests"""
    
    def test_get_conversations(self):
        """Test getting conversations"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Conversations: {len(data)} conversations")


class TestNotifications:
    """Notifications tests"""
    
    def test_get_notifications(self):
        """Test getting notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications/{DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Notifications: {len(data)} notifications")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
