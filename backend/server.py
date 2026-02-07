from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, date
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class PlayerCreate(BaseModel):
    full_name: str
    birth_year: int
    parent_contact: str
    group_id: Optional[str] = None
    notes: Optional[str] = ""

class Player(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    full_name: str
    birth_year: int
    parent_contact: str
    group_id: Optional[str] = None
    notes: Optional[str] = ""
    created_at: str

class GroupCreate(BaseModel):
    name: str
    schedule: Optional[str] = ""
    description: Optional[str] = ""

class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    schedule: Optional[str] = ""
    description: Optional[str] = ""
    player_count: int = 0
    created_at: str

class AttendanceCreate(BaseModel):
    player_id: str
    group_id: str
    date: str
    status: str
    notes: Optional[str] = ""

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    player_id: str
    group_id: str
    date: str
    status: str
    notes: Optional[str] = ""
    created_at: str

class PaymentCreate(BaseModel):
    player_id: str
    amount: float
    month: str
    payment_date: str
    notes: Optional[str] = ""

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    player_id: str
    amount: float
    month: str
    payment_date: str
    notes: Optional[str] = ""
    created_at: str

class TrainingSessionCreate(BaseModel):
    group_id: str
    date: str
    start_time: str
    end_time: str
    location: Optional[str] = ""
    notes: Optional[str] = ""

class TrainingSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    group_id: str
    date: str
    start_time: str
    end_time: str
    location: Optional[str] = ""
    notes: Optional[str] = ""
    created_at: str

class AuthRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    message: str

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(auth: AuthRequest):
    if auth.username == "coach" and auth.password == "coach123":
        return AuthResponse(success=True, message="Успішний вхід")
    raise HTTPException(status_code=401, detail="Невірні дані")

@api_router.post("/players", response_model=Player)
async def create_player(player: PlayerCreate):
    doc = player.model_dump()
    doc['id'] = str(ObjectId())
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.players.insert_one(doc)
    return Player(**doc)

@api_router.get("/players", response_model=List[Player])
async def get_players():
    players = await db.players.find({}, {"_id": 0}).to_list(1000)
    return players

@api_router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Гравця не знайдено")
    return player

@api_router.put("/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player: PlayerCreate):
    doc = player.model_dump()
    result = await db.players.update_one({"id": player_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Гравця не знайдено")
    updated = await db.players.find_one({"id": player_id}, {"_id": 0})
    return Player(**updated)

@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str):
    result = await db.players.delete_one({"id": player_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Гравця не знайдено")
    return {"message": "Гравця видалено"}

@api_router.post("/groups", response_model=Group)
async def create_group(group: GroupCreate):
    doc = group.model_dump()
    doc['id'] = str(ObjectId())
    doc['player_count'] = 0
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.groups.insert_one(doc)
    return Group(**doc)

@api_router.get("/groups", response_model=List[Group])
async def get_groups():
    groups = await db.groups.find({}, {"_id": 0}).to_list(1000)
    for group in groups:
        count = await db.players.count_documents({"group_id": group['id']})
        group['player_count'] = count
    return groups

@api_router.get("/groups/{group_id}", response_model=Group)
async def get_group(group_id: str):
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Групу не знайдено")
    count = await db.players.count_documents({"group_id": group_id})
    group['player_count'] = count
    return group

@api_router.put("/groups/{group_id}", response_model=Group)
async def update_group(group_id: str, group: GroupCreate):
    doc = group.model_dump()
    result = await db.groups.update_one({"id": group_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Групу не знайдено")
    updated = await db.groups.find_one({"id": group_id}, {"_id": 0})
    count = await db.players.count_documents({"group_id": group_id})
    updated['player_count'] = count
    return Group(**updated)

@api_router.delete("/groups/{group_id}")
async def delete_group(group_id: str):
    result = await db.groups.delete_one({"id": group_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Групу не знайдено")
    return {"message": "Групу видалено"}

@api_router.post("/attendance", response_model=Attendance)
async def create_attendance(attendance: AttendanceCreate):
    doc = attendance.model_dump()
    doc['id'] = str(ObjectId())
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.attendance.insert_one(doc)
    return Attendance(**doc)

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(date: Optional[str] = None, group_id: Optional[str] = None, player_id: Optional[str] = None):
    query = {}
    if date:
        query['date'] = date
    if group_id:
        query['group_id'] = group_id
    if player_id:
        query['player_id'] = player_id
    attendance = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return attendance

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate):
    doc = payment.model_dump()
    doc['id'] = str(ObjectId())
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.payments.insert_one(doc)
    return Payment(**doc)

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(month: Optional[str] = None, player_id: Optional[str] = None):
    query = {}
    if month:
        query['month'] = month
    if player_id:
        query['player_id'] = player_id
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    return payments

@api_router.post("/sessions", response_model=TrainingSession)
async def create_session(session: TrainingSessionCreate):
    doc = session.model_dump()
    doc['id'] = str(ObjectId())
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.sessions.insert_one(doc)
    return TrainingSession(**doc)

@api_router.get("/sessions", response_model=List[TrainingSession])
async def get_sessions(group_id: Optional[str] = None, date: Optional[str] = None):
    query = {}
    if group_id:
        query['group_id'] = group_id
    if date:
        query['date'] = date
    sessions = await db.sessions.find(query, {"_id": 0}).to_list(1000)
    return sessions

@api_router.get("/statistics/dashboard")
async def get_dashboard_stats():
    total_players = await db.players.count_documents({})
    total_groups = await db.groups.count_documents({})
    today = date.today().isoformat()
    today_attendance = await db.attendance.count_documents({"date": today, "status": "present"})
    current_month = date.today().strftime("%Y-%m")
    month_payments = await db.payments.find({"month": current_month}, {"_id": 0}).to_list(1000)
    total_revenue = sum(p['amount'] for p in month_payments)
    
    return {
        "total_players": total_players,
        "total_groups": total_groups,
        "today_attendance": today_attendance,
        "month_revenue": total_revenue
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()