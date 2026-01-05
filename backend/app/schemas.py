from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pydantic import ConfigDict

class MonitoringDataSchema(BaseModel):
    device_id: str
    ph_value: float
    tds_value: float
    temperature: float
    timestamp: Optional[datetime] = None  # optional, backend can fill

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    username: str
    password: str
