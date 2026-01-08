import requests
import time
import random
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"  # Update if needed
DATA_ENDPOINT = f"{BASE_URL}/data"

# Simulate multiple monitoring devices
DEVICES = [
    {"id": "device_001", "name": "Device 1"},
    {"id": "device_002", "name": "Device 2"},
    {"id": "device_003", "name": "Device 3"},
    {"id": "device_004", "name": "Device 4"},
]

def generate_sensor_data():
    """Generate random water quality sensor data"""
    return {
        "ph_value": round(random.uniform(5.0, 9.5), 2),
        "tds_value": round(random.uniform(100, 1000), 1),  # ppm
        "temperature": round(random.uniform(18, 35), 1)   # Celsius
    }

def send_device_data(device):
    """Send sensor data to FastAPI backend"""
    data = generate_sensor_data()
    payload = {
        "device_id": device["id"],
        "ph_value": data["ph_value"],
        "tds_value": data["tds_value"],
        "temperature": data["temperature"],
    }

    try:
        response = requests.post(DATA_ENDPOINT, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {device['name']} | Data sent | ID: {data.get('id', 'N/A')} | PH: {payload['ph_value']} | TDS: {payload['tds_value']} | Temp: {payload['temperature']}")
        else:
            print(f"❌ {device['name']} | HTTP {response.status_code}: {response.text}")
    except requests.exceptions.ConnectionError:
        print(f"🔌 {device['name']} | Connection failed - Is FastAPI running?")
    except Exception as e:
        print(f"⚠️ {device['name']} | Error: {e}")

def simulate_device(device, interval=5):
    """Simulate a device sending data at intervals (seconds)"""
    while True:
        send_device_data(device)
        time.sleep(interval)

def main():
    import threading

    print("💧 Starting Water Quality Monitoring Simulation")
    
    threads = []
    for device in DEVICES:
        t = threading.Thread(target=simulate_device, args=(device,), daemon=True)
        threads.append(t)
        t.start()
        time.sleep(0.5)  # Slight stagger

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Simulation stopped by user")

if __name__ == "__main__":
    main()
