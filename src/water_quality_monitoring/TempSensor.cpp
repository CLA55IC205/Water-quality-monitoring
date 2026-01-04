#include "TempSensor.h"

TempSensor::TempSensor(uint8_t pin)
  : _oneWire(pin), _sensors(&_oneWire) {}

void TempSensor::begin() {
  _sensors.begin();
}

float TempSensor::readTemperature() {
  _sensors.requestTemperatures();
  return _sensors.getTempCByIndex(0);
}
