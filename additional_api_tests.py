#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta

class AdditionalAPITester:
    def __init__(self, base_url="https://roadmates-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data=None):
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

    def make_request(self, method: str, endpoint: str, data=None, params=None, expected_status: int = 200):
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

    def test_missing_endpoints(self):
        """Test endpoints that were missing from the main test"""
        print("\n🔍 Testing Additional API Endpoints...")
        
        driver_email = "driver@test.com"
        
        # Test POST /api/brokers/ratings (create rating)
        print("\n📊 Testing Broker Rating Creation...")
        broker_rating_data = {
            "broker_name": "Test Broker",
            "mc_number": "MC123456",
            "rating": 4,
            "payment_rating": 4,
            "communication_rating": 4,
            "load_accuracy_rating": 4,
            "would_work_again": True,
            "payment_days": 30,
            "fraud_reported": False,
            "comment": "Good broker to work with"
        }
        
        success, response = self.make_request(
            'POST',
            f'/brokers/ratings?driver_email={driver_email}',
            broker_rating_data
        )
        self.log_test(
            "Create Broker Rating",
            success,
            "Successfully created broker rating" if success else "Failed to create broker rating",
            response if not success else None
        )

        # Test POST /api/compliance (create compliance record)
        print("\n📋 Testing DOT Compliance Creation...")
        compliance_data = {
            "cdl_expiry": (datetime.now() + timedelta(days=365)).isoformat(),
            "medical_card_expiry": (datetime.now() + timedelta(days=180)).isoformat(),
            "hazmat_expiry": (datetime.now() + timedelta(days=730)).isoformat()
        }
        
        success, response = self.make_request(
            'POST',
            f'/compliance?driver_email={driver_email}',
            compliance_data
        )
        self.log_test(
            "Create DOT Compliance Record",
            success,
            "Successfully created compliance record" if success else "Failed to create compliance record",
            response if not success else None
        )

        # Test POST /api/detention (create claim)
        print("\n💰 Testing Detention Claim Creation...")
        detention_data = {
            "broker_name": "Test Broker",
            "detention_hours": 4.5,
            "hourly_rate": 50.0,
            "location": "Dallas, TX",
            "start_time": (datetime.now() - timedelta(hours=5)).isoformat(),
            "end_time": (datetime.now() - timedelta(minutes=30)).isoformat()
        }
        
        success, response = self.make_request(
            'POST',
            f'/detention?driver_email={driver_email}',
            detention_data
        )
        self.log_test(
            "Create Detention Claim",
            success,
            "Successfully created detention claim" if success else "Failed to create detention claim",
            response if not success else None
        )

        # Test POST /api/convoy/posts (create post)
        print("\n🚛 Testing Convoy Post Creation...")
        convoy_data = {
            "origin_city": "Dallas",
            "origin_state": "TX",
            "destination_city": "Houston",
            "destination_state": "TX",
            "departure_date": (datetime.now() + timedelta(days=2)).isoformat(),
            "message": "Looking for convoy partners for Dallas to Houston run",
            "max_drivers": 5
        }
        
        success, response = self.make_request(
            'POST',
            f'/convoy/posts?driver_email={driver_email}',
            convoy_data
        )
        self.log_test(
            "Create Convoy Post",
            success,
            "Successfully created convoy post" if success else "Failed to create convoy post",
            response if not success else None
        )

        # Test POST /api/subscriptions/activate
        print("\n💳 Testing Subscription Activation...")
        success, response = self.make_request(
            'POST',
            f'/subscriptions/activate?plan_id=pro_driver&user_email={driver_email}'
        )
        self.log_test(
            "Activate Subscription",
            success,
            "Successfully activated subscription" if success else "Failed to activate subscription",
            response if not success else None
        )

    def test_emergency_endpoints(self):
        """Test emergency SOS endpoints"""
        print("\n🚨 Testing Emergency SOS Endpoints...")
        
        driver_email = "driver@test.com"
        
        # Test GET /api/emergency/contacts/{email}
        success, response = self.make_request(
            'GET',
            f'/emergency/contacts/{driver_email}'
        )
        self.log_test(
            "Get Emergency Contacts",
            success,
            f"Retrieved emergency contacts" if success else "Failed to get emergency contacts",
            response if not success else None
        )

        # Test POST /api/emergency/contacts
        contact_data = {
            "name": "Emergency Contact",
            "phone": "555-911-0000",
            "relationship": "spouse"
        }
        
        success, response = self.make_request(
            'POST',
            f'/emergency/contacts?driver_email={driver_email}',
            contact_data
        )
        self.log_test(
            "Create Emergency Contact",
            success,
            "Successfully created emergency contact" if success else "Failed to create emergency contact",
            response if not success else None
        )

        # Test POST /api/emergency/sos
        sos_data = {
            "latitude": 32.7767,
            "longitude": -96.7970,
            "emergency_type": "breakdown",
            "description": "Engine failure on I-35"
        }
        
        success, response = self.make_request(
            'POST',
            f'/emergency/sos?driver_email={driver_email}',
            sos_data
        )
        self.log_test(
            "Create Emergency SOS",
            success,
            "Successfully created emergency SOS" if success else "Failed to create emergency SOS",
            response if not success else None
        )

    def test_documents_endpoints(self):
        """Test documents endpoints"""
        print("\n📄 Testing Documents Endpoints...")
        
        driver_email = "driver@test.com"
        
        # Test GET /api/documents/{email}
        success, response = self.make_request(
            'GET',
            f'/documents/{driver_email}'
        )
        self.log_test(
            "Get Driver Documents",
            success,
            f"Retrieved driver documents" if success else "Failed to get driver documents",
            response if not success else None
        )

        # Test POST /api/documents/scan
        scan_data = {
            "document_type": "cdl",
            "image_data": "base64_encoded_image_data_here"
        }
        
        success, response = self.make_request(
            'POST',
            f'/documents/scan?driver_email={driver_email}',
            scan_data
        )
        self.log_test(
            "Scan Document",
            success,
            "Successfully scanned document" if success else "Failed to scan document",
            response if not success else None
        )

    def test_fuel_prices_endpoints(self):
        """Test fuel prices endpoints"""
        print("\n⛽ Testing Fuel Prices Endpoints...")
        
        # Test GET /api/fuel/prices
        success, response = self.make_request(
            'GET',
            '/fuel/prices'
        )
        self.log_test(
            "Get Fuel Prices",
            success,
            f"Retrieved fuel prices" if success else "Failed to get fuel prices",
            response if not success else None
        )

        # Test GET /api/fuel/prices/cheapest
        success, response = self.make_request(
            'GET',
            '/fuel/prices/cheapest'
        )
        self.log_test(
            "Get Cheapest Fuel Prices",
            success,
            f"Retrieved cheapest fuel prices" if success else "Failed to get cheapest fuel prices",
            response if not success else None
        )

        # Test GET /api/fuel/average
        success, response = self.make_request(
            'GET',
            '/fuel/average'
        )
        self.log_test(
            "Get Average Fuel Price",
            success,
            f"Retrieved average fuel price" if success else "Failed to get average fuel price",
            response if not success else None
        )

        # Test POST /api/fuel/prices/report
        fuel_report_data = {
            "station_name": "Test Station",
            "address": "123 Highway St",
            "city": "Dallas",
            "state": "TX",
            "diesel_price": 3.89,
            "unleaded_price": 3.29
        }
        
        success, response = self.make_request(
            'POST',
            '/fuel/prices/report?driver_email=driver@test.com',
            fuel_report_data
        )
        self.log_test(
            "Report Fuel Prices",
            success,
            "Successfully reported fuel prices" if success else "Failed to report fuel prices",
            response if not success else None
        )

    def run_additional_tests(self):
        """Run all additional test suites"""
        print("🔍 Starting Additional TrukAll API Testing...")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        try:
            self.test_missing_endpoints()
            self.test_emergency_endpoints()
            self.test_documents_endpoints()
            self.test_fuel_prices_endpoints()
            
        except Exception as e:
            print(f"\n❌ Additional test suite failed with error: {str(e)}")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 ADDITIONAL TESTS SUMMARY")
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
    tester = AdditionalAPITester()
    success = tester.run_additional_tests()
    
    # Save detailed results
    with open('/app/additional_test_results.json', 'w') as f:
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
    import sys
    sys.exit(main())