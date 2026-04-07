import os
import redis
import time
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Handout, ProcessingStatus
from services.vlm_service import extract_text_from_pdf, extract_text_from_image
from supabase import create_client
import tempfile
from dotenv import load_dotenv

load_dotenv()

redis_client = redis.from_url(os.getenv("UPSTASH_REDIS_URL"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def process_handout(handout_id: int):
    """Process a handout: download file, extract text, save to DB"""
    
    db = SessionLocal()
    
    try:
        handout = db.query(Handout).filter(Handout.id == handout_id).first()
        
        if not handout:
            print(f"Handout {handout_id} not found")
            return
        
        print(f"Processing handout {handout_id}: {handout.title}")
        
        # Update status
        handout.status = ProcessingStatus.PROCESSING
        db.commit()
        
        # Download file from Supabase
        # Extract filename from URL
        filename = handout.file_url.split("/")[-1]
        file_data = supabase.storage.from_("handouts").download(f"uploads/{filename}")
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{filename.split('.')[-1]}") as tmp:
            tmp.write(file_data)
            tmp_path = tmp.name
        
        # Extract text
        if handout.title.lower().endswith('.pdf'):
            result = extract_text_from_pdf(tmp_path)
        else:
            result = extract_text_from_image(tmp_path)
        
        # Save extracted text
        handout.extracted_text = result["text"]
        handout.status = ProcessingStatus.READY
        db.commit()
        
        print(f"✓ Handout {handout_id} processed successfully")
        
        # Clean up temp file
        os.unlink(tmp_path)
        
    except Exception as e:
        print(f"✗ Error processing handout {handout_id}: {e}")
        handout.status = ProcessingStatus.FAILED
        db.commit()
    
    finally:
        db.close()

def main():
    """Worker main loop"""
    print("Worker started, listening for jobs...")
    
    while True:
        try:
            # Block and wait for job (30 second timeout)
            job = redis_client.brpop("handout_queue", timeout=30)
            
            if job:
                handout_id = int(job[1].decode())
                print(f"\n📥 Received job: handout_id={handout_id}")
                process_handout(handout_id)
            else:
                print(".", end="", flush=True)  # Heartbeat
                
        except KeyboardInterrupt:
            print("\nWorker stopped")
            break
        except Exception as e:
            print(f"Worker error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()