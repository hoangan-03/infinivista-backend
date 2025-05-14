from locust import HttpUser, task, between, events
import logging
import json
import random
import os

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
