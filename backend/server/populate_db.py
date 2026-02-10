
import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"
API_KEY = "mysecretkey"
HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

def make_request(endpoint, data):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Success: {endpoint} - {response.status}")
            return response.read()
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} calling {endpoint}: {e.read().decode()}")
    except Exception as e:
        print(f"Error calling {endpoint}: {str(e)}")

# 1. Create Domain
print("Creating domain 'medicine'...")
# Attempt to create validation if it doesn't exist, ignore if it fails (likely exists)
make_request("/collections/create", {"name": "medicine"})
time.sleep(1) 

# 2. Add Nodes
nodes = [
    {
        "name": "Cardiology",
        "content": "Cardiology is a medical specialty dealing with disorders of the heart and the circulatory system. It includes the diagnosis and treatment of congenital heart defects, coronary artery disease, heart failure, valvular heart disease, and electrophysiology. Physicians who specialize in this field of medicine are called cardiologists. Pediatric cardiologists are pediatricians who specialize in cardiology. Physicians who specialize in cardiac surgery are called cardiothoracic surgeons or cardiac surgeons, a specialty of general surgery.",
    },
    {
        "name": "Neurology",
        "content": "Neurology is the branch of medicine dealing with the diagnosis and treatment of all categories of conditions and disease involving the central and peripheral nervous systems, including their coverings, blood vessels, and all effector tissue, such as muscle. Neurological practice relies heavily on the field of neuroscience, the scientific study of the nervous system. A neurologist is a physician specializing in neurology and trained to investigate, or diagnose and treat neurological disorders.",
    },
    {
        "name": "Pediatrics",
        "content": "Pediatrics is the branch of medicine that involves the medical care of infants, children, adolescents, and young adults. In the United Kingdom, paediatrics covers many of their youth until the age of 18. The word pediatrics and its cognates mean 'healer of children'. Pediatricians work in hospitals, particularly those working in its subspecialties such as neonatology, and as primary care physicians.",
    },
    {
        "name": "Oncology",
        "content": "Oncology is a branch of medicine that deals with the prevention, diagnosis, and treatment of cancer. A medical professional who practices oncology is an oncologist. The three main components of oncology are: medical oncology (treatment with drugs), surgical oncology (treatment by surgery), and radiation oncology (treatment by radiation).",
    },
    {
        "name": "Dermatology",
        "content": "Dermatology is the branch of medicine dealing with the skin. It is a speciality with both medical and surgical aspects. A dermatologist is a specialist medical doctor who manages diseases related to skin, hair, nails, and some cosmetic problems. The skin is the largest organ of the body, and it reflects the health of the body and acts as a barrier against injury and bacteria.",
    }
]

print("Adding nodes...")
for node in nodes:
    payload = {
        "collection": "medicine",
        "name": node["name"],
        "content": node["content"],
        "user_links": [],
        "distance_threshold": 1.3,
        "max_links": 10
    }
    print(f"Adding {node['name']}...")
    make_request("/nodes/insert", payload)
    time.sleep(0.5)

print("Done.")
