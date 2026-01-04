# Backend Design

The backend is built using FastAPI.

## Responsibilities
- Receive sensor data via HTTP POST
- Validate data using Pydantic schemas
- Store data using SQLAlchemy ORM
- Serve data to frontend applications

## Key Components
- main.py (application entry point)
- database.py (database connection)
- models.py (SQLAlchemy models)
- schemas.py (Pydantic schemas)


# Database Schema

## Table: Monitoring_Data

| Column       | Type     | Description |
|-------------|----------|-------------|
| id          | Integer  | Primary key |
| device_id   | String   | Unique device identifier |
| ph_value    | Float    | pH reading |
| tds_value   | Float    | TDS reading |
| temperature | Float    | Water temperature |
| timestamp   | DateTime | Local time (Africa/Lusaka) |

## Table: users
Stores user authentication data.
