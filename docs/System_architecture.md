# System Architecture

The system follows a modular IoT architecture:

ESP32 → FastAPI Backend → Database → Frontend

## Component Roles

### ESP32
- Reads sensor data
- Formats data into JSON
- Sends data to backend

### Backend
- Receives and validates data
- Stores readings in database
- Provides APIs for frontend

### Database
- Stores historical water quality data
- Stores device metadata

### Frontend
- Displays charts and trends
- Displays static device locations
- Generates heat maps using stored data

# Hardware Setup

## Main Controller
- ESP32 Development Board

## Sensors
- pH sensor (analog)
- TDS sensor (analog)
- Temperature sensor (digital or analog)

## Key Notes
- Sensors must be calibrated before deployment
- Stable power supply is critical for accurate readings
- The system is designed for stationary installation

# Firmware Design (ESP32)

The ESP32 firmware is modularized for maintainability.

## File Structure
firmware/
- ph.h / ph.cpp
- TDSmeter.h / TDSmeter.cpp
- temp.h / temp.cpp
- main.ino

## Design Philosophy
- Each sensor has its own module
- Main file coordinates readings and transmission
- JSON payloads are lightweight and structured
