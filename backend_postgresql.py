"""
TutorTrace Backend with PostgreSQL and JWT Authentication
"""
from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import RealDictCursor
import json, os, sys, random, time, re, pandas as pd, joblib
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from isodate import parse_duration
import bcrypt

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME", "")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD", "")

mail = Mail(app)
jwt = JWTManager(app)

# YouTube API
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

# PostgreSQL Connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'tutortrace'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', ''),
        cursor_factory=RealDictCursor
    )

# Initialize Database
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            avatar_url TEXT
        )
    """)
    
    # Search history table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS search_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            query TEXT NOT NULL,
            feature_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Video predictions table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS video_predictions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            predicted_views INTEGER,
            engagement_score FLOAT,
            ctr FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Downloaded reports table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS downloaded_reports (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            report_name VARCHAR(255),
            report_type VARCHAR(50),
            file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # OTP table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS otp_codes (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL
        )
    """)
    
    # Notifications table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255),
            message TEXT,
            notification_type VARCHAR(50),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()

# Initialize database on startup
try:
    init_db()
    print("✅ Database initialized successfully")
except Exception as e:
    print(f"❌ Database initialization error: {e}")

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if user exists
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"message": "User already exists"}), 409
    
    # Generate OTP
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now() + timedelta(minutes=10)
    
    # Store OTP
    cur.execute(
        "INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (%s, %s, %s)",
        (email, otp, expires_at)
    )
    conn.commit()
    
    # Send OTP email
    try:
        msg = Message("Your OTP for TutorTrace Registration", 
                     sender=app.config['MAIL_USERNAME'], 
                     recipients=[email])
        msg.body = f"Your OTP is: {otp}\n\nThis code will expire in 10 minutes."
        mail.send(msg)
        
        cur.close()
        conn.close()
        return jsonify({"message": "OTP sent to email"}), 200
    except Exception as e:
        cur.close()
        conn.close()
        return jsonify({"message": f"Failed to send OTP: {str(e)}"}), 500

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    otp_entered = data.get('otp')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Verify OTP
    cur.execute(
        "SELECT otp_code, expires_at FROM otp_codes WHERE email = %s ORDER BY created_at DESC LIMIT 1",
        (email,)
    )
    otp_record = cur.fetchone()
    
    if not otp_record or otp_record['otp_code'] != otp_entered:
        cur.close()
        conn.close()
        return jsonify({"message": "Invalid OTP"}), 400
    
    if datetime.now() > otp_record['expires_at']:
        cur.close()
        conn.close()
        return jsonify({"message": "OTP expired"}), 400
    
    # Hash password and create user
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cur.execute(
        "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
        (email, password_hash)
    )
    user_id = cur.fetchone()['id']
    
    # Delete used OTP
    cur.execute("DELETE FROM otp_codes WHERE email = %s", (email,))
    conn.commit()
    
    # Create JWT token
    access_token = create_access_token(identity=email)
    
    cur.close()
    conn.close()
    
    return jsonify({
        "message": "Registration successful",
        "token": access_token,
        "email": email
    }), 201

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT password_hash FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({"message": "Invalid credentials"}), 401
    
    access_token = create_access_token(identity=email)
    
    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "email": email
    }), 200

# Search History Routes
@app.route('/api/search-history', methods=['GET'])
@jwt_required()
def get_search_history():
    email = get_jwt_identity()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute(
        "SELECT query, feature_type, created_at FROM search_history WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
        (user['id'],)
    )
    history = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify([dict(h) for h in history]), 200

@app.route('/api/search-history', methods=['POST'])
@jwt_required()
def add_search_history():
    email = get_jwt_identity()
    data = request.json
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute(
        "INSERT INTO search_history (user_id, query, feature_type) VALUES (%s, %s, %s)",
        (user['id'], data.get('query'), data.get('feature_type', 'general'))
    )
    conn.commit()
    
    cur.close()
    conn.close()
    
    return jsonify({"message": "Search saved"}), 201

