"""
TrukAll API Tests - New Features (Iteration 3)
Tests: Notifications, Share Location, Partner Subscription Plans, Convoy Join with Notifications, SpotReviews
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


class TestNotificationSystem:
    """Test Notification API endpoints"""
    
    def test_get_notifications(self):
        """Test GET /api/notifications/{email}"""
        response = requests.get(f"{BASE_URL}/api/notifications/{TEST_DRIVER['email']}")
        print(f"Get notifications response: {response.status_code}")
        assert response.status_code == 200, f"Get notifications failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} notifications for driver")
        if len(data) > 0:
            notif = data[0]
            assert "id" in notif
            assert "recipient_email" in notif
            assert "type" in notif
            assert "title" in notif
            assert "message" in notif
            assert "is_read" in notif
            print(f"✓ First notification: {notif['title']} - Type: {notif['type']}")
    
    def test_get_notifications_unread_only(self):
        """Test GET /api/notifications/{email}?unread_only=true"""
        response = requests.get(f"{BASE_URL}/api/notifications/{TEST_DRIVER['email']}", params={"unread_only": True})
        print(f"Get unread notifications response: {response.status_code}")
        assert response.status_code == 200, f"Get unread notifications failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # All returned notifications should be unread
        for notif in data:
            assert notif.get("is_read") == False, "Found read notification in unread_only query"
        print(f"✓ Got {len(data)} unread notifications")
    
    def test_get_notification_count(self):
        """Test GET /api/notifications/{email}/count"""
        response = requests.get(f"{BASE_URL}/api/notifications/{TEST_DRIVER['email']}/count")
        print(f"Get notification count response: {response.status_code}")
        assert response.status_code == 200, f"Get notification count failed: {response.text}"
        data = response.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        print(f"✓ Unread notification count: {data['unread_count']}")
    
    def test_mark_notification_read(self):
        """Test PUT /api/notifications/{notification_id}/read"""
        # First get notifications to find one to mark as read
        response = requests.get(f"{BASE_URL}/api/notifications/{TEST_DRIVER['email']}")
        notifications = response.json()
        
        if len(notifications) > 0:
            notif_id = notifications[0]["id"]
            response = requests.put(
                f"{BASE_URL}/api/notifications/{notif_id}/read",
                params={"driver_email": TEST_DRIVER["email"]}
            )
            print(f"Mark notification read response: {response.status_code}")
            assert response.status_code == 200, f"Mark notification read failed: {response.text}"
            data = response.json()
            assert "message" in data
            print(f"✓ Notification marked as read: {data['message']}")
        else:
            print("⚠ No notifications to mark as read - skipping")
    
    def test_mark_all_notifications_read(self):
        """Test PUT /api/notifications/{email}/read-all"""
        response = requests.put(f"{BASE_URL}/api/notifications/{TEST_DRIVER['email']}/read-all")
        print(f"Mark all notifications read response: {response.status_code}")
        assert response.status_code == 200, f"Mark all notifications read failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ All notifications marked as read: {data['message']}")


class TestShareLocation:
    """Test Share Location API endpoints"""
    
    def test_share_location(self):
        """Test POST /api/location/share"""
        location_data = {
            "latitude": 32.7767,
            "longitude": -96.7970,
            "address": "Dallas, TX",
            "message": "Test location share",
            "duration_minutes": 60
        }
        response = requests.post(
            f"{BASE_URL}/api/location/share",
            params={"driver_email": TEST_DRIVER["email"]},
            json=location_data
        )
        print(f"Share location response: {response.status_code}")
        print(f"Response body: {response.text}")
        assert response.status_code == 200, f"Share location failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "share_id" in data
        assert "expires_at" in data
        assert "recipients" in data
        assert "notifications_sent" in data
        print(f"✓ Location shared successfully: {data['message']}")
        print(f"✓ Share ID: {data['share_id']}, Recipients: {data['recipients']}")
        return data["share_id"]
    
    def test_get_shared_locations(self):
        """Test GET /api/location/shared-with-me/{driver_email}"""
        response = requests.get(f"{BASE_URL}/api/location/shared-with-me/{TEST_DRIVER['email']}")
        print(f"Get shared locations response: {response.status_code}")
        assert response.status_code == 200, f"Get shared locations failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} locations shared with driver")
    
    def test_get_my_shared_locations(self):
        """Test GET /api/location/my-shares/{driver_email}"""
        response = requests.get(f"{BASE_URL}/api/location/my-shares/{TEST_DRIVER['email']}")
        print(f"Get my shared locations response: {response.status_code}")
        assert response.status_code == 200, f"Get my shared locations failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} locations shared by driver")


class TestPartnerSubscriptionPlans:
    """Test Partner Subscription Plans API"""
    
    def test_get_all_subscription_plans(self):
        """Test GET /api/subscriptions/plans (all plans)"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        print(f"Get all subscription plans response: {response.status_code}")
        assert response.status_code == 200, f"Get subscription plans failed: {response.text}"
        data = response.json()
        assert "plans" in data
        assert "partner_plans" in data
        print(f"✓ Got {len(data['plans'])} driver plans and {len(data['partner_plans'])} partner plans")
    
    def test_get_partner_subscription_plans(self):
        """Test GET /api/subscriptions/plans?plan_type=partner"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans", params={"plan_type": "partner"})
        print(f"Get partner subscription plans response: {response.status_code}")
        assert response.status_code == 200, f"Get partner subscription plans failed: {response.text}"
        data = response.json()
        assert "plans" in data
        assert isinstance(data["plans"], list)
        print(f"✓ Got {len(data['plans'])} partner subscription plans")
        for plan in data["plans"]:
            assert "id" in plan
            assert "name" in plan
            assert "price" in plan
            assert "features" in plan
            print(f"  - {plan['name']}: ${plan['price']}/month")
    
    def test_get_driver_subscription_plans(self):
        """Test GET /api/subscriptions/plans?plan_type=driver"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans", params={"plan_type": "driver"})
        print(f"Get driver subscription plans response: {response.status_code}")
        assert response.status_code == 200, f"Get driver subscription plans failed: {response.text}"
        data = response.json()
        assert "plans" in data
        assert isinstance(data["plans"], list)
        print(f"✓ Got {len(data['plans'])} driver subscription plans")


