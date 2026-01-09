#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta

class CorrectedAPITester:
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

    def test_corrected_endpoints(self):
        """Test endpoints with correct signatures"""
        print("\n🔧 Testing Corrected API Endpoints...")
        
        driver_email = "driver@test.com"
        
        # Test POST /api/brokers/rate (correct endpoint)
        print("\n📊 Testing Broker Rating Creation (Corrected)...")
        broker_rating_data = {
            "broker_name": "Test Broker Corrected",
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
            f'/brokers/rate?driver_email={driver_email}',
            broker_rating_data
        )
        self.log_test(
            "Create Broker Rating (Corrected)",
            success,
            "Successfully created broker rating" if success else "Failed to create broker rating",
            response if not success else None
        )

        # Test POST /api/emergency/sos (corrected with query params)
        print("\n🚨 Testing Emergency SOS Creation (Corrected)...")
        success, response = self.make_request(
            'POST',
            f'/emergency/sos?driver_email={driver_email}&emergency_type=breakdown&location_lat=32.7767&location_lng=-96.7970&location_address=Dallas, TX&message=Engine failure on I-35'
        )
        self.log_test(
            "Create Emergency SOS (Corrected)",
            success,
            "Successfully created emergency SOS" if success else "Failed to create emergency SOS",
            response if not success else None
        )

        # Test POST /api/emergency/contacts (corrected with query params)
        print("\n📞 Testing Emergency Contact Creation (Corrected)...")
        success, response = self.make_request(
            'POST',
            f'/emergency/contacts?driver_email={driver_email}&name=Emergency Contact&phone=555-911-0000&relationship=spouse&is_primary=true'
        )
        self.log_test(
            "Create Emergency Contact (Corrected)",
            success,
            "Successfully created emergency contact" if success else "Failed to create emergency contact",
            response if not success else None
        )

        # Test POST /api/documents/scan (corrected with query params)
        print("\n📄 Testing Document Scan (Corrected)...")
        success, response = self.make_request(
            'POST',
            f'/documents/scan?driver_email={driver_email}&doc_type=cdl&title=CDL License&notes=Current CDL license'
        )
        self.log_test(
            "Scan Document (Corrected)",
            success,
            "Successfully scanned document" if success else "Failed to scan document",
            response if not success else None
        )

        # Test POST /api/fuel/prices/report (corrected with query params)
        print("\n⛽ Testing Fuel Price Report (Corrected)...")
        success, response = self.make_request(
            'POST',
            f'/fuel/prices/report?station_name=Test Station&chain=pilot&city=Dallas&state=TX&diesel_price=3.89&driver_email={driver_email}&latitude=32.7767&longitude=-96.7970'
        )
        self.log_test(
            "Report Fuel Prices (Corrected)",
            success,
            "Successfully reported fuel prices" if success else "Failed to report fuel prices",
            response if not success else None
        )

        # Test subscription activation (check if endpoint exists)
        print("\n💳 Testing Subscription Activation...")
        success, response = self.make_request(
            'POST',
            f'/subscriptions/activate?plan_id=free&user_email={driver_email}',
            expected_status=404  # Expect 404 if endpoint doesn't exist
        )
        
        if response.get('detail') == 'Not Found':
            self.log_test(
                "Subscription Activation Endpoint",
                False,
                "Endpoint /subscriptions/activate not implemented - using create-checkout instead"
            )
        else:
            self.log_test(
                "Subscription Activation",
                success,
                "Successfully activated subscription" if success else "Failed to activate subscription",
                response if not success else None
            )

    def run_corrected_tests(self):
        """Run all corrected test suites"""
        print("🔧 Starting Corrected TrukAll API Testing...")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        try:
            self.test_corrected_endpoints()
            
        except Exception as e:
            print(f"\n❌ Corrected test suite failed with error: {str(e)}")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 CORRECTED TESTS SUMMARY")
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
    tester = CorrectedAPITester()
    success = tester.run_corrected_tests()
    
    # Save detailed results
    with open('/app/corrected_test_results.json', 'w') as f:
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