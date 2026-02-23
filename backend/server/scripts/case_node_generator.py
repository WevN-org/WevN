import requests
import time

# --- Configuration ---
API_URL = "http://127.0.0.1:8000/nodes/insert"
API_KEY = "mysecretkey"  # Replace with the key expected by your verify_api_key dependency

# Adjust the header key depending on how verify_api_key extracts it (e.g., 'Authorization': f'Bearer {API_KEY}')
HEADERS = {
    "X-API-Key": API_KEY, 
    "Content-Type": "application/json"
}

# --- Default Node Parameters ---
COLLECTION_NAME = "case_investigation"
DISTANCE_THRESHOLD = 0.4  # Adjusted for relatively strict semantic matching
MAX_LINKS = 3

# --- Data Payload (Parsed from Incident IR-2026-0223-04A) ---
nodes_data = [
    {
        "name": "Executive Summary: IR-2026-0223-04A",
        "content": "On February 21, 2026, GuardDuty alerts flagged anomalous outbound traffic. An external threat actor compromised an Ubuntu 22.04 LTS web server on AWS via a Node.js RCE vulnerability. The attacker used IMDSv1 to extract IAM credentials and exfiltrated ~14,000 PDF invoices from the S3 bucket nimbus-prod-user-backups.",
        "user_links": []
    },
    {
        "name": "Affected Assets: IR-2026-0223-04A",
        "content": "Compromised host: app-prod-node-03 running Ubuntu 22.04.3 LTS. Internal IP: 10.0.12.45, External IP: 203.0.113.88. AWS Region: ap-south-1. Service: Node.js Express Backend API. Compromised Data: S3 Bucket nimbus-prod-user-backups.",
        "user_links": []
    },
    {
        "name": "Timeline: IR-2026-0223-04A",
        "content": "07:42 UTC: WAF shows dir traversal. 07:45:03 UTC: RCE payload sent to /api/v1/upload exploiting multer package. 07:45:15 UTC: Reverse shell to 192.0.2.55:4444. 07:48:30 UTC: Attacker queries 169.254.169.254 for app-prod-ec2-role credentials. 08:05:12 UTC: Data exfiltration via aws s3 sync begins from 198.51.100.22. 08:14 UTC: GuardDuty alerts. 08:20 UTC: SOC isolates instance.",
        "user_links": []
    },
    {
        "name": "Technical Analysis - Initial Vector: IR-2026-0223-04A",
        "content": "Nginx access logs revealed a POST request to /api/v1/upload from 198.51.100.22. The application failed to sanitize file metadata, allowing the writing of a malicious .js file to /var/www/html/uploads, executed via an exposed debug route.",
        "user_links": []
    },
    {
        "name": "Technical Analysis - Persistence & Cloud Abuse: IR-2026-0223-04A",
        "content": "A payload script was downloaded to /tmp/payload.sh and executed, creating a crontab entry for the www-data user to ensure a persistent reverse shell. The attacker then curled the IMDSv1 endpoint to extract credentials for the loosely permissioned app-prod-ec2-role, which had wildcard s3:GetObject access.",
        "user_links": []
    },
    {
        "name": "Containment and Eradication: IR-2026-0223-04A",
        "content": "The app-prod-node-03 instance was isolated to a forensic VPC. The compromised app-prod-ec2-role was deleted and recreated. Vulnerable Node.js packages were patched via CI/CD. Malicious scripts and crontabs were purged from the base AMI.",
        "user_links": []
    },
    {
        "name": "Post-Incident Recommendations: IR-2026-0223-04A",
        "content": "Enforce IMDSv2 across all EC2 instances to prevent metadata extraction without session tokens. Implement strictly scoped IAM policies (Least Privilege). Integrate SCA tools into pipelines to block vulnerable Node.js packages. Restrict egress traffic from application servers.",
        "user_links": []
    }
]

# --- Insertion Logic ---
def insert_nodes():
    print(f"Starting insertion of {len(nodes_data)} nodes to {API_URL}...\n")
    
    for i, node in enumerate(nodes_data, 1):
        # Construct the exact payload expected by NodeInputModel
        payload = {
            "collection": COLLECTION_NAME,
            "name": node["name"],
            "content": node["content"],
            "user_links": node["user_links"],
            "distance_threshold": DISTANCE_THRESHOLD,
            "max_links": MAX_LINKS
        }
        
        try:
            response = requests.post(API_URL, json=payload, headers=HEADERS)
            response.raise_for_status() # Raise an exception for HTTP error codes
            
            # Print the success status returned from the API
            print(f"[{i}/{len(nodes_data)}] Success: {response.json().get('status')}")
            
            # Brief pause to avoid hammering your local server/ChromaDB embedding model
            time.sleep(0.5) 
            
        except requests.exceptions.RequestException as e:
            print(f"[{i}/{len(nodes_data)}] Failed to insert '{node['name']}'.")
            print(f"Error details: {e}")
            if response is not None and response.text:
                print(f"Server response: {response.text}")

if __name__ == "__main__":
    insert_nodes()