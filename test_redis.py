# test_redis.py
import redis
import os
from dotenv import load_dotenv

load_dotenv()

print(f"Testing Redis URL: {os.getenv('UPSTASH_REDIS_URL')[:30]}...")

try:
    r = redis.from_url(os.getenv('UPSTASH_REDIS_URL'))
    r.ping()
    print("✓ Redis connected!")
    
    # Test push/pop
    r.lpush("test_queue", "hello")
    result = r.rpop("test_queue")
    print(f"✓ Push/Pop works: {result}")
    
except Exception as e:
    print(f"✗ Redis failed: {e}")