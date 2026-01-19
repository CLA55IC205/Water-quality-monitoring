import requests
import time
import json
import serial
import serial.tools.list_ports
from datetime import datetime
import traceback

# Configuration
BASE_URL = "http://127.0.0.1:8000"  # Update if needed
DATA_ENDPOINT = f"{BASE_URL}/data"
SERIAL_PORT = "COM3"
BAUD_RATE = 115200  # Adjust to match your ESP32's baud rate

# Log file for raw data (optional)
RAW_DATA_LOG = "raw_esp32_data.log"

# Simulate multiple monitoring devices
DEVICES = [
    {"id": "esp32_001", "name": "ESP32 Device 1"},
]

def setup_serial():
    """Initialize serial connection to ESP32"""
    try:
        # Try to open the specified COM port
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"✅ Connected to ESP32 on {SERIAL_PORT} at {BAUD_RATE} baud")
        
        # Flush any existing data in the buffer
        ser.flushInput()
        ser.flushOutput()
        
        # Wait for ESP32 to initialize
        time.sleep(2)
        return ser
        
    except serial.SerialException as e:
        print(f"❌ Could not open serial port {SERIAL_PORT}: {e}")
        print("\nAvailable COM ports:")
        ports = serial.tools.list_ports.comports()
        for port in ports:
            print(f"  - {port.device}: {port.description}")
        return None
    except Exception as e:
        print(f"⚠️ Unexpected error during serial setup: {e}")
        traceback.print_exc()
        return None

def read_esp32_data(ser):
    """Read and parse JSON data from ESP32 - accepts ALL data"""
    if ser is None:
        print("⚠️ No serial connection available")
        return None
    
    try:
        # Check if data is available
        if ser.in_waiting > 0:
            # Read line from serial
            raw_line = ser.readline()
            
            try:
                # Try to decode as UTF-8
                line = raw_line.decode('utf-8').strip()
                
                # Log raw data to file for debugging
                with open(RAW_DATA_LOG, 'a') as log_file:
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    log_file.write(f"[{timestamp}] RAW: {raw_line.hex()} | DECODED: {line}\n")
                
                print(f"📥 Raw string received: {line}")
                
                # Try to parse JSON - even if it contains bad values
                if line:
                    try:
                        data = json.loads(line)
                        print(f"✅ JSON parsed successfully: {data}")
                        
                        # Log successful JSON parse
                        with open(RAW_DATA_LOG, 'a') as log_file:
                            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            log_file.write(f"[{timestamp}] JSON: {json.dumps(data)}\n")
                        
                        return data
                    except json.JSONDecodeError as je:
                        print(f"⚠️ JSON decode error: {je}")
                        print(f"   Problematic line: {line}")
                        
                        # Log JSON error
                        with open(RAW_DATA_LOG, 'a') as log_file:
                            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            log_file.write(f"[{timestamp}] JSON ERROR: {je} | DATA: {line}\n")
                        
                        # Return the raw line as a special error entry
                        return {"error": "json_decode_error", "raw_data": line}
            except UnicodeDecodeError as ude:
                # Handle non-UTF-8 data
                print(f"⚠️ Unicode decode error: {ude}")
                print(f"   Raw bytes: {raw_line.hex()}")
                
                # Log binary data
                with open(RAW_DATA_LOG, 'a') as log_file:
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    log_file.write(f"[{timestamp}] BINARY DATA: {raw_line.hex()}\n")
                
                return {"error": "unicode_decode_error", "raw_bytes": raw_line.hex()}
        else:
            # No data available
            return None
            
    except Exception as e:
        print(f"⚠️ Error reading from serial: {e}")
        traceback.print_exc()
        
        # Log the error
        with open(RAW_DATA_LOG, 'a') as log_file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"[{timestamp}] READ ERROR: {e}\n")
        
        return {"error": "serial_read_error", "message": str(e)}

