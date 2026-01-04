#include "TDSSensor.h"

#define VREF 3.3
#define ADC_RESOLUTION 4095

TDSSensor::TDSSensor(uint8_t pin) {
  _pin = pin;
}

void TDSSensor::begin() {
  // No special ADC config in original code
}

float TDSSensor::readTDS() {
  int adcValue = analogRead(_pin);
  float voltage = adcValue * (VREF / ADC_RESOLUTION);

  float tdsValue = (133.42 * pow(voltage, 3)
                  - 255.86 * pow(voltage, 2)
                  + 857.39 * voltage)
                  * calibrationFactor;

  if (tdsValue < 0) {
    tdsValue = 0;
  }

  return tdsValue;
}
