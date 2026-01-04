#include "PhSensor.h"

PhSensor::PhSensor(uint8_t pin) {
  _pin = pin;
}

void PhSensor::begin() {
  analogReadResolution(12);
  analogSetPinAttenuation(_pin, ADC_11db);
}

float PhSensor::readVoltage() {
  long sum = 0;

  for (int i = 0; i < 20; i++) {
    sum += analogRead(_pin);
    delay(10);
  }

  float avg = sum / 20.0;
  float v_adc = avg * (3.3 / 4095.0);

  return v_adc;
}

float PhSensor::readPH() {
  float voltage = readVoltage();
  float pH = 7.0 + ((V7 - voltage) / slope);
  return pH;
}