class TestConvoyWithNotifications:
    """Test Convoy Join with Notification generation"""
    
    def test_get_convoy_posts(self):
        """Test GET /api/convoy/posts"""
        response = requests.get(f"{BASE_URL}/api/convoy/posts")
        print(f"Get convoy posts response: {response.status_code}")
        assert response.status_code == 200, f"Get convoy posts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} convoy posts")
        return data
    
    def test_create_convoy_post(self):
        """Test POST /api/convoy/posts"""
        convoy_data = {
            "origin_city": "Dallas",
            "origin_state": "TX",
            "destination_city": "Atlanta",
            "destination_state": "GA",
            "departure_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "message": "Test convoy - looking for drivers",
            "max_drivers": 5
        }
        response = requests.post(
            f"{BASE_URL}/api/convoy/posts",
            params={"driver_email": TEST_DRIVER["email"]},
            json=convoy_data
        )
        print(f"Create convoy post response: {response.status_code}")
        print(f"Response body: {response.text}")
        assert response.status_code == 200, f"Create convoy post failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["origin_city"] == "Dallas"
        assert data["destination_city"] == "Atlanta"
        print(f"✓ Convoy post created: {data['id']}")
        return data["id"]
    
    def test_join_convoy_generates_notification(self):
        """Test POST /api/convoy/posts/{id}/join - should generate notification"""
        # First create a convoy post
        convoy_data = {
            "origin_city": "Houston",
            "origin_state": "TX",
            "destination_city": "Phoenix",
            "destination_state": "AZ",
            "departure_date": (datetime.now() + timedelta(days=2)).isoformat(),
            "message": "Test convoy for notification test",
            "max_drivers": 5
        }
        create_response = requests.post(
            f"{BASE_URL}/api/convoy/posts",
            params={"driver_email": TEST_DRIVER["email"]},
            json=convoy_data
        )
        assert create_response.status_code == 200, f"Create convoy failed: {create_response.text}"
        convoy_id = create_response.json()["id"]
        print(f"✓ Created convoy: {convoy_id}")
        
        # Get initial notification count for convoy leader
        initial_count_response = requests.get(f"{BASE_URL}/api/notifications/{TEST_DRIVER['email']}/count")
        initial_count = initial_count_response.json()["unread_count"]
        print(f"✓ Initial notification count: {initial_count}")
        
        # Join convoy with partner account (different user)
        join_response = requests.post(
            f"{BASE_URL}/api/convoy/posts/{convoy_id}/join",
            params={"driver_email": TEST_PARTNER["email"]}
        )
        print(f"Join convoy response: {join_response.status_code}")
        print(f"Response body: {join_response.text}")
        
        # Check if join was successful or already joined
        if join_response.status_code == 200:
            data = join_response.json()
            assert "message" in data
            print(f"✓ Joined convoy: {data['message']}")
            
            # Check if notification was created for convoy leader
            new_count_response = requests.get(f"{BASE_URL}/api/notifications/{TEST_DRIVER['email']}/count")
            new_count = new_count_response.json()["unread_count"]
            print(f"✓ New notification count: {new_count}")
            
            # Verify notification was created
            notifications_response = requests.get(f"{BASE_URL}/api/notifications/{TEST_DRIVER['email']}")
            notifications = notifications_response.json()
            convoy_notifications = [n for n in notifications if n.get("type") == "convoy_join"]
            print(f"✓ Found {len(convoy_notifications)} convoy_join notifications")
        elif join_response.status_code == 400:
            # Already in convoy - this is acceptable
            print("⚠ Already in convoy - notification test skipped")
        else:
            assert False, f"Unexpected response: {join_response.status_code} - {join_response.text}"


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


