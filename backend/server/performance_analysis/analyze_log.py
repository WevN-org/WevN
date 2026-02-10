
import csv
import sys
from collections import defaultdict
import statistics

def analyze_log(file_path):
    print(f"Analyzing {file_path}...\n")
    
    total_requests = 0
    errors = 0
    endpoint_stats = defaultdict(list)
    status_codes = defaultdict(int)

    try:
        with open(file_path, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if not row: continue
                # Expected format: timestamp, method, endpoint, status_code, duration
                if len(row) < 5: continue
                
                timestamp, method, endpoint, status, duration = row
                
                try:
                    duration = float(duration)
                    status = int(status)
                except ValueError:
                    continue  # Skip header or malformed lines

                total_requests += 1
                endpoint_key = f"{method} {endpoint}"
                endpoint_stats[endpoint_key].append(duration)
                status_codes[status] += 1
                
                if status >= 400:
                    errors += 1

    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return

    if total_requests == 0:
        print("No valid data found in log.")
        return

    print(f"Total Requests: {total_requests}")
    print(f"Error Rate: {errors/total_requests:.2%} ({errors} errors)\n")

    print("-" * 60)
    print(f"{'Endpoint':<40} | {'Count':<8} | {'Avg Latency (ms)':<15} | {'Max (ms)':<10}")
    print("-" * 60)

    for endpoint, durations in sorted(endpoint_stats.items()):
        count = len(durations)
        avg_latency = statistics.mean(durations)
        max_latency = max(durations)
        print(f"{endpoint:<40} | {count:<8} | {avg_latency:<15.2f} | {max_latency:<10.2f}")

    print("-" * 60)
    print("\nStatus Codes:")
    for code, count in sorted(status_codes.items()):
        print(f"  {code}: {count}")

if __name__ == "__main__":
    log_file = "performance_log.csv"
    if len(sys.argv) > 1:
        log_file = sys.argv[1]
    
    analyze_log(log_file)
