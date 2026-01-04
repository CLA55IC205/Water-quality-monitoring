from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MonitoringDataSchema(BaseModel):
    device_id: str
    ph_value: float
    tds_value: float
    temperature: float
    timestamp: Optional[datetime] = None  # optional, backend can fill

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    username: str
    password: str
