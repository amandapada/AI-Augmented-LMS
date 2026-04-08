import os
from dotenv import load_dotenv
from supabase import create_client
import redis
from sqlalchemy import create_engine, text

load_dotenv()

print("Testing services...\n")

# Test 1: Database
print("1. Testing Neon Database...")
try:
    engine = create_engine(os.getenv("DATABASE_URL"))
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("   ✓ Database connected")
except Exception as e:
    print(f"   ✗ Database failed: {e}")

# Test 2: Redis
print("\n2. Testing Upstash Redis...")
try:
    r = redis.from_url(os.getenv("UPSTASH_REDIS_URL"))
    r.ping()
    print("   ✓ Redis connected")
except Exception as e:
    print(f"   ✗ Redis failed: {e}")

# Test 3: Supabase
print("\n3. Testing Supabase Storage...")
try:
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
    # List buckets
    buckets = supabase.storage.list_buckets()
    print(f"   ✓ Supabase connected, buckets: {[b.name for b in buckets]}")
    
    # Check if 'handouts' bucket exists
    if not any(b.name == 'handouts' for b in buckets):
        print("   ⚠ 'handouts' bucket NOT found - creating it...")
        supabase.storage.create_bucket('handouts', {'public': True})
        print("   ✓ Created 'handouts' bucket")
        
except Exception as e:
    print(f"   ✗ Supabase failed: {e}")

# Test 4: Groq
print("\n4. Testing Groq API...")
try:
    from groq import Groq
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Say 'test successful'"}],
        max_tokens=10
    )
    print(f"   ✓ Groq API working: {response.choices[0].message.content}")
except Exception as e:
    print(f"   ✗ Groq failed: {e}")

print("\n✓ All tests complete!")