def send_device_data(device, sensor_data):
    """Send ALL sensor data to FastAPI backend - accepts any data"""
    if sensor_data is None:
        print(f"⚠️ {device['name']} | No data received from ESP32")
        
        # Log the null data
        with open(RAW_DATA_LOG, 'a') as log_file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"[{timestamp}] {device['name']}: NO DATA\n")
        
        return
    
    print(f"📤 {device['name']} | Processing data: {sensor_data}")
    
    # Handle error entries
    if "error" in sensor_data:
        print(f"⚠️ {device['name']} | Data contains error: {sensor_data.get('error')}")
        
        # Send error data to backend anyway
        payload = {
            "device_id": device["id"],
            "error": sensor_data.get("error"),
            "raw_data": str(sensor_data.get("raw_data", "")),
            "raw_bytes": sensor_data.get("raw_bytes", ""),
            "is_error": True,
            "timestamp": datetime.now().isoformat()
        }
    else:
        # Extract data from ESP32 JSON - handle missing or malformed keys
        payload = {
            "device_id": device["id"],
            "is_error": False,
            "timestamp": datetime.now().isoformat()
        }
        
        # Try to extract each value with fallbacks
        try:
            # pH value - accept any value including invalid ones
            if "ph" in sensor_data:
                payload["ph_value"] = float(sensor_data["ph"]) if isinstance(sensor_data["ph"], (int, float, str)) else 0.0
            elif "ph_value" in sensor_data:
                payload["ph_value"] = float(sensor_data["ph_value"]) if isinstance(sensor_data["ph_value"], (int, float, str)) else 0.0
            else:
                payload["ph_value"] = None
                payload["ph_missing"] = True
        except (ValueError, TypeError) as e:
            payload["ph_value"] = None
            payload["ph_error"] = str(e)
            payload["ph_raw"] = str(sensor_data.get("ph", sensor_data.get("ph_value", "unknown")))
        
        try:
            # TDS value - accept any value
            if "tds" in sensor_data:
                payload["tds_value"] = float(sensor_data["tds"]) if isinstance(sensor_data["tds"], (int, float, str)) else 0.0
            elif "tds_value" in sensor_data:
                payload["tds_value"] = float(sensor_data["tds_value"]) if isinstance(sensor_data["tds_value"], (int, float, str)) else 0.0
            else:
                payload["tds_value"] = None
                payload["tds_missing"] = True
        except (ValueError, TypeError) as e:
            payload["tds_value"] = None
            payload["tds_error"] = str(e)
            payload["tds_raw"] = str(sensor_data.get("tds", sensor_data.get("tds_value", "unknown")))
        
        try:
            # Temperature - accept any value
            if "temp" in sensor_data:
                payload["temperature"] = float(sensor_data["temp"]) if isinstance(sensor_data["temp"], (int, float, str)) else 0.0
            elif "temperature" in sensor_data:
                payload["temperature"] = float(sensor_data["temperature"]) if isinstance(sensor_data["temperature"], (int, float, str)) else 0.0
            else:
                payload["temperature"] = None
                payload["temp_missing"] = True
        except (ValueError, TypeError) as e:
            payload["temperature"] = None
            payload["temp_error"] = str(e)
            payload["temp_raw"] = str(sensor_data.get("temp", sensor_data.get("temperature", "unknown")))
        
        # Include any additional fields from the ESP32
        for key, value in sensor_data.items():
            if key not in ["ph", "ph_value", "tds", "tds_value", "temp", "temperature"]:
                payload[f"esp32_{key}"] = str(value)
    
    print(f"📦 {device['name']} | Sending payload: {payload}")
    
    try:
        response = requests.post(DATA_ENDPOINT, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {device['name']} | Data sent successfully | ID: {data.get('id', 'N/A')}")
            
            # Log successful transmission
            with open(RAW_DATA_LOG, 'a') as log_file:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_file.write(f"[{timestamp}] {device['name']}: SENT | RESPONSE: {data.get('id', 'N/A')}\n")
        else:
            print(f"❌ {device['name']} | HTTP {response.status_code}: {response.text}")
            
            # Log HTTP error
            with open(RAW_DATA_LOG, 'a') as log_file:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_file.write(f"[{timestamp}] {device['name']}: HTTP ERROR {response.status_code} | {response.text[:100]}\n")
    except requests.exceptions.ConnectionError:
        print(f"🔌 {device['name']} | Connection failed - Is FastAPI running?")
        
        # Log connection error
        with open(RAW_DATA_LOG, 'a') as log_file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"[{timestamp}] {device['name']}: CONNECTION FAILED - FastAPI not reachable\n")
    except Exception as e:
        print(f"⚠️ {device['name']} | Error sending data: {e}")
        traceback.print_exc()
        
        # Log send error
        with open(RAW_DATA_LOG, 'a') as log_file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"[{timestamp}] {device['name']}: SEND ERROR: {e}\n")