@app.route('/api/search-history', methods=['DELETE'])
@jwt_required()
def clear_search_history():
    email = get_jwt_identity()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute("DELETE FROM search_history WHERE user_id = %s", (user['id'],))
    conn.commit()
    
    cur.close()
    conn.close()
    
    return jsonify({"message": "History cleared"}), 200

# Predictions Routes
@app.route('/api/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    email = get_jwt_identity()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute(
        "SELECT * FROM video_predictions WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
        (user['id'],)
    )
    predictions = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify([dict(p) for p in predictions]), 200

@app.route('/api/predict_performance', methods=['POST'])
@jwt_required()
def predict_performance():
    email = get_jwt_identity()
    data = request.json
    
    title = data.get('title', '')
    description = data.get('description', '')
    tags = data.get('tags', '')
    
    # Calculate prediction (simplified)
    title_score = min(len(title) / 60 * 100, 100)
    desc_score = min(len(description) / 200 * 100, 100)
    tag_score = len(tags.split(',')) * 10
    
    engagement_score = (title_score + desc_score + tag_score) / 3
    predicted_views = int(engagement_score * 1000)
    ctr = (engagement_score * 0.12) / 100
    
    # Save to database
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute(
        "INSERT INTO video_predictions (user_id, title, description, tags, predicted_views, engagement_score, ctr) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (user['id'], title, description, tags, predicted_views, engagement_score, ctr)
    )
    conn.commit()
    
    cur.close()
    conn.close()
    
    return jsonify({
        "predicted_views_30d": predicted_views,
        "engagement_score": engagement_score,
        "ctr": ctr
    }), 200

# Downloaded Reports Routes
@app.route('/api/downloaded-reports', methods=['GET'])
@jwt_required()
def get_downloaded_reports():
    email = get_jwt_identity()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute(
        "SELECT report_name, report_type, created_at FROM downloaded_reports WHERE user_id = %s ORDER BY created_at DESC",
        (user['id'],)
    )
    reports = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify([dict(r) for r in reports]), 200

@app.route('/api/downloaded-reports', methods=['POST'])
@jwt_required()
def add_downloaded_report():
    email = get_jwt_identity()
    data = request.json
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute(
        "INSERT INTO downloaded_reports (user_id, report_name, report_type) VALUES (%s, %s, %s)",
        (user['id'], data.get('report_name'), data.get('report_type'))
    )
    conn.commit()
    
    cur.close()
    conn.close()
    
    return jsonify({"message": "Report saved"}), 201

# Notifications Routes
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    email = get_jwt_identity()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute(
        "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
        (user['id'],)
    )
    notifications = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify([dict(n) for n in notifications]), 200

@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    email = get_jwt_identity()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    cur.execute(
        "UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s",
        (notification_id, user['id'])
    )
    conn.commit()
    
    cur.close()
    conn.close()
    
    return jsonify({"message": "Notification marked as read"}), 200

# YouTube Trending Topics (Real-time)
@app.route('/api/trending-topics', methods=['GET'])
@jwt_required()
def get_trending_topics():
    region = request.args.get('region', 'US')
    
    try:
        # Get trending videos
        trending_response = youtube.videos().list(
            part='snippet,statistics',
            chart='mostPopular',
            regionCode=region,
            maxResults=50
        ).execute()
        
        # Extract keywords from titles and tags
        keywords = {}
        for video in trending_response.get('items', []):
            title = video['snippet']['title']
            tags = video['snippet'].get('tags', [])
            
            # Process title words
            words = re.findall(r'\w+', title.lower())
            for word in words:
                if len(word) > 3:
                    keywords[word] = keywords.get(word, 0) + 1
            
            # Process tags
            for tag in tags:
                tag_lower = tag.lower()
                keywords[tag_lower] = keywords.get(tag_lower, 0) + 2
        
        # Sort by frequency
        sorted_keywords = sorted(keywords.items(), key=lambda x: x[1], reverse=True)[:20]
        
        result = [
            {
                "keyword": kw,
                "frequency": freq,
                "trend": "up" if freq > 5 else "stable"
            }
            for kw, freq in sorted_keywords
        ]
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
