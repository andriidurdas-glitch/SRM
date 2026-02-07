import requests
import sys
from datetime import datetime, date
import json

class FootballCRMTester:
    def __init__(self, base_url="https://football-manager-173.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.player_id = None
        self.group_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return success, response.json() if response.content else {}
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200] if response.text else "No response"
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            return success, response.json() if response.content and success else {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_login(self):
        """Test authentication endpoint"""
        success, response = self.run_test(
            "Auth Login (Valid Credentials)",
            "POST",
            "api/auth/login",
            200,
            data={"username": "coach", "password": "coach123"}
        )
        if not success:
            return False
            
        # Test invalid credentials
        success2, _ = self.run_test(
            "Auth Login (Invalid Credentials)",
            "POST", 
            "api/auth/login",
            401,
            data={"username": "wrong", "password": "wrong"}
        )
        return success and success2

    def test_groups_crud(self):
        """Test groups CRUD operations"""
        # Create group
        success, response = self.run_test(
            "Create Group",
            "POST",
            "api/groups",
            200,
            data={
                "name": "Тест U-12",
                "schedule": "Пн, Ср, Пт 18:00-19:30",
                "description": "Тестова група для дітей до 12 років"
            }
        )
        if not success:
            return False
        
        self.group_id = response.get('id')
        print(f"   Created group ID: {self.group_id}")

        # Get all groups
        success, _ = self.run_test(
            "Get All Groups",
            "GET",
            "api/groups",
            200
        )

        # Get specific group
        if self.group_id:
            success2, _ = self.run_test(
                "Get Specific Group",
                "GET",
                f"api/groups/{self.group_id}",
                200
            )
        
            # Update group
            success3, _ = self.run_test(
                "Update Group",
                "PUT",
                f"api/groups/{self.group_id}",
                200,
                data={
                    "name": "Оновлена Тест U-12",
                    "schedule": "Пн, Ср, Пт 17:00-18:30",
                    "description": "Оновлений опис групи"
                }
            )
        else:
            success2 = success3 = True

        return success and success2 and success3

    def test_players_crud(self):
        """Test players CRUD operations"""
        # Create player
        success, response = self.run_test(
            "Create Player",
            "POST",
            "api/players",
            200,
            data={
                "full_name": "Іван Тестенко",
                "birth_year": 2010,
                "parent_contact": "+380501234567",
                "group_id": self.group_id if self.group_id else None,
                "notes": "Тестовий гравець"
            }
        )
        if not success:
            return False
        
        self.player_id = response.get('id')
        print(f"   Created player ID: {self.player_id}")

        # Get all players
        success, _ = self.run_test(
            "Get All Players",
            "GET",
            "api/players",
            200
        )

        # Get specific player
        if self.player_id:
            success2, _ = self.run_test(
                "Get Specific Player",
                "GET",
                f"api/players/{self.player_id}",
                200
            )
        
            # Update player
            success3, _ = self.run_test(
                "Update Player",
                "PUT",
                f"api/players/{self.player_id}",
                200,
                data={
                    "full_name": "Іван Оновлений Тестенко",
                    "birth_year": 2010,
                    "parent_contact": "+380501234567",
                    "group_id": self.group_id if self.group_id else None,
                    "notes": "Оновлені нотатки"
                }
            )
        else:
            success2 = success3 = True

        return success and success2 and success3

    def test_attendance(self):
        """Test attendance functionality"""
        if not self.player_id or not self.group_id:
            print("⚠️ Skipping attendance test - missing player or group")
            return True

        today = date.today().isoformat()
        
        # Create attendance record
        success, _ = self.run_test(
            "Create Attendance Record",
            "POST",
            "api/attendance",
            200,
            data={
                "player_id": self.player_id,
                "group_id": self.group_id,
                "date": today,
                "status": "present",
                "notes": "Тестова відвідуваність"
            }
        )

        # Get attendance
        success2, _ = self.run_test(
            "Get Attendance",
            "GET",
            "api/attendance",
            200,
            params={"group_id": self.group_id, "date": today}
        )

        return success and success2

    def test_payments(self):
        """Test payments functionality"""
        if not self.player_id:
            print("⚠️ Skipping payments test - missing player")
            return True

        current_month = date.today().strftime("%Y-%m")
        
        # Create payment
        success, _ = self.run_test(
            "Create Payment",
            "POST",
            "api/payments",
            200,
            data={
                "player_id": self.player_id,
                "amount": 500.0,
                "month": current_month,
                "payment_date": date.today().isoformat(),
                "notes": "Тестова оплата"
            }
        )

        # Get payments
        success2, _ = self.run_test(
            "Get Payments",
            "GET",
            "api/payments",
            200,
            params={"month": current_month}
        )

        return success and success2

    def test_sessions(self):
        """Test training sessions functionality"""
        if not self.group_id:
            print("⚠️ Skipping sessions test - missing group")
            return True

        today = date.today().isoformat()
        
        # Create session
        success, _ = self.run_test(
            "Create Training Session",
            "POST",
            "api/sessions",
            200,
            data={
                "group_id": self.group_id,
                "date": today,
                "start_time": "18:00",
                "end_time": "19:30",
                "location": "Стадіон Центральний",
                "notes": "Тестове тренування"
            }
        )

        # Get sessions
        success2, _ = self.run_test(
            "Get Training Sessions",
            "GET",
            "api/sessions",
            200,
            params={"group_id": self.group_id, "date": today}
        )

        return success and success2

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Get Dashboard Statistics",
            "GET",
            "api/statistics/dashboard",
            200
        )
        
        if success and response:
            required_fields = ['total_players', 'total_groups', 'today_attendance', 'month_revenue']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in dashboard stats: {field}")
                    return False
            print(f"   Stats: Players={response.get('total_players')}, Groups={response.get('total_groups')}")
        
        return success

    def test_player_statistics(self):
        """Test player statistics endpoint"""
        if not self.player_id:
            print("⚠️ Skipping player statistics test - missing player")
            return True

        success, response = self.run_test(
            "Get Player Statistics",
            "GET",
            f"api/statistics/player/{self.player_id}",
            200
        )
        
        if success and response:
            required_fields = ['player_id', 'total_sessions', 'present_count', 'absent_count', 'attendance_rate', 'total_paid', 'payment_count']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in player stats: {field}")
                    return False
            print(f"   Player Stats: Attendance={response.get('attendance_rate')}%, Paid={response.get('total_paid')}₴")
        
        return success

    def test_group_statistics(self):
        """Test group statistics endpoint"""
        if not self.group_id:
            print("⚠️ Skipping group statistics test - missing group")
            return True

        success, response = self.run_test(
            "Get Group Statistics",
            "GET",
            f"api/statistics/group/{self.group_id}",
            200
        )
        
        if success and response:
            required_fields = ['group_id', 'player_count', 'total_sessions', 'total_attendance_records', 'present_count', 'absent_count', 'attendance_rate', 'total_revenue', 'player_stats']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in group stats: {field}")
                    return False
            print(f"   Group Stats: Attendance={response.get('attendance_rate')}%, Revenue={response.get('total_revenue')}₴")
            print(f"   Player rankings: {len(response.get('player_stats', []))} players")
        
        return success

    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete player
        if self.player_id:
            success, _ = self.run_test(
                "Delete Test Player",
                "DELETE",
                f"api/players/{self.player_id}",
                200
            )
        
        # Delete group
        if self.group_id:
            success, _ = self.run_test(
                "Delete Test Group", 
                "DELETE",
                f"api/groups/{self.group_id}",
                200
            )

def main():
    print("🚀 Starting Football CRM Backend API Tests...")
    tester = FootballCRMTester()

    try:
        # Test all endpoints
        auth_success = tester.test_auth_login()
        groups_success = tester.test_groups_crud()
        players_success = tester.test_players_crud()
        attendance_success = tester.test_attendance()
        payments_success = tester.test_payments()
        sessions_success = tester.test_sessions()
        stats_success = tester.test_dashboard_stats()

        # Print results
        print(f"\n📊 Test Results:")
        print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
        print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
        
        if tester.failed_tests:
            print(f"\n❌ Failed tests:")
            for failure in tester.failed_tests:
                print(f"  • {failure.get('test', 'Unknown')}: {failure}")

        # Cleanup
        tester.cleanup()
        
        return 0 if tester.tests_passed == tester.tests_run else 1

    except Exception as e:
        print(f"💥 Test suite failed with error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())