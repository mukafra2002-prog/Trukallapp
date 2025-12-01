#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class NightHaulAPITester:
    def __init__(self, base_url="https://trucker-helper-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test users
        self.test_users = {
            "driver": {"email": "driver@test.com", "password": "password123"},
            "partner": {"email": "partner@test.com", "password": "password123"},
            "admin": {"email": "admin@test.com", "password": "password123"}
        }
        
        self.logged_in_users = {}
        self.created_spot_id = None
        self.created_booking_id = None

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    params: Optional[Dict] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
                
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test login for each user type
        for role, credentials in self.test_users.items():
            success, response = self.make_request(
                'POST', 
                '/auth/login', 
                credentials
            )
            
            if success and 'user' in response:
                self.logged_in_users[role] = response['user']
                self.log_test(
                    f"Login as {role}",
                    True,
                    f"Successfully logged in as {credentials['email']}"
                )
            else:
                self.log_test(
                    f"Login as {role}",
                    False,
                    f"Failed to login as {credentials['email']}",
                    response
                )

        # Test registration (create a new test user)
        test_email = f"test_driver_{datetime.now().strftime('%H%M%S')}@test.com"
        registration_data = {
            "email": test_email,
            "password": "testpass123",
            "name": "Test Driver",
            "role": "driver",
            "phone": "555-123-4567"
        }
        
        success, response = self.make_request(
            'POST',
            '/auth/register',
            registration_data,
            expected_status=200
        )
        
        self.log_test(
            "User Registration",
            success,
            f"Created new user: {test_email}" if success else "Registration failed",
            response if not success else None
        )

    def test_parking_spots_endpoints(self):
        """Test parking spots endpoints"""
        print("\n🅿️ Testing Parking Spots Endpoints...")
        
        # Test get all spots
        success, response = self.make_request('GET', '/spots')
        spots_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Get All Parking Spots",
            success,
            f"Retrieved {spots_count} parking spots" if success else "Failed to get spots",
            response if not success else None
        )
        
        # Test search by city
        success, response = self.make_request(
            'GET', 
            '/spots',
            params={"city": "Dallas"}
        )
        dallas_spots = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Search Spots by City",
            success,
            f"Found {dallas_spots} spots in Dallas" if success else "City search failed",
            response if not success else None
        )
        
        # Test get specific spot (if we have spots)
        if spots_count > 0 and success:
            first_spot = response[0] if isinstance(response, list) else None
            if first_spot and 'id' in first_spot:
                spot_id = first_spot['id']
                success, response = self.make_request('GET', f'/spots/{spot_id}')
                self.log_test(
                    "Get Specific Spot",
                    success,
                    f"Retrieved spot details for {spot_id}" if success else "Failed to get spot details",
                    response if not success else None
                )

        # Test create parking spot (as partner)
        if 'partner' in self.logged_in_users:
            partner_email = self.logged_in_users['partner']['email']
            new_spot_data = {
                "name": f"Test Spot {datetime.now().strftime('%H%M%S')}",
                "address": "123 Test Highway",
                "city": "TestCity",
                "state": "TX",
                "latitude": 32.7767,
                "longitude": -96.7970,
                "total_spaces": 20,
                "price_per_night": 25.00,
                "amenities": ["shower", "restroom", "fuel", "security"],
                "is_free": False,
                "security_level": "high",
                "description": "Test parking spot for API testing",
                "fuel_price_diesel": 3.89,
                "fuel_price_unleaded": 3.29
            }
            
            success, response = self.make_request(
                'POST',
                f'/spots?partner_email={partner_email}',
                new_spot_data,
                expected_status=200
            )
            
            if success and 'id' in response:
                self.created_spot_id = response['id']
                self.log_test(
                    "Create Parking Spot",
                    True,
                    f"Created spot: {response['name']} (ID: {self.created_spot_id})"
                )
            else:
                self.log_test(
                    "Create Parking Spot",
                    False,
                    "Failed to create parking spot",
                    response
                )

        # Test get partner spots
        if 'partner' in self.logged_in_users:
            partner_email = self.logged_in_users['partner']['email']
            success, response = self.make_request(
                'GET',
                f'/spots/partner/{partner_email}'
            )
            partner_spots = len(response) if success and isinstance(response, list) else 0
            self.log_test(
                "Get Partner Spots",
                success,
                f"Partner has {partner_spots} spots" if success else "Failed to get partner spots",
                response if not success else None
            )

    def test_booking_endpoints(self):
        """Test booking endpoints"""
        print("\n📅 Testing Booking Endpoints...")
        
        if not self.created_spot_id or 'driver' in self.logged_in_users:
            # Get any available spot for testing
            success, spots = self.make_request('GET', '/spots')
            if success and isinstance(spots, list) and len(spots) > 0:
                available_spot = next((s for s in spots if s.get('available_spaces', 0) > 0), None)
                if available_spot:
                    self.created_spot_id = available_spot['id']

        if self.created_spot_id and 'driver' in self.logged_in_users:
            driver_email = self.logged_in_users['driver']['email']
            
            # Create booking
            booking_data = {
                "spot_id": self.created_spot_id,
                "check_in_date": (datetime.now() + timedelta(days=1)).isoformat(),
                "check_out_date": (datetime.now() + timedelta(days=2)).isoformat()
            }
            
            success, response = self.make_request(
                'POST',
                f'/bookings?driver_email={driver_email}',
                booking_data,
                expected_status=200
            )
            
            if success and 'id' in response:
                self.created_booking_id = response['id']
                self.log_test(
                    "Create Booking",
                    True,
                    f"Created booking: {self.created_booking_id} for spot {self.created_spot_id}"
                )
            else:
                self.log_test(
                    "Create Booking",
                    False,
                    "Failed to create booking",
                    response
                )

            # Test get driver bookings
            success, response = self.make_request(
                'GET',
                f'/bookings/driver/{driver_email}'
            )
            bookings_count = len(response) if success and isinstance(response, list) else 0
            self.log_test(
                "Get Driver Bookings",
                success,
                f"Driver has {bookings_count} bookings" if success else "Failed to get driver bookings",
                response if not success else None
            )

        # Test get spot bookings
        if self.created_spot_id:
            success, response = self.make_request(
                'GET',
                f'/bookings/spot/{self.created_spot_id}'
            )
            spot_bookings = len(response) if success and isinstance(response, list) else 0
            self.log_test(
                "Get Spot Bookings",
                success,
                f"Spot has {spot_bookings} bookings" if success else "Failed to get spot bookings",
                response if not success else None
            )

    def test_payment_endpoints(self):
        """Test payment endpoints"""
        print("\n💳 Testing Payment Endpoints...")
        
        if self.created_booking_id:
            # Test create checkout session
            success, response = self.make_request(
                'POST',
                f'/payments/create-checkout?booking_id={self.created_booking_id}',
                expected_status=200
            )
            
            if success and 'url' in response and 'session_id' in response:
                session_id = response['session_id']
                self.log_test(
                    "Create Checkout Session",
                    True,
                    f"Created Stripe checkout session: {session_id}"
                )
                
                # Test get payment status
                success, response = self.make_request(
                    'GET',
                    f'/payments/status/{session_id}'
                )
                self.log_test(
                    "Get Payment Status",
                    success,
                    f"Payment status: {response.get('payment_status', 'unknown')}" if success else "Failed to get payment status",
                    response if not success else None
                )
            else:
                self.log_test(
                    "Create Checkout Session",
                    False,
                    "Failed to create checkout session",
                    response
                )
        else:
            self.log_test(
                "Payment Tests",
                False,
                "Skipped - no booking available for payment testing"
            )

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        if 'admin' in self.logged_in_users:
            admin_email = self.logged_in_users['admin']['email']
            
            # Test get dashboard stats
            success, response = self.make_request(
                'GET',
                f'/admin/stats?admin_email={admin_email}'
            )
            
            if success and isinstance(response, dict):
                stats = response
                self.log_test(
                    "Get Dashboard Stats",
                    True,
                    f"Stats - Spots: {stats.get('total_spots', 0)}, Bookings: {stats.get('total_bookings', 0)}, Revenue: ${stats.get('total_revenue', 0):.2f}"
                )
            else:
                self.log_test(
                    "Get Dashboard Stats",
                    False,
                    "Failed to get dashboard stats",
                    response
                )

            # Test get all users
            success, response = self.make_request(
                'GET',
                f'/admin/users?admin_email={admin_email}'
            )
            users_count = len(response) if success and isinstance(response, list) else 0
            self.log_test(
                "Get All Users",
                success,
                f"Total users in system: {users_count}" if success else "Failed to get users",
                response if not success else None
            )
        else:
            self.log_test(
                "Admin Tests",
                False,
                "Skipped - admin user not available"
            )

    def test_error_handling(self):
        """Test error handling"""
        print("\n🚨 Testing Error Handling...")
        
        # Test invalid login
        success, response = self.make_request(
            'POST',
            '/auth/login',
            {"email": "invalid@test.com", "password": "wrongpass"},
            expected_status=401
        )
        self.log_test(
            "Invalid Login Handling",
            success,
            "Correctly rejected invalid credentials" if success else "Should have rejected invalid login"
        )
        
        # Test non-existent spot
        success, response = self.make_request(
            'GET',
            '/spots/non-existent-id',
            expected_status=404
        )
        self.log_test(
            "Non-existent Spot Handling",
            success,
            "Correctly returned 404 for non-existent spot" if success else "Should have returned 404"
        )
        
        # Test unauthorized spot creation
        success, response = self.make_request(
            'POST',
            '/spots?partner_email=unauthorized@test.com',
            {"name": "Test", "address": "Test", "city": "Test", "state": "TX", 
             "latitude": 0, "longitude": 0, "total_spaces": 1, "price_per_night": 0, "amenities": []},
            expected_status=403
        )
        self.log_test(
            "Unauthorized Spot Creation",
            success,
            "Correctly rejected unauthorized spot creation" if success else "Should have rejected unauthorized creation"
        )

    def run_all_tests(self):
        """Run all test suites"""
        print("🚛 Starting NightHaul API Testing...")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        try:
            self.test_auth_endpoints()
            self.test_parking_spots_endpoints()
            self.test_booking_endpoints()
            self.test_payment_endpoints()
            self.test_admin_endpoints()
            self.test_error_handling()
            
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test_name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = NightHaulAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'failed_tests': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'test_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())