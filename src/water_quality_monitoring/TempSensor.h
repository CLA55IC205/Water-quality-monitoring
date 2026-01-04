#ifndef TEMP_SENSOR_H
#define TEMP_SENSOR_H

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

class TempSensor {
public:
  TempSensor(uint8_t pin);
  void begin();
  float readTemperature();

private:
  OneWire _oneWire;
  DallasTemperature _sensors;
};

#endif
