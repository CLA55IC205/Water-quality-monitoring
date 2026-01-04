# Water Quality Monitoring System – Documentation

This documentation describes the design and implementation of a stationary water quality monitoring system using an ESP32, multiple water quality sensors, a Python backend, and a web-based frontend.

The system monitors:
- pH
- Total Dissolved Solids (TDS)
- Temperature

Sensor data is transmitted from the ESP32 to a FastAPI backend, stored in a database, and visualized on a frontend dashboard.

## Technologies Used
- ESP32 (C++ / Arduino)
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite Database
- HTML, CSS, JavaScript (Frontend)

# System Overview

This system is designed to monitor the quality of water in stationary water bodies such as rivers, dams, lakes, or reservoirs.

Each monitoring unit consists of an ESP32 connected to:
- pH sensor
- TDS sensor
- Temperature sensor

The ESP32 periodically collects sensor readings and sends them to a backend server over HTTP. The backend stores the data and makes it available for visualization.

The water body location is manually entered by the user on the frontend during device registration and remains fixed unless updated.
