#ifndef TDS_SENSOR_H
#define TDS_SENSOR_H

#include <Arduino.h>

class TDSSensor {
public:
  TDSSensor(uint8_t pin);
  void begin();
  float readTDS();

private:
  uint8_t _pin;
  float calibrationFactor = 1.0;
};

#endif
