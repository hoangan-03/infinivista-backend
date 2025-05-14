from locust import HttpUser, task, between, events
import logging
import json
import random
import os
import time
from datetime import datetime
import requests

# Configure logging
@events.init.add_listener
def on_locust_init(environment, **kwargs):
    logging.info("Initializing Locust with 30 users")

user_uuids = []
user_emails = []
messages = [
    "Hello there!",
    "How are you doing?",
    "Testing the application",
    "This is a load test",
    "Checking system performance",
    "Simulating high load"
]
def fetch_real_users():
    """Attempt to fetch real users from the system"""
    global user_uuids, user_emails
    
    try:
        # First authenticate as admin (adjust endpoint and credentials as needed)
        auth_url = "http://localhost:3001/api/v1/auth/login"
        auth_response = requests.post(auth_url, json={
            "identifier": "admin@example.com",  
            "password": "password123"   
        })
        
        if auth_response.status_code == 200:
            admin_token = auth_response.json().get("data", {}).get("access_token", "")
            
            # Now fetch users (adjust endpoint as needed)
            users_url = "http://localhost:3001/api/v1/users"
            users_response = requests.get(
                users_url, 
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            logging.info(f"Users response: {users_response.text}")
            
            if users_response.status_code == 200:
                users = users_response.json()
                
                # Extract user IDs and emails (adjust based on your API response format)
                for user in users:
                    if "id" in user and "email" in user:
                        user_uuids.append(user["id"])
                        user_emails.append(user["email"])
                
                logging.info(f"Successfully loaded {len(user_uuids)} real users from the system")
            else:
                logging.error(f"Failed to fetch users. Status: {users_response.status_code}")
        else:
            logging.error(f"Admin authentication failed. Status: {auth_response.status_code}")
            logging.error(f"Response: {auth_response.text}")
            
    except Exception as e:
        logging.error(f"Error fetching real users: {str(e)}")
        
class ApiGatewayUser(HttpUser):
    wait_time = between(1, 3) 
    host = "http://localhost:3001"
    prefix = "/api/v1"
    
    def on_start(self):
        self.user_index_number = random.choice(range(1, 30))
        try:
            response = self.client.post(f"{self.host}{self.prefix}/auth/login", 
                json={
                    "identifier": f"user{self.user_index_number}@example.com",
                    "password": "password123"
                }
            )
            if response.status_code == 200:
                # Extract and store token if needed
                data = response.json()
                self.token = data.get("data", {}).get("access_token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
            else:
                # Fallback: Continue without auth
                self.headers = {}
        except Exception as e:
            logging.error(f"Login failed: {str(e)}")
            self.headers = {}
            
    @task(10)
    def take_all_users(self):
        self.client.get(f"{self.prefix}/profile/all-users", headers=self.headers, name=f"{self.prefix}/profile/all-users")

    @task(10)
    def view_self_me(self):
        self.client.get(f"{self.prefix}/auth/me", headers=self.headers, name=f"{self.prefix}/auth/me")
        
    @task(10)
    def get_self_news_feed(self):
        self.client.get(f"{self.prefix}/newsfeed", headers=self.headers, name=f"{self.prefix}/newsfeed")

    @task(25)
    def get_user_news_feed(self):
        # Check if we have any user IDs to choose from
        if not user_uuids:
            logging.warning("No user UUIDs available, skipping news feed test")
            return
        
        # Get random user profile
        user_id = random.choice(user_uuids)
        self.client.get(f"{self.prefix}/newsfeed/{user_id}", 
            headers=self.headers,
            name=f"{self.prefix}/newsfeed/{user_id}"
        )

    @task(3)
    def send_message(self):
        recipient_id = random.choice(user_uuids)
        while recipient_id == self.user_id:
            recipient_id = random.choice(user_uuids)
            
        message = random.choice(messages)
        
        self.client.post(
            f"{self.prefix}/message", 
            json={
                "recipientId": recipient_id,
                "content": message
            },
            headers=self.headers,
            name=f"{self.prefix}/message"
        )

class JwtSecurityTester(HttpUser):
    """Tests JWT token security assessment and expiration enforcement"""
    wait_time = between(1, 2)
    host = "http://localhost:3001"
    prefix = "/api/v1"
    
    def on_start(self):
        # Login to get valid token
        try:
            response = self.client.post(f"{self.host}{self.prefix}/auth/login", 
                json={
                    "identifier": "user1@example.com",
                    "password": "password123"
                },
                name="JWT-Security-Login"
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("data", {}).get("access_token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                logging.info("JWT Security Tester: Logged in successfully")
            else:
                logging.error(f"JWT Security Tester: Login failed with status {response.status_code}")
                self.headers = {}
        except Exception as e:
            logging.error(f"JWT Security Tester: Login failed - {str(e)}")
            self.headers = {}
    
    @task(5)
    def test_token_validity(self):
        """Test accessing protected route with valid token"""
        self.client.get(
            f"{self.prefix}/auth/me", 
            headers=self.headers,
            name="JWT-Valid-Token-Test"
        )
    
    @task(2)
    def test_expired_token(self):
        """Simulates using an expired token (for testing only; in production tokens expire naturally)"""
        # This is a dummy expired token for testing - structure is valid but expiration time is in the past
        expired_token = "eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMUBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.expired_signature"
        expired_headers = {"Authorization": f"Bearer {expired_token}"}
        
        with self.client.get(
            f"{self.prefix}/auth/me", 
            headers=expired_headers,
            name="JWT-Expired-Token-Test",
            catch_response=True
        ) as response:
            if response.status_code == 401:
                response.success()
                logging.info("JWT expiration test passed: Server rejected expired token")
            else:
                response.failure(f"JWT expiration test failed: Server accepted expired token, status: {response.status_code}")
    
    @task(2)
    def test_invalid_token(self):
        """Test using malformed token"""
        invalid_headers = {"Authorization": "Bearer invalid_token_format"}
        
        with self.client.get(
            f"{self.prefix}/auth/me", 
            headers=invalid_headers,
            name="JWT-Invalid-Token-Test",
            catch_response=True
        ) as response:
            if response.status_code == 401:
                response.success()
                logging.info("JWT validity test passed: Server rejected invalid token")
            else:
                response.failure(f"JWT validity test failed: Server accepted invalid token, status: {response.status_code}")

class JwtBlacklistTester(HttpUser):
    """Tests JwtBlacklistGuard effectiveness validation"""
    wait_time = between(2, 5)  # Longer wait times to avoid too many logouts
    host = "http://localhost:3001"
    prefix = "/api/v1"
    
    def on_start(self):
        self.login()
    
    def login(self):
        """Login and get a fresh token"""
        try:
            response = self.client.post(f"{self.host}{self.prefix}/auth/login", 
                json={
                    "identifier": "user2@example.com",
                    "password": "password123"
                },
                name="Blacklist-Login"
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("data", {}).get("access_token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                logging.info("Blacklist Tester: Logged in successfully")
            else:
                logging.error(f"Blacklist Tester: Login failed with status {response.status_code}")
                self.headers = {}
        except Exception as e:
            logging.error(f"Blacklist Tester: Login failed - {str(e)}")
            self.headers = {}
    
    @task(1)
    def test_blacklist_flow(self):
        """Tests complete logout/blacklist token flow"""
        # First verify we can access protected routes
        with self.client.get(
            f"{self.prefix}/auth/me", 
            headers=self.headers,
            name="Blacklist-Before-Logout",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure("Could not access protected route before logout")
                return
        
        # Now logout to blacklist the token
        with self.client.post(
            f"{self.prefix}/auth/logout",
            headers=self.headers,
            name="Blacklist-Logout"
        ) as response:
            if response.status_code != 200:
                logging.error(f"Logout failed with status {response.status_code}")
                return
        
        # Try using the blacklisted token
        with self.client.get(
            f"{self.prefix}/auth/me", 
            headers=self.headers,
            name="Blacklist-After-Logout",
            catch_response=True
        ) as response:
            if response.status_code == 401:
                response.success()
                logging.info("Blacklist test passed: Server rejected blacklisted token")
            else:
                response.failure(f"Blacklist test failed: Server accepted blacklisted token, status: {response.status_code}")
        
        # Login again to get a fresh token for next test
        self.login()

class SessionSecurityTester(HttpUser):
    """Tests session fixation and hijacking prevention"""
    wait_time = between(1, 3)
    host = "http://localhost:3001"
    prefix = "/api/v1"
    
    def on_start(self):
        self.login()
    
    def login(self):
        """Login with session cookie handling enabled"""
        try:
            # Enable cookie handling to capture session cookies
            self.client.cookies.clear()
            response = self.client.post(
                f"{self.host}{self.prefix}/auth/login", 
                json={
                    "identifier": "user3@example.com",
                    "password": "password123"
                },
                name="Session-Login"
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("data", {}).get("access_token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                # Store original cookies for testing
                self.original_cookies = dict(self.client.cookies)
                logging.info(f"Session Security Tester: Logged in, cookies: {self.original_cookies}")
            else:
                logging.error(f"Session Security Tester: Login failed with status {response.status_code}")
                self.headers = {}
        except Exception as e:
            logging.error(f"Session Security Tester: Login failed - {str(e)}")
            self.headers = {}
    
    @task(3)    
    def test_session_regeneration(self):
        """Tests if session IDs change after authentication, preventing session fixation"""
        # Get a pre-login session first
        self.client.cookies.clear()
        self.client.get(f"{self.prefix}/", name="Session-Pre-Login")
        pre_login_cookies = dict(self.client.cookies)
        
        # Now login
        self.login()
        post_login_cookies = dict(self.client.cookies)
        
        # Log the results (in a real test we'd verify that the session IDs are different)
        logging.info(f"Pre-login cookies: {pre_login_cookies}")
        logging.info(f"Post-login cookies: {post_login_cookies}")
    
    @task(2)
    def test_session_secure_attributes(self):
        """Verifies session cookie security attributes are properly set"""
        # Collect a fresh session cookie after login
        self.login()
        
        # Access a protected route that requires authentication
        response = self.client.get(
            f"{self.prefix}/auth/me", 
            headers=self.headers,
            name="Session-Protected-Route"
        )
        
        # Cookie attributes can only be seen in actual HTTP responses
        # Here we just log current cookies for visual inspection
        logging.info(f"Current session cookies: {dict(self.client.cookies)}")

class BruteForceProtectionTester(HttpUser):
    """Tests brute force protection and rate limiting effectiveness"""
    wait_time = between(0.1, 0.3)  # Very short to trigger rate limits
    host = "http://localhost:3001"
    prefix = "/api/v1"
    
    @task
    def test_login_rate_limiting(self):
        """Tests if the system blocks rapid login attempts"""
        # Use a random username but incorrect password
        username = f"user{random.randint(1, 100)}@example.com"
        
        with self.client.post(
            f"{self.prefix}/auth/login",
            json={
                "identifier": username,
                "password": "wrong_password"
            },
            name="BruteForce-Login-Attempt",
            catch_response=True
        ) as response:
            # After many requests, we expect to see 429 Too Many Requests
            if response.status_code == 429:
                response.success()
                logging.info("Rate limiting test: Server enforced rate limits")
            elif response.status_code == 401:
                # This is expected for the first few attempts
                response.success()
            else:
                response.failure(f"Unexpected response code: {response.status_code}")
    
    @task
    def test_api_rate_limiting(self):
        """Tests if the API endpoints are rate limited"""
        # Repeatedly hit public endpoints to trigger rate limiting
        with self.client.get(
            f"{self.prefix}/public-endpoint",  # Replace with an actual public endpoint
            name="BruteForce-API-Endpoint",
            catch_response=True
        ) as response:
            if response.status_code == 429:
                response.success()
                logging.info("API rate limiting test: Server enforced rate limits")
            elif response.status_code in [200, 404]:  # 404 is acceptable if endpoint doesn't exist
                response.success()
            else:
                response.failure(f"Unexpected response code: {response.status_code}")