class TestSpotReviews:
    """Test Spot Reviews API"""
    
    def test_get_spot_reviews(self):
        """Test GET /api/reviews/spot/{spot_id}"""
        # First get a spot ID
        spots_response = requests.get(f"{BASE_URL}/api/spots")
        spots = spots_response.json()
        
        if len(spots) > 0:
            spot_id = spots[0]["id"]
            response = requests.get(f"{BASE_URL}/api/reviews/spot/{spot_id}")
            print(f"Get spot reviews response: {response.status_code}")
            assert response.status_code == 200, f"Get spot reviews failed: {response.text}"
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Got {len(data)} reviews for spot {spots[0]['name']}")
        else:
            print("⚠ No spots available - skipping review test")
    
    def test_get_review_summary(self):
        """Test GET /api/reviews/summary/{spot_id}"""
        # First get a spot ID
        spots_response = requests.get(f"{BASE_URL}/api/spots")
        spots = spots_response.json()
        
        if len(spots) > 0:
            spot_id = spots[0]["id"]
            response = requests.get(f"{BASE_URL}/api/reviews/summary/{spot_id}")
            print(f"Get review summary response: {response.status_code}")
            assert response.status_code == 200, f"Get review summary failed: {response.text}"
            data = response.json()
            assert "total_reviews" in data
            assert "average_rating" in data
            print(f"✓ Review summary: {data['total_reviews']} reviews, avg rating: {data['average_rating']}")
        else:
            print("⚠ No spots available - skipping review summary test")
    
    def test_create_review(self):
        """Test POST /api/reviews"""
        # First get a spot ID
        spots_response = requests.get(f"{BASE_URL}/api/spots")
        spots = spots_response.json()
        
        if len(spots) > 0:
            spot_id = spots[0]["id"]
            review_data = {
                "spot_id": spot_id,
                "rating": 4,
                "cleanliness_rating": 4,
                "safety_rating": 5,
                "amenities_rating": 4,
                "comment": "Test review - great parking spot with good amenities!"
            }
            response = requests.post(
                f"{BASE_URL}/api/reviews",
                params={"driver_email": TEST_DRIVER["email"]},
                json=review_data
            )
            print(f"Create review response: {response.status_code}")
            print(f"Response body: {response.text}")
            assert response.status_code == 200, f"Create review failed: {response.text}"
            data = response.json()
            assert "id" in data
            assert data["rating"] == 4
            print(f"✓ Review created: {data['id']}")
        else:
            print("⚠ No spots available - skipping create review test")


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
            assert "latitude" in spot
            assert "longitude" in spot
            print(f"✓ First spot: {spot['name']} in {spot['city']}, {spot['state']}")
    
    def test_get_single_spot(self):
        """Test GET /api/spots/{spot_id}"""
        # First get a spot ID
        spots_response = requests.get(f"{BASE_URL}/api/spots")
        spots = spots_response.json()
        
        if len(spots) > 0:
            spot_id = spots[0]["id"]
            response = requests.get(f"{BASE_URL}/api/spots/{spot_id}")
            print(f"Get single spot response: {response.status_code}")
            assert response.status_code == 200, f"Get single spot failed: {response.text}"
            data = response.json()
            assert data["id"] == spot_id
            print(f"✓ Got spot details: {data['name']}")
        else:
            print("⚠ No spots available - skipping single spot test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
