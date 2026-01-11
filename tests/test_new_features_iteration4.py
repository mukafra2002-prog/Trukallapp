"""
Test suite for TrukAll new features - Iteration 4
Testing: Analytics Dashboard, Route Planner, Voice Commands, Photo Reviews, In-App Messaging
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DRIVER_EMAIL = "driver@test.com"
DRIVER_PASSWORD = "password123"

class TestAnalyticsDashboard:
    """Test Analytics Dashboard API"""
    
    def test_get_analytics_week(self):
        """Test GET /api/analytics/{email}?period=week"""
        response = requests.get(f"{BASE_URL}/api/analytics/{DRIVER_EMAIL}?period=week")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_earnings" in data
        assert "total_miles" in data
        assert "total_loads" in data
        assert "net_profit" in data
        assert "earnings_by_day" in data
        print(f"✓ Analytics week: earnings=${data['total_earnings']}, miles={data['total_miles']}")
    
    def test_get_analytics_month(self):
        """Test GET /api/analytics/{email}?period=month"""
        response = requests.get(f"{BASE_URL}/api/analytics/{DRIVER_EMAIL}?period=month")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_earnings" in data
        assert "fuel_expenses" in data
        assert "parking_expenses" in data
        print(f"✓ Analytics month: net_profit=${data['net_profit']}")
    
    def test_get_analytics_year(self):
        """Test GET /api/analytics/{email}?period=year"""
        response = requests.get(f"{BASE_URL}/api/analytics/{DRIVER_EMAIL}?period=year")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "avg_rate_per_mile" in data
        print(f"✓ Analytics year: avg_rate_per_mile=${data['avg_rate_per_mile']}")


class TestRoutePlanner:
    """Test Route Planner API"""
    
    def test_plan_route(self):
        """Test POST /api/routes/plan"""
        route_data = {
            "origin_address": "Dallas, TX",
            "origin_lat": 32.7767,
            "origin_lng": -96.7970,
            "destination_address": "Atlanta, GA",
            "destination_lat": 33.7490,
            "destination_lng": -84.3880,
            "truck_type": "semi",
            "truck_height_ft": 13.6,
            "truck_weight_lbs": 80000,
            "hazmat": False,
            "avoid_tolls": False,
            "include_parking_stops": True
        }
        response = requests.post(
            f"{BASE_URL}/api/routes/plan?driver_email={DRIVER_EMAIL}",
            json=route_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_distance_miles" in data
        assert "estimated_drive_time_hours" in data
        print(f"✓ Route planned: {data['total_distance_miles']} miles, {data['estimated_drive_time_hours']} hours")
    
    def test_plan_route_with_hazmat(self):
        """Test POST /api/routes/plan with hazmat flag"""
        route_data = {
            "origin_address": "Los Angeles, CA",
            "origin_lat": 34.0522,
            "origin_lng": -118.2437,
            "destination_address": "Phoenix, AZ",
            "destination_lat": 33.4484,
            "destination_lng": -112.0740,
            "truck_type": "semi",
            "truck_height_ft": 13.6,
            "truck_weight_lbs": 80000,
            "hazmat": True,
            "avoid_tolls": True,
            "include_parking_stops": True
        }
        response = requests.post(
            f"{BASE_URL}/api/routes/plan?driver_email={DRIVER_EMAIL}",
            json=route_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "warnings" in data
        print(f"✓ Hazmat route planned with {len(data.get('warnings', []))} warnings")
    
    def test_get_route_history(self):
        """Test GET /api/routes/history/{email}"""
        response = requests.get(f"{BASE_URL}/api/routes/history/{DRIVER_EMAIL}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Route history: {len(data)} routes found")


class TestVoiceCommands:
    """Test Voice Commands API"""
    
    def test_voice_search_parking(self):
        """Test POST /api/voice/search with parking query"""
        response = requests.post(
            f"{BASE_URL}/api/voice/search?query=find%20parking%20near%20Atlanta&driver_email={DRIVER_EMAIL}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "intent" in data
        assert data["intent"] == "find_parking"
        print(f"✓ Voice search parking: intent={data['intent']}, results={len(data.get('results', []))}")
    
    def test_voice_search_fuel(self):
        """Test POST /api/voice/search with fuel query"""
        response = requests.post(
            f"{BASE_URL}/api/voice/search?query=cheapest%20diesel%20fuel&driver_email={DRIVER_EMAIL}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "intent" in data
        assert data["intent"] == "find_fuel"
        print(f"✓ Voice search fuel: intent={data['intent']}")
    
    def test_voice_search_loads(self):
        """Test POST /api/voice/search with loads query"""
        response = requests.post(
            f"{BASE_URL}/api/voice/search?query=find%20available%20loads&driver_email={DRIVER_EMAIL}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "intent" in data
        assert data["intent"] == "find_loads"
        print(f"✓ Voice search loads: intent={data['intent']}")
    
    def test_voice_search_weather(self):
        """Test POST /api/voice/search with weather query"""
        response = requests.post(
            f"{BASE_URL}/api/voice/search?query=check%20weather%20alerts&driver_email={DRIVER_EMAIL}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "intent" in data
        assert data["intent"] == "check_weather"
        print(f"✓ Voice search weather: intent={data['intent']}")


class TestPhotoReviews:
    """Test Photo Reviews API"""
    
    def test_create_photo_review(self):
        """Test POST /api/reviews/photo"""
        # First get a spot ID
        spots_response = requests.get(f"{BASE_URL}/api/spots")
        spots = spots_response.json()
        if not spots:
            pytest.skip("No parking spots available for testing")
        
        spot_id = spots[0]["id"]
        
        review_data = {
            "spot_id": spot_id,
            "rating": 4,
            "comment": "Great parking spot with good amenities. Clean restrooms.",
            "photos": [],  # Empty for test, would be base64 in real use
            "cleanliness": 4,
            "safety": 5,
            "amenities": 3
        }
        response = requests.post(
            f"{BASE_URL}/api/reviews/photo?driver_email={DRIVER_EMAIL}",
            json=review_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "review_id" in data
        print(f"✓ Photo review created: {data['message']}")
    
    def test_get_photo_reviews(self):
        """Test GET /api/reviews/photo/{spot_id}"""
        # First get a spot ID
        spots_response = requests.get(f"{BASE_URL}/api/spots")
        spots = spots_response.json()
        if not spots:
            pytest.skip("No parking spots available for testing")
        
        spot_id = spots[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/reviews/photo/{spot_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Photo reviews retrieved: {len(data)} reviews")
    
    def test_mark_review_helpful(self):
        """Test POST /api/reviews/{review_id}/helpful"""
        # First create a review to mark as helpful
        spots_response = requests.get(f"{BASE_URL}/api/spots")
        spots = spots_response.json()
        if not spots:
            pytest.skip("No parking spots available for testing")
        
        spot_id = spots[0]["id"]
        
        # Create a review
        review_data = {
            "spot_id": spot_id,
            "rating": 5,
            "comment": "TEST_Excellent spot for overnight parking!",
            "photos": [],
            "cleanliness": 5,
            "safety": 5,
            "amenities": 4
        }
        create_response = requests.post(
            f"{BASE_URL}/api/reviews/photo?driver_email={DRIVER_EMAIL}",
            json=review_data
        )
        if create_response.status_code == 200:
            review_id = create_response.json().get("review_id")
            
            # Mark as helpful
            response = requests.post(
                f"{BASE_URL}/api/reviews/{review_id}/helpful?driver_email={DRIVER_EMAIL}"
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            print(f"✓ Review marked as helpful")
        else:
            print(f"⚠ Could not create review to test helpful marking")


class TestInAppMessaging:
    """Test In-App Messaging API"""
    
    def test_get_conversations(self):
        """Test GET /api/messages/conversations/{email}"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations/{DRIVER_EMAIL}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Conversations retrieved: {len(data)} conversations")
    
    def test_send_message(self):
        """Test POST /api/messages/send"""
        message_data = {
            "recipient_email": "partner@test.com",
            "message": "TEST_Hello, this is a test message from the driver!",
            "message_type": "text"
        }
        response = requests.post(
            f"{BASE_URL}/api/messages/send?driver_email={DRIVER_EMAIL}",
            json=message_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data  # API returns the full message object with 'id'
        print(f"✓ Message sent: id={data['id']}")
    
    def test_get_messages_between_users(self):
        """Test GET /api/messages/{driver_email}/{partner_email}"""
        response = requests.get(f"{BASE_URL}/api/messages/{DRIVER_EMAIL}/partner@test.com")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Messages retrieved: {len(data)} messages")


class TestPushNotifications:
    """Test Push Notifications API"""
    
    def test_get_vapid_key(self):
        """Test GET /api/push/vapid-key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "publicKey" in data
        print(f"✓ VAPID key retrieved")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
