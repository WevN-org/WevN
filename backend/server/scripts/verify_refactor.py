
import requests
import time
import sys

BASE_URL = "http://localhost:8000"
API_KEY = "mysecretkey"

def check(url, method="GET", json=None):
    headers = {"X-API-Key": API_KEY}
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{url}", headers=headers)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{url}", headers=headers, json=json)
        
        if response.status_code == 200:
            print(f"✅ {method} {url} - PASS")
            return True
        else:
            print(f"❌ {method} {url} - FAIL ({response.status_code}: {response.text})")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {url} - CONNECTION REFUSED (Is the server running?)")
        return False

def main():
    print("Testing API Endpoints...")
    
    # Check Health
    if not check("/health"):
        print("Wait, is the server running? Start `uvicorn server2:app --reload` first!")
        sys.exit(1)

    # List Collections
    check("/collections/list")

    # Create Test Collection
    payload = {"name": "test_verification_collection"}
    if check("/collections/create", method="POST", json=payload):
        # Insert Node (Also tests LLM embedding via server)
        node_payload = {
            "collection": "test_verification_collection",
            "name": "Test Node",
            "content": "This is a test node content to verify embedding.",
            "user_links": [],
            "distance_threshold": 1.4,
            "max_links": 5
        }
        # This will fail slightly slower if embedding model is loading, so we might need patience
        check("/nodes/insert", method="POST", json=node_payload)

        # Clean up
        check("/collections/delete", method="POST", json=payload)

if __name__ == "__main__":
    main()
