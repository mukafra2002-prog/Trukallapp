#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta

class FinalAPITester:
    def __init__(self, base_url="https://trucker-dash-3.preview.emergentagent.com"):
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

    def test_final_missing_endpoints(self):
        """Test the final missing endpoints with correct signatures"""
        print("\n🎯 Testing Final Missing API Endpoints...")
        
        driver_email = "driver@test.com"
        
        # Test POST /api/brokers/rate ✅ (already working)
        print("\n📊 Testing Broker Rating Creation...")
        broker_rating_data = {
            "broker_name": "Final Test Broker",
            "mc_number": "MC789012",
            "rating": 5,
            "payment_rating": 5,
            "communication_rating": 5,
            "load_accuracy_rating": 5,
            "would_work_again": True,
            "payment_days": 15,
            "fraud_reported": False,
            "comment": "Excellent broker, highly recommended"
        }
        
        success, response = self.make_request(
            'POST',
            f'/brokers/rate?driver_email={driver_email}',
            broker_rating_data
        )
        self.log_test(
            "POST /api/brokers/rate",
            success,
            "Successfully created broker rating" if success else "Failed to create broker rating",
            response if not success else None
        )

        # Test POST /api/emergency/sos (with body data)
        print("\n🚨 Testing Emergency SOS Creation (with body)...")
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
            "POST /api/emergency/sos",
            success,
            "Successfully created emergency SOS" if success else "Failed to create emergency SOS",
            response if not success else None
        )

        # Test POST /api/emergency/contacts ✅ (already working)
        print("\n📞 Testing Emergency Contact Creation...")
        success, response = self.make_request(
            'POST',
            f'/emergency/contacts?driver_email={driver_email}&name=Final Emergency Contact&phone=555-999-0000&relationship=family&is_primary=false'
        )
        self.log_test(
            "POST /api/emergency/contacts",
            success,
            "Successfully created emergency contact" if success else "Failed to create emergency contact",
            response if not success else None
        )

        # Test GET /api/emergency/contacts/{email} ✅ (already working)
        success, response = self.make_request(
            'GET',
            f'/emergency/contacts/{driver_email}'
        )
        contacts_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "GET /api/emergency/contacts/{email}",
            success,
            f"Retrieved {contacts_count} emergency contacts" if success else "Failed to get emergency contacts",
            response if not success else None
        )

        # Test POST /api/documents/scan ✅ (already working)
        print("\n📄 Testing Document Scan...")
        success, response = self.make_request(
            'POST',
            f'/documents/scan?driver_email={driver_email}&doc_type=medical_card&title=DOT Medical Card&notes=Current medical certificate'
        )
        self.log_test(
            "POST /api/documents/scan",
            success,
            "Successfully scanned document" if success else "Failed to scan document",
            response if not success else None
        )

        # Test GET /api/documents/{email} ✅ (already working)
        success, response = self.make_request(
            'GET',
            f'/documents/{driver_email}'
        )
        docs_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "GET /api/documents/{email}",
            success,
            f"Retrieved {docs_count} documents" if success else "Failed to get documents",
            response if not success else None
        )

        # Test POST /api/fuel/prices/report ✅ (already working)
        print("\n⛽ Testing Fuel Price Report...")
        success, response = self.make_request(
            'POST',
            f'/fuel/prices/report?station_name=Final Test Station&chain=loves&city=Houston&state=TX&diesel_price=3.79&driver_email={driver_email}&latitude=29.7604&longitude=-95.3698'
        )
        self.log_test(
            "POST /api/fuel/prices/report",
            success,
            "Successfully reported fuel prices" if success else "Failed to report fuel prices",
            response if not success else None
        )

        # Test GET /api/fuel/prices ✅ (already working)
        success, response = self.make_request(
            'GET',
            '/fuel/prices'
        )
        prices_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "GET /api/fuel/prices",
            success,
            f"Retrieved {prices_count} fuel prices" if success else "Failed to get fuel prices",
            response if not success else None
        )

        # Test GET /api/fuel/prices/cheapest ✅ (already working)
        success, response = self.make_request(
            'GET',
            '/fuel/prices/cheapest'
        )
        cheapest_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "GET /api/fuel/prices/cheapest",
            success,
            f"Retrieved {cheapest_count} cheapest fuel prices" if success else "Failed to get cheapest fuel prices",
            response if not success else None
        )

        # Test GET /api/fuel/average ✅ (already working)
        success, response = self.make_request(
            'GET',
            '/fuel/average'
        )
        avg_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "GET /api/fuel/average",
            success,
            f"Retrieved {avg_count} state averages" if success else "Failed to get fuel averages",
            response if not success else None
        )

        # Test POST /api/subscriptions/activate ✅ (working but was marked as fail due to wrong expected status)
        print("\n💳 Testing Subscription Activation...")
        success, response = self.make_request(
            'POST',
            f'/subscriptions/activate?plan_id=pro_driver&user_email={driver_email}'
        )
        self.log_test(
            "POST /api/subscriptions/activate",
            success,
            "Successfully activated subscription" if success else "Failed to activate subscription",
            response if not success else None
        )

        # Test POST /api/convoy/posts ✅ (already working from previous test)
        print("\n🚛 Testing Convoy Post Creation...")
        convoy_data = {
            "origin_city": "Austin",
            "origin_state": "TX",
            "destination_city": "San Antonio",
            "destination_state": "TX",
            "departure_date": (datetime.now() + timedelta(days=3)).isoformat(),
            "message": "Looking for convoy partners for Austin to San Antonio run",
            "max_drivers": 4
        }
        
        success, response = self.make_request(
            'POST',
            f'/convoy/posts?driver_email={driver_email}',
            convoy_data
        )
        self.log_test(
            "POST /api/convoy/posts",
            success,
            "Successfully created convoy post" if success else "Failed to create convoy post",
            response if not success else None
        )

        # Test GET /api/convoy/posts ✅ (already working)
        success, response = self.make_request(
            'GET',
            '/convoy/posts'
        )
        convoy_count = len(response) if success and isinstance(response, list) else 0
        self.log_test(
            "GET /api/convoy/posts",
            success,
            f"Retrieved {convoy_count} convoy posts" if success else "Failed to get convoy posts",
            response if not success else None
        )

        # Test POST /api/compliance ✅ (already working from previous test)
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
            "POST /api/compliance",
            success,
            "Successfully created compliance record" if success else "Failed to create compliance record",
            response if not success else None
        )

        # Test POST /api/detention ✅ (already working from previous test)
        print("\n💰 Testing Detention Claim Creation...")
        detention_data = {
            "broker_name": "Final Test Broker",
            "detention_hours": 3.0,
            "hourly_rate": 60.0,
            "location": "Houston, TX",
            "start_time": (datetime.now() - timedelta(hours=4)).isoformat(),
            "end_time": (datetime.now() - timedelta(hours=1)).isoformat()
        }
        
        success, response = self.make_request(
            'POST',
            f'/detention?driver_email={driver_email}',
            detention_data
        )
        self.log_test(
            "POST /api/detention",
            success,
            "Successfully created detention claim" if success else "Failed to create detention claim",
            response if not success else None
        )

    def run_final_tests(self):
        """Run all final test suites"""
        print("🎯 Starting Final TrukAll API Testing...")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        try:
            self.test_final_missing_endpoints()
            
        except Exception as e:
            print(f"\n❌ Final test suite failed with error: {str(e)}")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 FINAL TESTS SUMMARY")
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
        else:
            print(f"\n🎉 ALL TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = FinalAPITester()
    success = tester.run_final_tests()
    
    # Save detailed results
    with open('/app/final_test_results.json', 'w') as f:
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