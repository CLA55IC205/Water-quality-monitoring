from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import desc
from database import SessionLocal, engine
from models import Base, MonitoringData, User, WaterBody
from schemas import MonitoringDataSchema, UserLogin
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import pytz  # add this


app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

zambia_tz = pytz.timezone("Africa/Lusaka")

# -------------------------
# Database Initialization
# -------------------------
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# Monitoring Data Endpoints
# -------------------------

@app.post("/data")
def add_data(data: MonitoringDataSchema, db: Session = Depends(get_db)):
    print("ENTERED /data ENDPOINT")
    print("RAW DATA:", data)

    record = MonitoringData(
        device_id=data.device_id,
        ph_value=data.ph_value,
        tds_value=data.tds_value,
        temperature=data.temperature,
        timestamp=data.timestamp or datetime.now(zambia_tz)
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    print(f"SAVED ID {record.id}")
    return {"status": "saved", "id": record.id}

@app.get("/data", response_model=List[MonitoringDataSchema])
def get_data(db: Session = Depends(get_db)):
    return db.query(MonitoringData).all()

# -------------------------
# Latest reading per device
# -------------------------
@app.get("/data/latest", response_model=List[MonitoringDataSchema])
def get_latest_data(db: Session = Depends(get_db)):
    device_ids = db.query(MonitoringData.device_id).distinct().all()
    latest_records = []

    for (device_id,) in device_ids:
        record = (
            db.query(MonitoringData)
            .filter(MonitoringData.device_id == device_id)
            .order_by(desc(MonitoringData.timestamp))
            .first()
        )
        if record:
            latest_records.append(record)

    return latest_records

# -------------------------
# List monitoring devices
# -------------------------
@app.get("/monitoring/list")
def get_monitoring_list(db: Session = Depends(get_db)):
    devices = db.query(MonitoringData.device_id).distinct().all()
    return [{"id": t[0]} for t in devices]

# -------------------------
# GLOBAL LATEST WATER QUALITY (FOR DASHBOARD)
# -------------------------
@app.get("/monitoring_data/latest")
def get_global_latest(db: Session = Depends(get_db)):
    record = (
        db.query(MonitoringData)
        .order_by(desc(MonitoringData.timestamp))
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="No monitoring data found")

    return {
        "ph_value": record.ph_value,
        "tds_value": record.tds_value,
        "temperature": record.temperature
    }


# -------------------------
# Latest location + water quality
# -------------------------
@app.get("/monitoring_data/{device_id}")
def get_monitoring_location(device_id: str, db: Session = Depends(get_db)):
    record = (
        db.query(MonitoringData)
        .filter(MonitoringData.device_id == device_id)
        .order_by(desc(MonitoringData.timestamp))
        .first()
    )

    if not record:
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    return {
        "device_id": record.device_id,
        "ph_value": record.ph_value,
        "tds_value": record.tds_value,
        "temperature": record.temperature,
        "created_at": record.timestamp.isoformat() if record.timestamp else None
    }

# -------------------------
# Login Endpoint
# -------------------------
@app.post("/login")
def login(request: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if user and user.password == request.password:
        return {"username": user.username}
    raise HTTPException(status_code=401, detail="Invalid username or password")

# -------------------------
# History Endpoint
# -------------------------
@app.get("/history/{device_id}")
def get_history(device_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(MonitoringData)
        .filter(MonitoringData.device_id == device_id)
        .order_by(MonitoringData.timestamp)
        .all()
    )

    return [
        {
            "device_id": r.device_id,
            "timestamp": r.timestamp.astimezone(zambia_tz).isoformat(),
            "ph_value": r.ph_value,
            "tds_value": r.tds_value,
            "temperature": r.temperature,
        }
        for r in records
    ]

# -------------------------
# Root Endpoint
# -------------------------
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# -------------------------
# Create Test User
# -------------------------
def create_test_user():
    db = SessionLocal()
    if not db.query(User).filter(User.username == "admin").first():
        user = User(username="admin", password="1234")
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"SAVED TO DB WITH ID: {user.id}")
    db.close()

create_test_user()

# ----------------------------
# Chart data endpoint
# ----------------------------
@app.get("/monitoring_data/{device_id}/chart")
def get_monitoring_chart(device_id: str, date: str, db: Session = Depends(get_db)):
    start = datetime.strptime(date, "%Y-%m-%d")
    end = start + timedelta(days=1)

    points = db.query(MonitoringData)\
        .filter(
            MonitoringData.device_id == device_id,
            MonitoringData.timestamp >= start,
            MonitoringData.timestamp < end
        )\
        .order_by(MonitoringData.timestamp.asc())\
        .all()

    timeLabels = [p.timestamp.strftime("%H:%M") for p in points]
    phValues = [p.ph_value for p in points]
    tdsValues = [p.tds_value for p in points]
    temperatureValues = [p.temperature for p in points]

    return {
        "timeLabels": timeLabels,
        "phValues": phValues,
        "tdsValues": tdsValues,
        "temperatureValues": temperatureValues
    }

# ----------------------------
# WATER BODY LOCATION ENDPOINTS
# ----------------------------

@app.post("/waterbody/location")
def set_location(device_id: str, latitude: float, longitude: float, db: Session = Depends(get_db)):
    water_body = db.query(WaterBody).filter(WaterBody.device_id == device_id).first()
    
    if water_body:
        # Update existing location
        water_body.latitude = latitude
        water_body.longitude = longitude
    else:
        # Add new location
        water_body = WaterBody(device_id=device_id, latitude=latitude, longitude=longitude)
        db.add(water_body)
    
    db.commit()
    db.refresh(water_body)
    
    return {"device_id": water_body.device_id, "latitude": water_body.latitude, "longitude": water_body.longitude}


@app.get("/waterbody/{device_id}")
def get_location(device_id: str, db: Session = Depends(get_db)):
    water_body = db.query(WaterBody).filter(WaterBody.device_id == device_id).first()
    
    if not water_body:
        return {"detail": "Location not set"}
    
    return {"device_id": water_body.device_id, "latitude": water_body.latitude, "longitude": water_body.longitude}

@app.get("/waterbody/list")
def list_water_bodies(db: Session = Depends(get_db)):
    bodies = db.query(WaterBody).all()
    return [{"device_id": w.device_id, "latitude": w.latitude, "longitude": w.longitude} for w in bodies]
