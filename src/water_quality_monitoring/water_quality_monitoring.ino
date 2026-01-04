#include <Arduino.h>
#include "PhSensor.h"
#include "TDSSensor.h"
#include "TempSensor.h"

// =============================
// DEVICE CONFIG
// =============================
#define DEVICE_ID "WATER_NODE_01"

// =============================
// SENSOR PINS
// =============================
#define PH_PIN   34
#define TDS_PIN  35
#define TEMP_PIN 25

// =============================
// SENSOR OBJECTS
// =============================
PhSensor   phSensor(PH_PIN);
TDSSensor  tdsSensor(TDS_PIN);
TempSensor tempSensor(TEMP_PIN);

// =============================
// SETUP
// =============================
void setup() {
  Serial.begin(115200);
  delay(1000);

  phSensor.begin();
  tdsSensor.begin();
  tempSensor.begin();

  Serial.println("=== Water Monitoring Node Started ===");
}

// =============================
// LOOP
// =============================
void loop() {
  float phValue   = phSensor.readPH();
  float tdsValue  = tdsSensor.readTDS();
  float tempValue = tempSensor.readTemperature();

  // Build JSON string exactly like your first example
  String jsonString = "{";
  jsonString += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonString += "\"ph_value\":" + String(phValue, 2) + ",";
  jsonString += "\"tds_value\":" + String(tdsValue, 0) + ",";
  jsonString += "\"temperature\":" + String(tempValue, 2);
  jsonString += "}";

  // Send JSON via Serial
  Serial.println(jsonString);

  delay(2000);  // Send every 2 seconds
}
