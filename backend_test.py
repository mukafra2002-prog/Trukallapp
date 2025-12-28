#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class TrukAllAPITester:
    def __init__(self, base_url="https://trucker-dash-3.preview.emergentagent.com"):
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

    def test_shower_credits_endpoints(self):
        """Test shower credits endpoints"""
        print("\n🚿 Testing Shower Credits Endpoints...")
        
        driver_email = "driver@test.com"
        
        # Test get shower credits for driver
        success, response = self.make_request(
            'GET',
            f'/shower-credits/{driver_email}'
        )
        credits_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Get Shower Credits",
            success,
            f"Retrieved {credits_count} shower credit records" if success else "Failed to get shower credits",
            response if not success else None
        )
        
        # Verify we have the expected 3 chains (Pilot Flying J, Love's, TA/Petro)
        if success and isinstance(response, list):
            chains = [credit.get('chain') for credit in response]
            expected_chains = ['pilot_flying_j', 'loves', 'ta_petro']
            found_chains = [chain for chain in expected_chains if chain in chains]
            self.log_test(
                "Shower Credits - Expected Chains",
                len(found_chains) == 3,
                f"Found {len(found_chains)}/3 expected chains: {found_chains}" if len(found_chains) > 0 else "No expected chains found",
                {"expected": expected_chains, "found": chains} if len(found_chains) != 3 else None
            )
        
        # Test get shower totals
        success, response = self.make_request(
            'GET',
            f'/shower-credits/{driver_email}/total'
        )
        
        if success and isinstance(response, dict):
            total_showers = response.get('total_available_showers', 0)
            total_points = response.get('total_points', 0)
            chains_tracked = response.get('chains_tracked', 0)
            
            # Expected: 6 showers, 5250 points, 3 chains
            expected_showers = 6
            expected_points = 5250
            expected_chains = 3
            
            self.log_test(
                "Shower Credits - Total Showers",
                total_showers == expected_showers,
                f"Expected {expected_showers} showers, got {total_showers}",
                response if total_showers != expected_showers else None
            )
            
            self.log_test(
                "Shower Credits - Total Points",
                total_points == expected_points,
                f"Expected {expected_points} points, got {total_points}",
                response if total_points != expected_points else None
            )
            
            self.log_test(
                "Shower Credits - Chains Count",
                chains_tracked == expected_chains,
                f"Expected {expected_chains} chains, got {chains_tracked}",
                response if chains_tracked != expected_chains else None
            )
        else:
            self.log_test(
                "Get Shower Totals",
                False,
                "Failed to get shower totals",
                response
            )

    def test_broker_ratings_endpoints(self):
        """Test broker ratings endpoints"""
        print("\n📊 Testing Broker Ratings Endpoints...")
        
        # Test get broker ratings for ABC Logistics
        broker_name = "ABC"
        success, response = self.make_request(
            'GET',
            f'/brokers/ratings/{broker_name}'
        )
        ratings_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Get Broker Ratings - ABC",
            success,
            f"Retrieved {ratings_count} ratings for ABC Logistics" if success else "Failed to get ABC Logistics ratings",
            response if not success else None
        )
        
        # Test get broker summary for ABC Logistics
        success, response = self.make_request(
            'GET',
            f'/brokers/summary/{broker_name}'
        )
        
        if success and isinstance(response, dict):
            avg_rating = response.get('average_rating', 0)
            total_reviews = response.get('total_reviews', 0)
            broker_name_resp = response.get('broker_name', '')
            
            # Expected: 5.0 rating for ABC Logistics
            expected_rating = 5.0
            
            self.log_test(
                "Broker Summary - ABC Rating",
                avg_rating == expected_rating,
                f"Expected {expected_rating} rating, got {avg_rating} for {broker_name_resp}",
                response if avg_rating != expected_rating else None
            )
            
            self.log_test(
                "Broker Summary - ABC Reviews Count",
                total_reviews > 0,
                f"Found {total_reviews} reviews for {broker_name_resp}",
                response if total_reviews == 0 else None
            )
        else:
            self.log_test(
                "Get Broker Summary - ABC",
                False,
                "Failed to get ABC Logistics summary",
                response
            )
        
        # Test search for "Quick Freight" - should show fraud alert
        fraud_broker = "Quick Freight"
        success, response = self.make_request(
            'GET',
            f'/brokers/ratings/{fraud_broker}'
        )
        
        if success and isinstance(response, list):
            fraud_reports = [rating for rating in response if rating.get('fraud_reported', False)]
            self.log_test(
                "Broker Ratings - Quick Freight Fraud Alert",
                len(fraud_reports) > 0,
                f"Found {len(fraud_reports)} fraud reports for {fraud_broker}" if len(fraud_reports) > 0 else f"No fraud reports found for {fraud_broker}",
                {"total_ratings": len(response), "fraud_reports": len(fraud_reports)} if len(fraud_reports) == 0 else None
            )
        else:
            self.log_test(
                "Get Broker Ratings - Quick Freight",
                False,
                "Failed to get Quick Freight ratings",
                response
            )

    def test_retail_parking_endpoints(self):
        """Test retail parking endpoints"""
        print("\n🏪 Testing Retail Parking Endpoints...")
        
        # Test get all retail parking locations
        success, response = self.make_request(
            'GET',
            '/retail-parking'
        )
        locations_count = len(response) if success and isinstance(response, list) else 0
        
        # Expected: 5 retail parking locations
        expected_locations = 5
        self.log_test(
            "Get Retail Parking Locations",
            success and locations_count == expected_locations,
            f"Expected {expected_locations} locations, got {locations_count}" if success else "Failed to get retail parking locations",
            response if not success or locations_count != expected_locations else None
        )
        
        # Verify we have expected chains (Walmart, Cracker Barrel, Cabela's)
        if success and isinstance(response, list):
            chains = [location.get('chain') for location in response]
            expected_chains = ['walmart', 'cracker_barrel', 'cabelas']
            found_chains = [chain for chain in expected_chains if chain in chains]
            self.log_test(
                "Retail Parking - Expected Chains",
                len(found_chains) >= 2,  # At least 2 of the 3 expected chains
                f"Found {len(found_chains)}/3 expected chains: {found_chains}",
                {"expected": expected_chains, "found": list(set(chains))} if len(found_chains) < 2 else None
            )
        
        # Test filter by Walmart chain
        success, response = self.make_request(
            'GET',
            '/retail-parking',
            params={"chain": "walmart"}
        )
        walmart_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Filter Retail Parking - Walmart",
            success,
            f"Found {walmart_count} Walmart locations" if success else "Failed to filter by Walmart",
            response if not success else None
        )
        
        # Verify all returned locations are Walmart
        if success and isinstance(response, list) and walmart_count > 0:
            all_walmart = all(location.get('chain') == 'walmart' for location in response)
            self.log_test(
                "Walmart Filter Accuracy",
                all_walmart,
                f"All {walmart_count} locations are Walmart" if all_walmart else "Some non-Walmart locations returned",
                [loc.get('chain') for loc in response] if not all_walmart else None
            )
        
        # Test get retail chains
        success, response = self.make_request(
            'GET',
            '/retail-parking/chains'
        )
        
        if success and isinstance(response, dict) and 'chains' in response:
            chains_list = response['chains']
            chains_count = len(chains_list)
            self.log_test(
                "Get Retail Chains",
                chains_count > 0,
                f"Retrieved {chains_count} available chains",
                response if chains_count == 0 else None
            )
            
            # Verify expected chains are in the list
            chain_ids = [chain.get('id') for chain in chains_list]
            expected_chain_ids = ['walmart', 'cracker_barrel', 'cabelas']
            found_expected = [chain_id for chain_id in expected_chain_ids if chain_id in chain_ids]
            self.log_test(
                "Retail Chains - Expected Chains Available",
                len(found_expected) >= 2,
                f"Found {len(found_expected)}/3 expected chains in available list: {found_expected}",
                {"expected": expected_chain_ids, "available": chain_ids} if len(found_expected) < 2 else None
            )
        else:
            self.log_test(
                "Get Retail Chains",
                False,
                "Failed to get retail chains list",
                response
            )

    def test_loads_endpoints(self):
        """Test load board endpoints"""
        print("\n📦 Testing Load Board Endpoints...")
        
        # Test get all loads
        success, response = self.make_request('GET', '/loads')
        loads_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Get All Loads",
            success,
            f"Retrieved {loads_count} loads" if success else "Failed to get loads",
            response if not success else None
        )
        
        # Test filter by equipment type
        if loads_count > 0:
            success, response = self.make_request(
                'GET',
                '/loads',
                params={"equipment_type": "dry_van"}
            )
            filtered_count = len(response) if success and isinstance(response, list) else 0
            self.log_test(
                "Filter Loads by Equipment Type",
                success,
                f"Found {filtered_count} dry van loads" if success else "Failed to filter loads",
                response if not success else None
            )

    def test_subscription_plans_endpoints(self):
        """Test subscription plans endpoints - NEW FEATURE"""
        print("\n💳 Testing Subscription Plans Endpoints...")
        
        # Test get subscription plans
        success, response = self.make_request('GET', '/subscriptions/plans')
        plans_count = len(response) if success and isinstance(response, list) else 0
        
        # Expected: 3 plans (Free, Pro Driver $9.99, Premium Fleet $24.99)
        expected_plans = 3
        self.log_test(
            "Get Subscription Plans",
            success and plans_count == expected_plans,
            f"Expected {expected_plans} plans, got {plans_count}" if success else "Failed to get subscription plans",
            response if not success or plans_count != expected_plans else None
        )
        
        # Verify plan details if we got the plans
        if success and isinstance(response, list) and plans_count > 0:
            plan_names = [plan.get('name', '') for plan in response]
            expected_plan_names = ['Free', 'Pro Driver', 'Premium Fleet']
            
            # Check for Free plan
            free_plan = next((p for p in response if 'free' in p.get('name', '').lower()), None)
            self.log_test(
                "Subscription Plans - Free Plan Available",
                free_plan is not None,
                f"Found Free plan: {free_plan.get('name') if free_plan else 'Not found'}",
                {"available_plans": plan_names} if not free_plan else None
            )
            
            # Check for Pro Driver plan ($9.99)
            pro_plan = next((p for p in response if 'pro' in p.get('name', '').lower() and p.get('price') == 9.99), None)
            self.log_test(
                "Subscription Plans - Pro Driver Plan",
                pro_plan is not None,
                f"Found Pro Driver plan at $9.99: {pro_plan.get('name') if pro_plan else 'Not found'}",
                {"available_plans": [(p.get('name'), p.get('price')) for p in response]} if not pro_plan else None
            )
            
            # Check for Premium Fleet plan ($24.99)
            premium_plan = next((p for p in response if 'premium' in p.get('name', '').lower() and p.get('price') == 24.99), None)
            self.log_test(
                "Subscription Plans - Premium Fleet Plan",
                premium_plan is not None,
                f"Found Premium Fleet plan at $24.99: {premium_plan.get('name') if premium_plan else 'Not found'}",
                {"available_plans": [(p.get('name'), p.get('price')) for p in response]} if not premium_plan else None
            )
        
        # Test get user subscription
        driver_email = "driver@test.com"
        success, response = self.make_request(
            'GET',
            f'/subscriptions/user/{driver_email}'
        )
        self.log_test(
            "Get User Subscription",
            success,
            f"Retrieved subscription info for {driver_email}" if success else "Failed to get user subscription",
            response if not success else None
        )
        
        # Test create checkout for free plan
        success, response = self.make_request(
            'POST',
            f'/subscriptions/create-checkout?plan_id=free&user_email={driver_email}'
        )
        self.log_test(
            "Create Free Plan Checkout",
            success,
            "Successfully activated free plan" if success else "Failed to activate free plan",
            response if not success else None
        )

    def test_trip_calculator_endpoints(self):
        """Test trip calculator endpoints - NEW FEATURE"""
        print("\n🧮 Testing Trip Calculator Endpoints...")
        
        driver_email = "driver@test.com"
        load_id = "load-001"  # Test load ID from requirements
        
        # Test trip profit calculation
        success, response = self.make_request(
            'POST',
            f'/calculator/trip-profit?load_id={load_id}&driver_email={driver_email}'
        )
        
        if success and isinstance(response, dict):
            required_fields = ['load_id', 'load_rate', 'distance', 'estimated_fuel_cost', 
                             'toll_cost', 'parking_cost', 'total_expenses', 'net_profit', 
                             'profit_per_mile', 'is_profitable']
            
            missing_fields = [field for field in required_fields if field not in response]
            
            self.log_test(
                "Trip Profit Calculation",
                len(missing_fields) == 0,
                f"Calculation completed with all required fields" if len(missing_fields) == 0 else f"Missing fields: {missing_fields}",
                response if len(missing_fields) > 0 else None
            )
            
            # Verify calculation makes sense
            if len(missing_fields) == 0:
                net_profit = response.get('net_profit', 0)
                total_expenses = response.get('total_expenses', 0)
                load_rate = response.get('load_rate', 0)
                
                calculated_profit = load_rate - total_expenses
                profit_matches = abs(net_profit - calculated_profit) < 0.01  # Allow for rounding
                
                self.log_test(
                    "Trip Profit Calculation - Math Accuracy",
                    profit_matches,
                    f"Net profit calculation correct: ${net_profit:.2f}" if profit_matches else f"Math error: Expected ${calculated_profit:.2f}, got ${net_profit:.2f}",
                    {"load_rate": load_rate, "total_expenses": total_expenses, "calculated": calculated_profit, "returned": net_profit} if not profit_matches else None
                )
        else:
            self.log_test(
                "Trip Profit Calculation",
                False,
                "Failed to calculate trip profit",
                response
            )

    def test_convoy_endpoints(self):
        """Test convoy endpoints - NEW FEATURE"""
        print("\n🚛 Testing Convoy Endpoints...")
        
        # Test get convoy posts
        success, response = self.make_request('GET', '/convoy/posts')
        posts_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Get Convoy Posts",
            success,
            f"Retrieved {posts_count} convoy posts" if success else "Failed to get convoy posts",
            response if not success else None
        )
        
        # Test get chat messages for General location
        success, response = self.make_request('GET', '/chat/General')
        messages_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Get Chat Messages - General",
            success,
            f"Retrieved {messages_count} chat messages for General location" if success else "Failed to get chat messages",
            response if not success else None
        )

    def test_compliance_detention_endpoints(self):
        """Test compliance and detention endpoints - NEW FEATURE"""
        print("\n📋 Testing Compliance & Detention Endpoints...")
        
        driver_email = "driver@test.com"
        
        # Test get compliance info
        success, response = self.make_request(
            'GET',
            f'/compliance/{driver_email}'
        )
        
        # Should return compliance info or "No compliance data found"
        compliance_found = success and isinstance(response, dict)
        no_data_message = success and isinstance(response, dict) and response.get('message') == "No compliance data found"
        
        self.log_test(
            "Get Compliance Info",
            success and (compliance_found or no_data_message),
            "Retrieved compliance info" if compliance_found else "No compliance data found (expected)" if no_data_message else "Failed to get compliance info",
            response if not success and not no_data_message else None
        )
        
        # Test get detention claims
        success, response = self.make_request(
            'GET',
            f'/detention/{driver_email}'
        )
        claims_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "Get Detention Claims",
            success,
            f"Retrieved {claims_count} detention claims" if success else "Failed to get detention claims",
            response if not success else None
        )
        
        # Test get detention totals
        success, response = self.make_request(
            'GET',
            f'/detention/{driver_email}/total'
        )
        
        if success and isinstance(response, dict):
            required_fields = ['total_pending', 'total_paid', 'total_claims']
            missing_fields = [field for field in required_fields if field not in response]
            
            self.log_test(
                "Get Detention Totals",
                len(missing_fields) == 0,
                f"Retrieved detention totals with all fields" if len(missing_fields) == 0 else f"Missing fields: {missing_fields}",
                response if len(missing_fields) > 0 else None
            )
            
            if len(missing_fields) == 0:
                total_pending = response.get('total_pending', 0)
                total_paid = response.get('total_paid', 0)
                total_claims = response.get('total_claims', 0)
                
                self.log_test(
                    "Detention Totals - Data Structure",
                    isinstance(total_pending, (int, float)) and isinstance(total_paid, (int, float)) and isinstance(total_claims, int),
                    f"Pending: ${total_pending}, Paid: ${total_paid}, Claims: {total_claims}",
                    response if not all(isinstance(v, (int, float)) for v in [total_pending, total_paid, total_claims]) else None
                )
        else:
            self.log_test(
                "Get Detention Totals",
                False,
                "Failed to get detention totals",
                response
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
        print("🚛 Starting TrukAll API Testing...")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        try:
            self.test_auth_endpoints()
            self.test_parking_spots_endpoints()
            self.test_booking_endpoints()
            self.test_payment_endpoints()
            self.test_shower_credits_endpoints()
            self.test_broker_ratings_endpoints()
            self.test_retail_parking_endpoints()
            self.test_loads_endpoints()
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
    tester = TrukAllAPITester()
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