from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
import secrets
import time
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from supabase import create_client
import uuid
from database import get_db
from models import *
from services.vlm_service import extract_text_from_pdf, extract_text_from_image
from services.llm_service import suggest_topics, generate_flashcards, generate_quiz, answer_question_with_context
import redis
import json
import traceback
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="LMS API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Supabase client
_supabase_url = os.getenv("SUPABASE_URL")
_supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(_supabase_url, _supabase_key) if (_supabase_url and _supabase_key) else None

# Redis client
_redis_url = os.getenv("UPSTASH_REDIS_URL")
redis_client = redis.from_url(_redis_url) if _redis_url else None

# In-memory password reset tokens (dev / single-instance only — use Redis + email in production)
_password_reset_tokens: dict[str, dict] = {}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "traceback": traceback.format_exc(),
            "path": str(request.url)
        }
    )

# ===== UPLOAD ENDPOINT =====
@app.post("/handouts/upload")
async def upload_handout(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        if supabase is None:
            raise HTTPException(
                500,
                "SUPABASE_URL/SUPABASE_KEY are not set. Configure them in your environment to enable uploads."
            )
        if redis_client is None:
            raise HTTPException(
                500,
                "UPSTASH_REDIS_URL is not set. Configure it in your environment to enable background processing."
            )

        # Validate file type
        if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
            raise HTTPException(400, f"Invalid file type: {file.content_type}. Only PDF and images allowed")
        
        print(f"Uploading file: {file.filename}, type: {file.content_type}")
        
        # Generate unique filename
        file_ext = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        print(f"Generated filename: {unique_filename}")
        
        # Upload to Supabase Storage
        file_bytes = await file.read()
        
        print(f"File size: {len(file_bytes)} bytes")
        print(f"Uploading to Supabase...")
        
        result = supabase.storage.from_("handouts").upload(
            f"uploads/{unique_filename}",
            file_bytes,
            {"content-type": file.content_type}
        )
        
        print(f"Supabase upload result: {result}")
        
        # Get public URL
        file_url = supabase.storage.from_("handouts").get_public_url(
            f"uploads/{unique_filename}"
        )
        
        print(f"File URL: {file_url}")
        
        # Create handout record
        handout = Handout(
            title=file.filename,
            file_url=file_url,
            status=ProcessingStatus.UPLOADED
        )
        db.add(handout)
        db.commit()
        db.refresh(handout)
        
        print(f"Created handout with ID: {handout.id}")
        
        # Queue processing job
        redis_client.lpush("handout_queue", str(handout.id))
        
        print(f"Queued processing job for handout {handout.id}")
        
        return {
            "id": handout.id,
            "status": handout.status.value,
            "message": "Upload successful, processing queued"
        }
        
    except Exception as e:
        print(f"ERROR in upload: {e}")
        print(traceback.format_exc())
        raise HTTPException(500, f"Upload failed: {str(e)}")

# ===== STATUS ENDPOINT =====
@app.get("/handouts/{handout_id}/status")
async def get_handout_status(handout_id: int, db: Session = Depends(get_db)):
    handout = db.query(Handout).filter(Handout.id == handout_id).first()
    
    if not handout:
        raise HTTPException(404, "Handout not found")
    
    return {
        "id": handout.id,
        "status": handout.status.value,
        "title": handout.title
    }

# ===== SUGGEST TOPICS =====
@app.post("/handouts/{handout_id}/suggest-topics")
async def suggest_handout_topics(handout_id: int, db: Session = Depends(get_db)):
    handout = db.query(Handout).filter(Handout.id == handout_id).first()
    
    if not handout or not handout.extracted_text:
        raise HTTPException(404, "Handout not ready")
    
    topics = suggest_topics(handout.extracted_text)
    
    return {"topics": topics}

# ===== GENERATE FLASHCARDS =====
@app.post("/handouts/{handout_id}/generate-flashcards")
async def create_flashcards(handout_id: int, db: Session = Depends(get_db)):
    handout = db.query(Handout).filter(Handout.id == handout_id).first()
    
    if not handout or not handout.extracted_text:
        raise HTTPException(404, "Handout not ready")
    
    flashcards_data = generate_flashcards(handout.extracted_text)
    
    # Save to database
    for fc in flashcards_data:
        flashcard = Flashcard(
            handout_id=handout_id,
            question=fc["question"],
            answer=fc["answer"]
        )
        db.add(flashcard)
    
    db.commit()
    
    return {"count": len(flashcards_data), "flashcards": flashcards_data}

# ===== GET FLASHCARDS =====
@app.get("/handouts/{handout_id}/flashcards")
async def get_flashcards(handout_id: int, db: Session = Depends(get_db)):
    flashcards = db.query(Flashcard).filter(Flashcard.handout_id == handout_id).all()
    
    return {
        "flashcards": [
            {"id": fc.id, "question": fc.question, "answer": fc.answer}
            for fc in flashcards
        ]
    }

# ===== GENERATE QUIZ =====
@app.post("/handouts/{handout_id}/generate-quiz")
async def create_quiz(handout_id: int, db: Session = Depends(get_db)):
    handout = db.query(Handout).filter(Handout.id == handout_id).first()
    
    if not handout or not handout.extracted_text:
        raise HTTPException(404, "Handout not ready")
    
    quiz_data = generate_quiz(handout.extracted_text)
    
    # Save to database
    quiz = Quiz(
        handout_id=handout_id,
        questions_json=json.dumps(quiz_data)
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    return {"quiz_id": quiz.id, "quiz": quiz_data}

# ===== CHAT ENDPOINT =====
@app.post("/handouts/{handout_id}/chat")
async def chat_with_handout(
    handout_id: int,
    question: str,
    db: Session = Depends(get_db)
):
    handout = db.query(Handout).filter(Handout.id == handout_id).first()
    
    if not handout or not handout.extracted_text:
        raise HTTPException(404, "Handout not ready")
    
    # Simple RAG: split text into chunks
    text = handout.extracted_text
    chunk_size = 1000
    chunks = [
        {"text": text[i:i+chunk_size], "page": i//chunk_size}
        for i in range(0, len(text), chunk_size)
    ][:5]  # Top 5 chunks for now
    
    # Answer question
    result = answer_question_with_context(question, chunks)
    
    return result

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "LMS API is running"}


# ===== PASSWORD RESET (stub persistence — wire to User model + email service for production) =====


class ForgotPasswordBody(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)


class ResetPasswordBody(BaseModel):
    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=8, max_length=128)


@app.post("/auth/forgot-password")
async def auth_forgot_password(body: ForgotPasswordBody):
    """
    Always returns a generic success message (avoid email enumeration).
    If you need to test reset locally, check server logs for the dev-only reset URL.
    """
    email = body.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=422, detail="Enter a valid email address.")

    token = secrets.token_urlsafe(32)
    _password_reset_tokens[token] = {
        "email": email,
        "exp": time.time() + 3600,
    }
    # Production: enqueue email with link f"{FRONTEND_URL}/reset-password?token={token}"
    print(
        f"[password-reset] Dev link for {email}: "
        f"(frontend)/reset-password?token={token}",
        flush=True,
    )

    return {
        "message": "If an account exists for that email, we sent instructions to reset your password.",
    }


@app.post("/auth/reset-password")
async def auth_reset_password(body: ResetPasswordBody):
    entry = _password_reset_tokens.get(body.token)
    if not entry or entry["exp"] < time.time():
        raise HTTPException(
            status_code=400,
            detail="This reset link is invalid or has expired. Request a new one.",
        )

    # Production: hash password and persist on User row for entry["email"]
    del _password_reset_tokens[body.token]

    return {"message": "Your password has been updated. You can sign in now."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)