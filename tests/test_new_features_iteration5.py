"""
Test Suite for TrukAll Iteration 5 - New Features
Tests: Feedback Form, Community Board, Referral System, Social Links, App Config
"""
import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_DRIVER_EMAIL = "driver@test.com"
TEST_DRIVER_PASSWORD = "password123"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ API health check passed: {data}")


class TestFeedbackAPI:
    """Tests for Feedback Form API"""
    
    def test_submit_feedback_general(self):
        """Test submitting general feedback"""
        feedback_data = {
            "feedback_type": "general",
            "subject": "TEST_Great app experience",
            "message": "This app has been very helpful for finding parking spots.",
            "rating": 5
        }
        response = requests.post(
            f"{BASE_URL}/api/feedback?user_email={TEST_DRIVER_EMAIL}",
            json=feedback_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "points_earned" in data
        assert data["points_earned"] > 0
        print(f"✓ General feedback submitted: {data}")
    
    def test_submit_feedback_bug_report(self):
        """Test submitting bug report feedback"""
        feedback_data = {
            "feedback_type": "bug",
            "subject": "TEST_Map loading issue",
            "message": "Sometimes the map takes too long to load on mobile.",
            "rating": 3
        }
        response = requests.post(
            f"{BASE_URL}/api/feedback?user_email={TEST_DRIVER_EMAIL}",
            json=feedback_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "feedback_id" in data
        print(f"✓ Bug report feedback submitted: {data}")
    
    def test_submit_feedback_feature_request(self):
        """Test submitting feature request feedback"""
        feedback_data = {
            "feedback_type": "feature",
            "subject": "TEST_Add dark mode",
            "message": "Would love to have a dark mode option for night driving.",
            "rating": 4
        }
        response = requests.post(
            f"{BASE_URL}/api/feedback?user_email={TEST_DRIVER_EMAIL}",
            json=feedback_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Thank you for your feedback!"
        print(f"✓ Feature request feedback submitted: {data}")
    
    def test_get_user_feedback(self):
        """Test getting user's submitted feedback"""
        response = requests.get(f"{BASE_URL}/api/feedback/{TEST_DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ User feedback retrieved: {len(data)} items")


class TestCommunityBoardAPI:
    """Tests for Community Board API"""
    
    def test_get_community_categories(self):
        """Test getting community categories"""
        response = requests.get(f"{BASE_URL}/api/community/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check expected categories exist
        category_ids = [cat.get('id') for cat in data]
        expected_categories = ['general', 'tips', 'routes', 'parking', 'deals', 'questions', 'announcements']
        for expected in expected_categories:
            assert expected in category_ids, f"Missing category: {expected}"
        print(f"✓ Community categories retrieved: {[c['name'] for c in data]}")
    
    def test_get_community_posts(self):
        """Test getting community posts"""
        response = requests.get(f"{BASE_URL}/api/community/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Community posts retrieved: {len(data)} posts")
    
    def test_get_community_posts_by_category(self):
        """Test filtering community posts by category"""
        response = requests.get(f"{BASE_URL}/api/community/posts?category=general")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Community posts filtered by category: {len(data)} posts")
    
    def test_create_community_post(self):
        """Test creating a community post"""
        post_data = {
            "category": "tips",
            "title": "TEST_Best rest stops on I-40",
            "content": "Here are my favorite rest stops along I-40 from Memphis to Oklahoma City...",
            "tags": ["rest-stops", "i-40", "tips"]
        }
        response = requests.post(
            f"{BASE_URL}/api/community/posts?user_email={TEST_DRIVER_EMAIL}",
            json=post_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "points_earned" in data
        assert "post_id" in data
        print(f"✓ Community post created: {data}")
        return data.get("post_id")
    
    def test_get_single_community_post(self):
        """Test getting a single community post with comments"""
        # First create a post
        post_data = {
            "category": "questions",
            "title": "TEST_Question about parking permits",
            "content": "Does anyone know if you need a permit to park at the new truck stop in Dallas?",
            "tags": ["dallas", "permits"]
        }
        create_response = requests.post(
            f"{BASE_URL}/api/community/posts?user_email={TEST_DRIVER_EMAIL}",
            json=post_data
        )
        assert create_response.status_code == 200
        post_id = create_response.json().get("post_id")
        
        # Get the post
        response = requests.get(f"{BASE_URL}/api/community/posts/{post_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == post_id
        assert data["title"] == post_data["title"]
        assert "comments" in data
        print(f"✓ Single community post retrieved: {data['title']}")
    
    def test_like_community_post(self):
        """Test liking a community post"""
        # First create a post
        post_data = {
            "category": "deals",
            "title": "TEST_Fuel discount at Pilot",
            "content": "Pilot Flying J has 10 cents off diesel this week!",
            "tags": ["fuel", "discount"]
        }
        create_response = requests.post(
            f"{BASE_URL}/api/community/posts?user_email={TEST_DRIVER_EMAIL}",
            json=post_data
        )
        post_id = create_response.json().get("post_id")
        
        # Like the post (using a different email to avoid self-like)
        response = requests.post(
            f"{BASE_URL}/api/community/posts/{post_id}/like?user_email=partner@test.com"
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Community post liked: {data}")
    
    def test_add_comment_to_post(self):
        """Test adding a comment to a community post"""
        # First create a post
        post_data = {
            "category": "parking",
            "title": "TEST_New parking spot in Houston",
            "content": "Found a great new parking spot near the port.",
            "tags": ["houston", "parking"]
        }
        create_response = requests.post(
            f"{BASE_URL}/api/community/posts?user_email={TEST_DRIVER_EMAIL}",
            json=post_data
        )
        post_id = create_response.json().get("post_id")
        
        # Add a comment
        comment_data = {"content": "Thanks for sharing! What's the address?"}
        response = requests.post(
            f"{BASE_URL}/api/community/posts/{post_id}/comments?user_email=partner@test.com",
            json=comment_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "points_earned" in data
        print(f"✓ Comment added to post: {data}")


class TestReferralSystemAPI:
    """Tests for Referral System API"""
    
    def test_get_referral_code(self):
        """Test getting/creating user's referral code"""
        response = requests.get(f"{BASE_URL}/api/referral/code/{TEST_DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data
        assert "referral_link" in data
        assert len(data["referral_code"]) > 0
        print(f"✓ Referral code retrieved: {data['referral_code']}")
        return data["referral_code"]
    
    def test_get_referral_stats(self):
        """Test getting user's referral statistics"""
        response = requests.get(f"{BASE_URL}/api/referral/stats/{TEST_DRIVER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "total_referrals" in data
        assert "total_earned" in data or "has_code" in data
        print(f"✓ Referral stats retrieved: {data}")
    
    def test_get_referral_leaderboard(self):
        """Test getting referral leaderboard"""
        response = requests.get(f"{BASE_URL}/api/referral/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check leaderboard structure if not empty
        if len(data) > 0:
            assert "rank" in data[0]
            assert "total_referrals" in data[0]
        print(f"✓ Referral leaderboard retrieved: {len(data)} entries")
    
    def test_apply_invalid_referral_code(self):
        """Test applying an invalid referral code"""
        response = requests.post(
            f"{BASE_URL}/api/referral/apply?referral_code=INVALID123&new_user_email=newuser@test.com"
        )
        assert response.status_code == 404
        print(f"✓ Invalid referral code correctly rejected")


class TestAppConfigAPI:
    """Tests for App Config and Social Links API"""
    
    def test_get_app_config(self):
        """Test getting app configuration"""
        response = requests.get(f"{BASE_URL}/api/app/config")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "app_name" in data
        assert data["app_name"] == "TrukAll"
        assert "version" in data
        assert "social_links" in data
        assert "support" in data
        assert "referral_rewards" in data
        
        # Check social links
        social_links = data["social_links"]
        assert "whatsapp" in social_links
        assert "telegram" in social_links
        assert "facebook" in social_links
        assert "google_business" in social_links
        
        # Check support info
        support = data["support"]
        assert "email" in support
        
        print(f"✓ App config retrieved: {data['app_name']} v{data['version']}")
        print(f"  Social links: {list(social_links.keys())}")


class TestIntegration:
    """Integration tests for new features"""
    
    def test_feedback_awards_points(self):
        """Test that submitting feedback awards points"""
        # Get initial points
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_DRIVER_EMAIL, "password": TEST_DRIVER_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip("Could not login to check points")
        
        initial_points = login_response.json()["user"].get("reward_points", 0)
        
        # Submit feedback
        feedback_data = {
            "feedback_type": "praise",
            "subject": "TEST_Love this app!",
            "message": "Best trucking app I've ever used!",
            "rating": 5
        }
        feedback_response = requests.post(
            f"{BASE_URL}/api/feedback?user_email={TEST_DRIVER_EMAIL}",
            json=feedback_data
        )
        assert feedback_response.status_code == 200
        points_earned = feedback_response.json()["points_earned"]
        
        # Verify points were awarded
        assert points_earned > 0
        print(f"✓ Feedback awarded {points_earned} points")
    
    def test_community_post_awards_points(self):
        """Test that creating a community post awards points"""
        post_data = {
            "category": "announcements",
            "title": "TEST_New feature announcement",
            "content": "Check out the new referral system!",
            "tags": ["announcement"]
        }
        response = requests.post(
            f"{BASE_URL}/api/community/posts?user_email={TEST_DRIVER_EMAIL}",
            json=post_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["points_earned"] > 0
        print(f"✓ Community post awarded {data['points_earned']} points")


# Cleanup function to remove test data
def cleanup_test_data():
    """Clean up test data created during tests"""
    # This would typically delete TEST_ prefixed data
    # For now, we'll leave it as the data doesn't affect production
    pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
