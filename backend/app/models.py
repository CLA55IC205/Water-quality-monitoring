from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class MonitoringData(Base):
    __tablename__ = "Monitoring_Data"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    ph_value = Column(Float)
    tds_value = Column(Float)
    temperature = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # plaintext for now; can hash later

class WaterBody(Base):
    __tablename__ = "water_bodies"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