def monitor_device(device, ser, interval=5):
    """Monitor a device and send ALL data at intervals (seconds)"""
    print(f"🔍 {device['name']} | Starting monitor (interval: {interval}s)")
    
    while True:
        try:
            # Read data from ESP32
            sensor_data = read_esp32_data(ser)
            
            # Send whatever we got (even None or errors)
            send_device_data(device, sensor_data)
            
            # Wait for next reading
            time.sleep(interval)
            
        except Exception as e:
            print(f"⚠️ {device['name']} | Monitor error: {e}")
            traceback.print_exc()
            
            # Log monitor error
            with open(RAW_DATA_LOG, 'a') as log_file:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_file.write(f"[{timestamp}] {device['name']}: MONITOR ERROR: {e}\n")
            
            # Wait before retrying
            time.sleep(interval)

def main():
    import threading

    print("💧 Starting Water Quality Monitoring - ESP32 Integration")
    print("⚠️  ACCEPTING ALL DATA (including errors and invalid values)")
    print(f"📡 Connecting to ESP32 on {SERIAL_PORT}...")
    
    # Initialize log file
    with open(RAW_DATA_LOG, 'a') as log_file:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_file.write(f"\n{'='*60}\n")
        log_file.write(f"ESP32 Monitoring Session Started: {timestamp}\n")
        log_file.write(f"Serial Port: {SERIAL_PORT} | Baud Rate: {BAUD_RATE}\n")
        log_file.write(f"{'='*60}\n\n")
    
    print(f"📝 Raw data will be logged to: {RAW_DATA_LOG}")
    
    # Setup serial connection
    ser = setup_serial()
    
    if ser is None:
        print("❌ Failed to establish serial connection. Running in debug mode.")
        print("⚠️  Will continue to log to file but no serial data will be received.")
        
        # You can still run without serial for testing
        # Create a dummy serial object for the thread
        ser = type('DummySerial', (), {
            'in_waiting': 0,
            'readline': lambda: b'',
            'close': lambda: None
        })()
    
    print("✅ Ready to receive ALL data from ESP32")
    print("   - Valid JSON data")
    print("   - Invalid JSON data")
    print("   - Binary/garbage data")
    print("   - Empty data")
    print("   - Everything will be logged to file and sent to backend")
    
    threads = []
    for device in DEVICES:
        t = threading.Thread(target=monitor_device, args=(device, ser), daemon=True)
        threads.append(t)
        t.start()
        time.sleep(0.5)  # Slight stagger

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped by user")
    finally:
        # Close serial connection
        if hasattr(ser, 'close'):
            ser.close()
            print("🔌 Serial connection closed")
        
        # Log session end
        with open(RAW_DATA_LOG, 'a') as log_file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"\n{'='*60}\n")
            log_file.write(f"ESP32 Monitoring Session Ended: {timestamp}\n")
            log_file.write(f"{'='*60}\n\n")

if __name__ == "__main__":
    main()