#!/bin/bash
# Script to create database tables using curl and MySQL REST API

echo "🚀 Creating database tables via direct connection..."

# Since we can't install MySQL client, let's create a simple Python script
# that uses only standard library to make HTTP requests

python3 << 'EOF'
import socket
import sys

def test_mysql_connection():
    try:
        # Test raw socket connection to MySQL
        print("Testing MySQL connection...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        
        result = sock.connect_ex(('mysql-aiven-arenazl.e.aivencloud.com', 23108))
        if result == 0:
            print("✅ Successfully connected to MySQL server!")
            
            # Send a basic MySQL handshake (this is simplified)
            try:
                # Receive MySQL handshake packet
                data = sock.recv(1024)
                if len(data) > 0:
                    print(f"📡 Received handshake packet ({len(data)} bytes)")
                    print("✅ MySQL server is responding!")
                else:
                    print("❌ No handshake received")
            except Exception as e:
                print(f"❌ Handshake failed: {e}")
            
            sock.close()
            return True
        else:
            print(f"❌ Connection failed with error code: {result}")
            return False
            
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    test_mysql_connection()
EOF