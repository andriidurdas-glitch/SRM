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
    training_days: Optional[List[int]] = []
    monthly_fee: Optional[float] = 0.0

class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    schedule: Optional[str] = ""
    description: Optional[str] = ""
    training_days: Optional[List[int]] = []
    monthly_fee: Optional[float] = 0.0
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
    if 'training_days' not in doc:
        doc['training_days'] = []
    if 'monthly_fee' not in doc:
        doc['monthly_fee'] = 0.0
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
    # Validate that the date is a training day
    group = await db.groups.find_one({"id": attendance.group_id}, {"_id": 0})
    if group and group.get('training_days'):
        attendance_date = datetime.fromisoformat(attendance.date)
        weekday = attendance_date.weekday()
        if weekday not in group['training_days']:
            raise HTTPException(status_code=400, detail=f"Немає тренування в цей день. Тренування проводяться: {group['training_days']}")
    
    # Check if attendance already exists
    existing = await db.attendance.find_one({
        "player_id": attendance.player_id,
        "date": attendance.date
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Відвідуваність вже відмічена для цього гравця в цей день")
    
    doc = attendance.model_dump()
    doc['id'] = str(ObjectId())
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.attendance.insert_one(doc)
    return Attendance(**doc)

@api_router.put("/attendance/{attendance_id}", response_model=Attendance)
async def update_attendance(attendance_id: str, status: str, notes: Optional[str] = ""):
    if status not in ["present", "absent"]:
        raise HTTPException(status_code=400, detail="Статус має бути 'present' або 'absent'")
    
    result = await db.attendance.update_one(
        {"id": attendance_id},
        {"$set": {"status": status, "notes": notes}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Відвідуваність не знайдено")
    
    updated = await db.attendance.find_one({"id": attendance_id}, {"_id": 0})
    return Attendance(**updated)

@api_router.delete("/attendance/{attendance_id}")
async def delete_attendance(attendance_id: str):
    result = await db.attendance.delete_one({"id": attendance_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Відвідуваність не знайдено")
    return {"message": "Відвідуваність видалено"}

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

@api_router.get("/statistics/player/{player_id}")
async def get_player_stats(player_id: str):
    all_attendance = await db.attendance.find({"player_id": player_id}, {"_id": 0}).to_list(1000)
    total_sessions = len(all_attendance)
    present_count = sum(1 for a in all_attendance if a['status'] == 'present')
    absent_count = sum(1 for a in all_attendance if a['status'] == 'absent')
    attendance_rate = (present_count / total_sessions * 100) if total_sessions > 0 else 0
    
    payments = await db.payments.find({"player_id": player_id}, {"_id": 0}).to_list(1000)
    total_paid = sum(p['amount'] for p in payments)
    
    return {
        "player_id": player_id,
        "total_sessions": total_sessions,
        "present_count": present_count,
        "absent_count": absent_count,
        "attendance_rate": round(attendance_rate, 1),
        "total_paid": total_paid,
        "payment_count": len(payments)
    }

@api_router.get("/statistics/group/{group_id}")
async def get_group_stats(group_id: str):
    players = await db.players.find({"group_id": group_id}, {"_id": 0}).to_list(1000)
    player_ids = [p['id'] for p in players]
    
    all_attendance = await db.attendance.find({"group_id": group_id}, {"_id": 0}).to_list(1000)
    total_sessions = len(set(a['date'] for a in all_attendance))
    present_count = sum(1 for a in all_attendance if a['status'] == 'present')
    absent_count = sum(1 for a in all_attendance if a['status'] == 'absent')
    total_records = len(all_attendance)
    attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0
    
    payments = await db.payments.find({"player_id": {"$in": player_ids}}, {"_id": 0}).to_list(1000)
    total_revenue = sum(p['amount'] for p in payments)
    
    player_stats = []
    for player in players:
        player_attendance = [a for a in all_attendance if a['player_id'] == player['id']]
        p_present = sum(1 for a in player_attendance if a['status'] == 'present')
        p_total = len(player_attendance)
        p_rate = (p_present / p_total * 100) if p_total > 0 else 0
        player_stats.append({
            "player_id": player['id'],
            "player_name": player['full_name'],
            "attendance_rate": round(p_rate, 1),
            "present_count": p_present,
            "total_sessions": p_total
        })
    
    return {
        "group_id": group_id,
        "player_count": len(players),
        "total_sessions": total_sessions,
        "total_attendance_records": total_records,
        "present_count": present_count,
        "absent_count": absent_count,
        "attendance_rate": round(attendance_rate, 1),
        "total_revenue": total_revenue,
        "player_stats": sorted(player_stats, key=lambda x: x['attendance_rate'], reverse=True)
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