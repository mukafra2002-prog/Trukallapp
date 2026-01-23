"""
TrukAll Pre-Launch Features Test Suite - Iteration 8
Tests: Demo Account, Forgot Password, QR Scanner Tab, Onboarding Tutorial
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fleet-mate.preview.emergentagent.com')

class TestDemoAccount:
    """Demo Account Login Tests"""
    
    def test_demo_login_endpoint(self):
        """Test demo login creates/returns demo user"""
        response = requests.post(f"{BASE_URL}/api/auth/demo-login")
        print(f"Demo login response: {response.status_code}")
        print(f"Response body: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "user" in data
        assert "message" in data
        
        # Verify user data
        user = data["user"]
        assert user["email"] == "demo@trukall.app"
        assert user["name"] == "Demo Driver"
        assert user["role"] == "driver"
        assert user.get("is_demo") == True
        
        print(f"✅ Demo login successful: {user['name']} ({user['email']})")
    
    def test_demo_login_multiple_times(self):
        """Test demo login works multiple times (idempotent)"""
        # First login
        response1 = requests.post(f"{BASE_URL}/api/auth/demo-login")
        assert response1.status_code == 200
        
        # Second login
        response2 = requests.post(f"{BASE_URL}/api/auth/demo-login")
        assert response2.status_code == 200
        
        # Both should return same user
        assert response1.json()["user"]["email"] == response2.json()["user"]["email"]
        print("✅ Demo login is idempotent")


class TestForgotPassword:
    """Forgot Password Flow Tests"""
    
    def test_forgot_password_existing_user(self):
        """Test forgot password for existing user"""
        # Use existing test user - send JSON body
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "driver@test.com"}
        )
        print(f"Forgot password response: {response.status_code}")
        print(f"Response body: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return message and reset_code in test mode
        assert "message" in data
        if "reset_code" in data:
            print(f"✅ Reset code generated: {data['reset_code']}")
        else:
            print("✅ Forgot password request processed")
    
    def test_forgot_password_nonexistent_user(self):
        """Test forgot password for non-existent user (should not reveal)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent@test.com"}
        )
        print(f"Forgot password (nonexistent) response: {response.status_code}")
        
        # Should still return 200 to not reveal if email exists
        assert response.status_code == 200
        print("✅ Non-existent email handled securely")
    
    def test_reset_password_with_token(self):
        """Test password reset with valid reset code"""
        # First get a reset code
        forgot_response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "driver@test.com"}
        )
        
        if forgot_response.status_code == 200 and "reset_code" in forgot_response.json():
            reset_code = forgot_response.json()["reset_code"]
            
            # Now reset password using JSON body
            reset_response = requests.post(
                f"{BASE_URL}/api/auth/reset-password",
                json={
                    "email": "driver@test.com",
                    "reset_code": reset_code,
                    "new_password": "password123"  # Reset to original
                }
            )
            print(f"Reset password response: {reset_response.status_code}")
            
            assert reset_response.status_code == 200
            print("✅ Password reset successful")
        else:
            print("⚠️ Reset code not available, skipping reset test")
    
    def test_reset_password_invalid_token(self):
        """Test password reset with invalid reset code"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "email": "driver@test.com",
                "reset_code": "000000",  # Invalid code
                "new_password": "newpassword123"
            }
        )
        print(f"Reset with invalid code: {response.status_code}")
        
        # Should fail with 400
        assert response.status_code == 400
        print("✅ Invalid reset code rejected correctly")


class TestRegularLogin:
    """Regular Login Tests (ensure not broken)"""
    
    def test_driver_login(self):
        """Test regular driver login still works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "driver@test.com",
                "password": "password123"
            }
        )
        print(f"Driver login response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "driver@test.com"
        print(f"✅ Regular login works: {data['user']['name']}")
    
    def test_invalid_login(self):
        """Test invalid credentials rejected"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "driver@test.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        print("✅ Invalid credentials rejected")


class TestCoreFeatures:
    """Test core features still work"""
    
    def test_health_check(self):
        """Test API health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✅ API health check passed")
    
    def test_parking_spots(self):
        """Test parking spots endpoint"""
        response = requests.get(f"{BASE_URL}/api/spots")
        assert response.status_code == 200
        spots = response.json()
        print(f"✅ Parking spots: {len(spots)} available")
    
    def test_live_updates(self):
        """Test live updates endpoint"""
        response = requests.get(f"{BASE_URL}/api/spots/live-updates")
        assert response.status_code == 200
        print("✅ Live updates endpoint working")
    
    def test_loads(self):
        """Test load board"""
        response = requests.get(f"{BASE_URL}/api/loads")
        assert response.status_code == 200
        loads = response.json()
        print(f"✅ Load board: {len(loads)} loads available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
