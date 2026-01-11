"""
Test suite for TrukAll Engagement Features - Iteration 6
Tests: Gamification, Rewards Store, Maintenance Tracker, Mentor System, Driver Spotlight
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://driver-assist-11.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_DRIVER_EMAIL = "driver@test.com"
TEST_DRIVER_PASSWORD = "password123"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        print("✅ API Health Check passed")


class TestGamificationBadges:
    """Test gamification badges endpoint"""
    
    def test_get_all_badges(self):
        """Test GET /api/gamification/badges returns all available badges"""
        response = requests.get(f"{BASE_URL}/api/gamification/badges")
        assert response.status_code == 200
        badges = response.json()
        
        # Verify badges structure
        assert isinstance(badges, list)
        assert len(badges) > 0
        
        # Check badge structure
        badge = badges[0]
        assert 'id' in badge
        assert 'name' in badge
        assert 'description' in badge
        assert 'icon' in badge
        assert 'points' in badge
        assert 'category' in badge
        
        # Verify expected badge categories exist
        categories = set(b['category'] for b in badges)
        expected_categories = {'reviews', 'referrals', 'community', 'streaks', 'miles', 'special'}
        assert categories == expected_categories
        
        print(f"✅ GET /api/gamification/badges - {len(badges)} badges returned")


class TestGamificationUser:
    """Test user gamification data endpoint"""
    
    def test_get_user_gamification(self):
        """Test GET /api/gamification/user/{email} returns user gamification data"""
        response = requests.get(f"{BASE_URL}/api/gamification/user/{TEST_DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert 'badges' in data
        assert 'total_badges' in data
        assert 'streak' in data
        assert 'daily_challenges' in data
        assert 'weekly_challenges' in data
        assert 'level' in data
        assert 'level_progress' in data
        assert 'total_points' in data
        
        # Verify streak structure
        assert 'current_streak' in data['streak']
        assert 'longest_streak' in data['streak']
        
        # Verify level is calculated correctly (1 + points // 500)
        expected_level = 1 + (data['total_points'] // 500)
        assert data['level'] == expected_level
        
        print(f"✅ GET /api/gamification/user/{TEST_DRIVER_EMAIL} - Level {data['level']}, {data['total_points']} points")
    
    def test_get_user_gamification_invalid_user(self):
        """Test GET /api/gamification/user/{email} with invalid user returns 404"""
        response = requests.get(f"{BASE_URL}/api/gamification/user/nonexistent@test.com")
        assert response.status_code == 404
        print("✅ GET /api/gamification/user/invalid - Returns 404 as expected")


class TestGamificationCheckin:
    """Test daily check-in endpoint"""
    
    def test_daily_checkin(self):
        """Test POST /api/gamification/checkin awards points"""
        response = requests.post(f"{BASE_URL}/api/gamification/checkin?user_email={TEST_DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert 'message' in data
        assert 'points_earned' in data or 'current_streak' in data
        
        # Either already checked in or successful
        if data.get('message') == "Already checked in today":
            assert data['points_earned'] == 0
            print("✅ POST /api/gamification/checkin - Already checked in today")
        else:
            assert data['points_earned'] >= 10  # Base points
            print(f"✅ POST /api/gamification/checkin - Earned {data['points_earned']} points, streak: {data.get('current_streak', 'N/A')}")


class TestGamificationLeaderboard:
    """Test leaderboard endpoint"""
    
    def test_get_leaderboard_points(self):
        """Test GET /api/gamification/leaderboard returns points leaderboard"""
        response = requests.get(f"{BASE_URL}/api/gamification/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            leader = data[0]
            assert 'rank' in leader
            assert 'name' in leader
            assert 'value' in leader
            assert leader['rank'] == 1
            
            # Verify sorted by value descending
            for i in range(1, len(data)):
                assert data[i-1]['value'] >= data[i]['value']
        
        print(f"✅ GET /api/gamification/leaderboard - {len(data)} users on leaderboard")
    
    def test_get_leaderboard_streak(self):
        """Test GET /api/gamification/leaderboard?category=streak"""
        response = requests.get(f"{BASE_URL}/api/gamification/leaderboard?category=streak")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/gamification/leaderboard?category=streak - {len(data)} users")


class TestGamificationChallenges:
    """Test challenges endpoint"""
    
    def test_get_challenges(self):
        """Test GET /api/gamification/challenges returns daily and weekly challenges"""
        response = requests.get(f"{BASE_URL}/api/gamification/challenges")
        assert response.status_code == 200
        data = response.json()
        
        assert 'daily' in data
        assert 'weekly' in data
        
        # Verify daily challenges structure
        assert len(data['daily']) > 0
        daily = data['daily'][0]
        assert 'id' in daily
        assert 'name' in daily
        assert 'description' in daily
        assert 'points' in daily
        
        # Verify weekly challenges structure
        assert len(data['weekly']) > 0
        weekly = data['weekly'][0]
        assert 'id' in weekly
        assert 'target' in weekly
        
        print(f"✅ GET /api/gamification/challenges - {len(data['daily'])} daily, {len(data['weekly'])} weekly challenges")


class TestRewardsCatalog:
    """Test rewards catalog endpoint"""
    
    def test_get_rewards_catalog(self):
        """Test GET /api/rewards/catalog returns available rewards"""
        response = requests.get(f"{BASE_URL}/api/rewards/catalog")
        assert response.status_code == 200
        rewards = response.json()
        
        assert isinstance(rewards, list)
        assert len(rewards) > 0
        
        # Verify reward structure
        reward = rewards[0]
        assert 'id' in reward
        assert 'name' in reward
        assert 'description' in reward
        assert 'cost' in reward
        assert 'icon' in reward
        assert 'category' in reward
        
        # Verify expected rewards exist
        reward_ids = [r['id'] for r in rewards]
        expected_rewards = ['premium_week', 'premium_month', 'custom_badge', 'priority_support']
        for expected in expected_rewards:
            assert expected in reward_ids, f"Missing reward: {expected}"
        
        print(f"✅ GET /api/rewards/catalog - {len(rewards)} rewards available")


class TestRewardsUser:
    """Test user rewards endpoint"""
    
    def test_get_user_rewards(self):
        """Test GET /api/rewards/user/{email} returns user's points and redemptions"""
        response = requests.get(f"{BASE_URL}/api/rewards/user/{TEST_DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        
        assert 'available_points' in data
        assert 'redemptions' in data
        assert isinstance(data['redemptions'], list)
        assert data['available_points'] >= 0
        
        print(f"✅ GET /api/rewards/user/{TEST_DRIVER_EMAIL} - {data['available_points']} points available")
    
    def test_get_user_rewards_invalid_user(self):
        """Test GET /api/rewards/user/{email} with invalid user returns 404"""
        response = requests.get(f"{BASE_URL}/api/rewards/user/nonexistent@test.com")
        assert response.status_code == 404
        print("✅ GET /api/rewards/user/invalid - Returns 404 as expected")


class TestMaintenanceDefaults:
    """Test maintenance defaults endpoint"""
    
    def test_get_maintenance_defaults(self):
        """Test GET /api/maintenance/defaults returns default maintenance schedules"""
        response = requests.get(f"{BASE_URL}/api/maintenance/defaults")
        assert response.status_code == 200
        defaults = response.json()
        
        # Verify it's a dict with maintenance types
        assert isinstance(defaults, dict)
        
        # Check expected maintenance types
        expected_types = ['oil_change', 'tire_rotation', 'brake_inspection', 'air_filter', 'transmission', 'coolant']
        for mtype in expected_types:
            assert mtype in defaults, f"Missing maintenance type: {mtype}"
            assert 'name' in defaults[mtype]
            assert 'interval_miles' in defaults[mtype]
            assert 'interval_days' in defaults[mtype]
            assert 'icon' in defaults[mtype]
        
        print(f"✅ GET /api/maintenance/defaults - {len(defaults)} maintenance types")


class TestMaintenanceUser:
    """Test user maintenance endpoint"""
    
    def test_get_user_maintenance(self):
        """Test GET /api/maintenance/{email} returns user's maintenance items"""
        response = requests.get(f"{BASE_URL}/api/maintenance/{TEST_DRIVER_EMAIL}")
        assert response.status_code == 200
        items = response.json()
        
        assert isinstance(items, list)
        
        # If items exist, verify structure
        if len(items) > 0:
            item = items[0]
            assert 'id' in item
            assert 'item_type' in item
            assert 'description' in item
            assert 'next_due_date' in item
            assert 'status' in item
        
        print(f"✅ GET /api/maintenance/{TEST_DRIVER_EMAIL} - {len(items)} maintenance items")
    
    def test_add_maintenance_item(self):
        """Test POST /api/maintenance adds a maintenance item"""
        today = datetime.now().date().isoformat()
        
        response = requests.post(
            f"{BASE_URL}/api/maintenance",
            params={
                "item_type": "oil_change",
                "last_service_date": today,
                "last_service_miles": 50000,
                "notes": "Test maintenance item",
                "user_email": TEST_DRIVER_EMAIL
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'message' in data
        assert 'item_id' in data
        assert data['message'] == "Maintenance item added!"
        
        print(f"✅ POST /api/maintenance - Item added with ID: {data['item_id']}")
        
        # Cleanup - delete the test item
        delete_response = requests.delete(
            f"{BASE_URL}/api/maintenance/{data['item_id']}?user_email={TEST_DRIVER_EMAIL}"
        )
        assert delete_response.status_code == 200
        print("✅ DELETE /api/maintenance/{item_id} - Test item cleaned up")
    
    def test_add_maintenance_invalid_type(self):
        """Test POST /api/maintenance with invalid type returns 400"""
        today = datetime.now().date().isoformat()
        
        response = requests.post(
            f"{BASE_URL}/api/maintenance",
            params={
                "item_type": "invalid_type",
                "last_service_date": today,
                "last_service_miles": 50000,
                "user_email": TEST_DRIVER_EMAIL
            }
        )
        assert response.status_code == 400
        print("✅ POST /api/maintenance with invalid type - Returns 400 as expected")


class TestMentors:
    """Test mentors endpoint"""
    
    def test_get_mentors(self):
        """Test GET /api/mentors returns available mentors"""
        response = requests.get(f"{BASE_URL}/api/mentors")
        assert response.status_code == 200
        mentors = response.json()
        
        assert isinstance(mentors, list)
        
        # If mentors exist, verify structure
        if len(mentors) > 0:
            mentor = mentors[0]
            assert 'mentor_email' in mentor
            assert 'mentor_name' in mentor
            assert 'years_experience' in mentor
            assert 'specialties' in mentor
            assert 'bio' in mentor
            assert 'rating' in mentor
        
        print(f"✅ GET /api/mentors - {len(mentors)} mentors available")
    
    def test_get_mentors_by_specialty(self):
        """Test GET /api/mentors?specialty=long_haul filters by specialty"""
        response = requests.get(f"{BASE_URL}/api/mentors?specialty=long_haul")
        assert response.status_code == 200
        mentors = response.json()
        assert isinstance(mentors, list)
        print(f"✅ GET /api/mentors?specialty=long_haul - {len(mentors)} mentors")


class TestDriverSpotlight:
    """Test driver spotlight endpoint"""
    
    def test_get_weekly_spotlight(self):
        """Test GET /api/spotlight/weekly returns featured drivers"""
        response = requests.get(f"{BASE_URL}/api/spotlight/weekly")
        assert response.status_code == 200
        spotlights = response.json()
        
        assert isinstance(spotlights, list)
        
        # If spotlights exist, verify structure
        if len(spotlights) > 0:
            spotlight = spotlights[0]
            assert 'category' in spotlight
            assert 'icon' in spotlight
            assert 'name' in spotlight
            assert 'stat' in spotlight
            assert 'points' in spotlight
            
            # Verify expected categories
            valid_categories = ['Top Reviewer', 'Most Helpful', 'Streak Champion']
            assert spotlight['category'] in valid_categories
        
        print(f"✅ GET /api/spotlight/weekly - {len(spotlights)} featured drivers")


class TestMentorRequests:
    """Test mentor request endpoints"""
    
    def test_get_mentor_requests(self):
        """Test GET /api/mentors/requests/{email} returns mentor requests"""
        response = requests.get(f"{BASE_URL}/api/mentors/requests/{TEST_DRIVER_EMAIL}")
        assert response.status_code == 200
        requests_list = response.json()
        
        assert isinstance(requests_list, list)
        print(f"✅ GET /api/mentors/requests/{TEST_DRIVER_EMAIL} - {len(requests_list)} requests")
    
    def test_get_mentor_requests_as_mentor(self):
        """Test GET /api/mentors/requests/{email}?role=mentor"""
        response = requests.get(f"{BASE_URL}/api/mentors/requests/{TEST_DRIVER_EMAIL}?role=mentor")
        assert response.status_code == 200
        requests_list = response.json()
        assert isinstance(requests_list, list)
        print(f"✅ GET /api/mentors/requests/{TEST_DRIVER_EMAIL}?role=mentor - {len(requests_list)} requests")


class TestRewardRedemption:
    """Test reward redemption endpoint"""
    
    def test_redeem_reward_insufficient_points(self):
        """Test POST /api/rewards/redeem with insufficient points returns 400"""
        # First check user's points
        user_response = requests.get(f"{BASE_URL}/api/rewards/user/{TEST_DRIVER_EMAIL}")
        user_data = user_response.json()
        
        # Find a reward that costs more than user has
        catalog_response = requests.get(f"{BASE_URL}/api/rewards/catalog")
        rewards = catalog_response.json()
        
        expensive_reward = max(rewards, key=lambda r: r['cost'])
        
        if user_data['available_points'] < expensive_reward['cost']:
            response = requests.post(
                f"{BASE_URL}/api/rewards/redeem",
                params={
                    "reward_id": expensive_reward['id'],
                    "user_email": TEST_DRIVER_EMAIL
                }
            )
            assert response.status_code == 400
            print(f"✅ POST /api/rewards/redeem with insufficient points - Returns 400 as expected")
        else:
            print("⚠️ User has enough points for all rewards - skipping insufficient points test")
    
    def test_redeem_reward_invalid_reward(self):
        """Test POST /api/rewards/redeem with invalid reward returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/rewards/redeem",
            params={
                "reward_id": "nonexistent_reward",
                "user_email": TEST_DRIVER_EMAIL
            }
        )
        assert response.status_code == 404
        print("✅ POST /api/rewards/redeem with invalid reward - Returns 404 as expected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
