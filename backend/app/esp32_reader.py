import serial
import requests
import json

ser = serial.Serial('COM3', 115200, timeout=1)  # Replace COM5 with your port

url = "http://127.0.0.1:8000/data"  # Your FastAPI endpoint

while True:
    line = ser.readline().decode('utf-8').strip()
    if line:
        try:
            data = json.loads(line)  # Convert JSON string from ESP32 to dict
            response = requests.post(url, json=data)
            print(response.status_code, response.json())
        except json.JSONDecodeError:
            print("Invalid JSON:", line)
