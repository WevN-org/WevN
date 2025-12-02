from locust import HttpUser, task, between
import random
import uuid

# This is the API key your application expects.
API_KEY = "mysecretkey"


class ApiUser(HttpUser):
    """
    Simulates a user interacting with your AI backend API.
    """

    wait_time = between(1, 3)  # Wait 1 to 3 seconds between each task.

    # A list of collections to randomly choose from during the test.
    # For a real test, you might want to populate this by calling the /collections/list endpoint once.
    collection_names = ["Quantum_Mechanics", "Analysis3", "LinYuan1", "analysis-4"]

    def on_start(self):
        """
        on_start is called when a Locust user starts.
        This is the perfect place to set up headers that are used for all subsequent requests.
        """
        self.client.headers = {"X-API-Key": API_KEY}

    # @task(1)  # Low weight, as it's a simple check
    # def health_check(self):
    #     """Task to check the /health endpoint."""
    #     self.client.get("/health")

    # @task(2)
    # def list_all_collections(self):
    #     """Task to list all available collections."""
    #     self.client.get("/collections/list")

    # @task(5)
    # def list_nodes_in_a_collection(self):
    #     """Task to list nodes for a randomly chosen collection."""
    #     collection_name = random.choice(self.collection_names)
    #     payload = {"name": collection_name}
    #     self.client.post("/nodes/list", json=payload, name="/nodes/list")

    # @task(1)  # High weight, this is likely the most common and intensive operation.
    # def query_stream(self):
    #     """
    #     Simulates a user asking a question to the LLM.
    #     This sends a POST request with a JSON body matching your QueryModel.
    #     """
    #     payload = {
    #         "collection": random.choice(self.collection_names),
    #         "query": f"What are the key performance indicators for project {random.randint(1, 100)}?",
    #         "conversation_id": f"session-{uuid.uuid4()}",  # Generate a unique ID for each conversation
    #         "max_results": 10,
    #         "distance_threshold": 1.4,
    #     }
    #     # The 'name' parameter groups all requests to this endpoint in the Locust UI,
    #     # otherwise, they'd be grouped by the full URL including the random query.
    #     self.client.post("/query/stream", json=payload, name="/query/stream")

    @task(1)
    def summarize_conversation(self):
        """
        Simulates a user requesting a summary of a conversation.
        This sends a POST request with a JSON body matching your SummarizeHistoryRequest.
        """
        payload = {
            "session_id": f"session-{uuid.uuid4()}",
            "collection": random.choice(self.collection_names),
            "query": "Please provide a brief summary of our discussion on marketing strategies.",
            "max_results": 10,
            "distance_threshold": 1.4,
        }
        self.client.post("/history/summarize", json=payload, name="/history/summarize")


# How to run this stress test:
# 1. Save this file as `locustfile.py` in the same directory as your FastAPI app.
# 2. Make sure your FastAPI application is running.
# 3. Install Locust: pip install locust
# 4. Run Locust from your terminal: locust -f locustfile.py --host http://127.0.0.1:8000
# 5. Open your web browser and go to http://localhost:8089
# 6. Enter the number of users to simulate and a spawn rate, then start the test!
