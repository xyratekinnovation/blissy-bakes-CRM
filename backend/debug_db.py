import os
import urllib.parse
from dotenv import load_dotenv
import socket

load_dotenv()

url = os.getenv("DATABASE_URL")
if not url:
    print("❌ ERROR: DATABASE_URL not found in .env")
    exit(1)

print(f"checking URL starting with: {url[:25]}...")

try:
    # Handle the +asyncpg part for parsing
    if "+asyncpg" in url:
        url = url.replace("+asyncpg", "")
    
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname
    port = parsed.port
    
    print(f"🔍 Hostname found: '{hostname}'")
    print(f"🔍 Port found: '{port}'")
    
    if not hostname:
        print("❌ ERROR: Could not parse hostname from URL. Check format.")
    else:
        print(f"👉 Attempting to resolve IP for: {hostname}")
        ip = socket.gethostbyname(hostname)
        print(f"✅ SUCCESS: Resolved to {ip}")

except Exception as e:
    print(f"❌ CONNECTION ERROR: {e}")
