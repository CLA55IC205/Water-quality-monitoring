#ifndef PH_SENSOR_H
#define PH_SENSOR_H

#include <Arduino.h>

class PhSensor {
public:
  PhSensor(uint8_t pin);
  void begin();
  float readPH();

private:
  float readVoltage();

  uint8_t _pin;
  float V7 = 2.55;
  float slope = 0.18;
};

#endif
