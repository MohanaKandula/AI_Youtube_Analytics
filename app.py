# app.py - Complete Enhanced YouTube Analytics Backend
from flask import Flask, jsonify, request, send_from_directory, make_response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_restx import Api, Resource, fields
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from flask_mail import Mail, Message
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from threading import Timer
try:
    from textblob import TextBlob
except ImportError:
    class TextBlob:
        def __init__(self, text):
            self.text = str(text or "")
            self.words = self.text.split()
            class _Sentiment:
                polarity = 0.0
                subjectivity = 0.0
            self.sentiment = _Sentiment()
from collections import Counter
from datetime import datetime, timedelta, timezone
from psycopg2.extras import RealDictCursor
from psycopg2 import pool
from functools import wraps
import psycopg2
import joblib
import pandas as pd
import numpy as np
import os, sys, json, time, random, re, jwt
import logging
from logging.handlers import RotatingFileHandler
import redis
import hashlib
import uuid
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

# Load environment variables
load_dotenv()

# Initialize Flask App
app = Flask(__name__)

# CORS Configuration - Dynamic Cloud + Local support
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]

def is_origin_allowed(origin):
    if not origin:
        return False
    if origin in DEFAULT_ALLOWED_ORIGINS:
        return True
    custom_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if custom_origins:
        allowed_list = [o.strip().rstrip("/") for o in custom_origins.split(",") if o.strip()]
        if origin in allowed_list or "*" in allowed_list:
            return True
    # Allow any vercel.app or render.com domain by default for seamless deployment
    if origin.endswith(".vercel.app") or origin.endswith(".render.com") or origin.endswith(".onrender.com"):
        return True
    return False

CORS(app, 
     resources={
         r"/*": {
             "origins": "*",
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
             "supports_credentials": True,
             "expose_headers": ["Content-Type", "Authorization", "X-Total-Count"]
         }
     },
     supports_credentials=True,
     intercept_exceptions=False
)

# Add this after CORS configuration
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    allowed_origin = origin if is_origin_allowed(origin) else '*'
    
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = allowed_origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        if allowed_origin != '*':
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '86400'
        return response
    
    # Add CORS headers to all responses
    if allowed_origin != '*':
        response.headers['Access-Control-Allow-Origin'] = allowed_origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
    
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    
    return response

# Add explicit OPTIONS handler
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = make_response()
    origin = request.headers.get('Origin')
    allowed_origin = origin if is_origin_allowed(origin) else '*'
    response.headers['Access-Control-Allow-Origin'] = allowed_origin
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    if allowed_origin != '*':
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '86400'
    return response

@app.route('/test-cors', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    origin = request.headers.get('Origin')
    allowed_origin = origin if is_origin_allowed(origin) else '*'
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = allowed_origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
        if allowed_origin != '*':
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    resp = jsonify({
        'message': 'CORS test successful',
        'origin': origin,
        'method': request.method,
        'timestamp': datetime.now(timezone.utc).isoformat()
    })
    resp.headers['Access-Control-Allow-Origin'] = allowed_origin
    return resp

# Set up logging
if not app.debug:
    file_handler = RotatingFileHandler('youtube_analytics.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('YouTube Analytics startup')

# Initialize Redis for caching
REDIS_URL = os.getenv('REDIS_URL')
try:
    if REDIS_URL:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    else:
        redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            db=0,
            decode_responses=True
        )
    redis_client.ping()
    app.logger.info('Redis connection established')
except Exception as e:
    app.logger.warning(f'Redis connection failed: {e}. Using in-memory caching.')
    redis_client = None

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)
limiter.init_app(app)

# Initialize API documentation
api = Api(
    app,
    version='1.0',
    title='YouTube Analytics API',
    description='API for YouTube channel analytics and video performance prediction',
    doc='/docs/',
    prefix='/api'
)

# ===== CONFIGURATION =====
# JWT Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_EXPIRATION_HOURS'] = 24
app.config['JWT_REFRESH_DAYS'] = 30

# Mail Configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME", "")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD", "")
app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']
app.config['MAIL_TIMEOUT'] = 5
mail = Mail(app)

# YouTube API Configuration (Secure zero-trust loading)
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY) if YOUTUBE_API_KEY else None

# Database Configuration with connection pooling
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "youtube_analytics")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Create connection pool lazily per worker process to ensure thread-safety
db_pool = None

def get_db_pool():
    global db_pool
    if db_pool is None:
        try:
            if DATABASE_URL:
                db_pool = psycopg2.pool.ThreadedConnectionPool(1, 10, dsn=DATABASE_URL)
            else:
                db_pool = psycopg2.pool.ThreadedConnectionPool(
                    1, 10,
                    host=DB_HOST,
                    port=DB_PORT,
                    database=DB_NAME,
                    user=DB_USER,
                    password=DB_PASSWORD
                )
            app.logger.info('Database ThreadedConnectionPool created')
        except Exception as e:
            app.logger.error(f'Database connection pool creation failed: {e}')
            db_pool = None
    return db_pool

# File paths and constants
DATA_FILE = "training_data.csv"
MODEL_FILE = "video_performance_model.pkl"
SCALER_FILE = "feature_scaler.pkl"
TREND_CACHE_FILE = "trends_cache.json"
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
TREND_CACHE_TTL = 3600
CACHE_TTL = 300

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs("exports", exist_ok=True)

# In-memory caches (fallback when Redis is not available)
video_cache = {}
trend_cache = {}
thumbnail_stats = {}
video_thumbnails = {}

# ===== DATABASE CONNECTION =====
def get_db_connection():
    """Get a fresh, dedicated database connection per request (immune to stale SSL socket errors)"""
    try:
        if DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL)
        else:
            conn = psycopg2.connect(
                host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASSWORD
            )
        return conn
    except Exception as e:
        app.logger.error(f'Database connection error: {e}')
        return None

def release_db_connection(conn):
    """Safely close connection"""
    if conn:
        try:
            conn.close()
        except Exception:
            pass

# ===== CACHING FUNCTIONS =====
def cache_get(key):
    """Get value from cache (Redis or in-memory)"""
    if redis_client:
        try:
            value = redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            app.logger.warning(f'Redis get error: {e}')
    
    # Fallback to in-memory cache
    if key in video_cache:
        data, timestamp = video_cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return data
    return None

def cache_set(key, value, ttl=CACHE_TTL):
    """Set value in cache (Redis or in-memory)"""
    if redis_client:
        try:
            redis_client.setex(key, ttl, json.dumps(value))
            return
        except Exception as e:
            app.logger.warning(f'Redis set error: {e}')
    
    # Fallback to in-memory cache
    video_cache[key] = (value, time.time())

# ===== JWT TOKEN FUNCTIONS =====
def generate_token(email, remember_me=False):
    """Generate JWT access token"""
    expiration = datetime.now(timezone.utc) + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
    if remember_me:
        expiration = datetime.now(timezone.utc) + timedelta(days=app.config['JWT_REFRESH_DAYS'])
    
    payload = {
        'email': email,
        'exp': expiration,
        'iat': datetime.now(timezone.utc),
        'jti': str(uuid.uuid4())  # Unique token ID
    }
    
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token

def verify_token(token):
    """Verify JWT token and return email"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['email']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return {'message': 'Invalid token format'}, 401
        
        if not token:
            return {'message': 'Token is missing'}, 401
        
        email = verify_token(token)
        if not email:
            return {'message': 'Token is invalid or expired'}, 401
        
        return f(email=email, *args, **kwargs)
    
    return decorated

# ===== INPUT VALIDATION =====
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    return True, ""

def sanitize_input(input_string):
    """Sanitize user input to prevent XSS"""
    if not input_string:
        return ""
    # Remove HTML tags
    cleaned = re.sub(r'<[^>]*>', '', input_string)
    # Remove potentially harmful characters
    cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', cleaned)
    return cleaned.strip()

# ===== API MODELS FOR DOCUMENTATION =====
# Define this section ONCE, BEFORE any route definitions that use @ns.route
ns = api.namespace('auth', description='Authentication operations')

user_model = api.model('User', {
    'email': fields.String(required=True, description='User email address'),
    'password': fields.String(required=True, description='User password'),
    'full_name': fields.String(description='User full name')
})

login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email address'),
    'password': fields.String(required=True, description='User password'),
    'remember_me': fields.Boolean(default=False, description='Remember me option')
})

otp_model = api.model('OTP', {
    'email': fields.String(required=True, description='User email address'),
    'otp': fields.String(required=True, description='One-time password')
})

# ===== OTP FUNCTIONS =====
def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp):
    """Send OTP via email"""
    mail_user = app.config.get('MAIL_USERNAME')
    mail_pass = app.config.get('MAIL_PASSWORD')
    if not mail_user or not mail_pass:
        app.logger.warning(f"SMTP credentials not configured. Generated OTP for {email}: {otp}")
        return False

    try:
        app.logger.info(f"Attempting to send OTP email to {email}")
        
        msg = Message(
            subject="Your OTP for YouTube Analytics Registration",
            recipients=[email],
            sender=mail_user
        )
        
        msg.body = f"""
Hello,

Your OTP for registration is: {otp}

This OTP is valid for 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
YouTube Analytics Team
        """
        
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">YouTube Analytics</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Email Verification</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Your OTP for registration is:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{otp}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">This OTP is valid for <strong>10 minutes</strong>.</p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">YouTube Analytics Team</p>
            </div>
        </div>
        """
        
        mail.send(msg)
        app.logger.info(f"OTP email sent successfully to {email}")
        return True
    except Exception as e:
        app.logger.error(f"Error sending OTP email: {str(e)}")
        # Return the OTP in development mode for testing
        app.logger.warning(f"Development mode: OTP for {email} is {otp}")
        return False

# ===== AUTHENTICATION ENDPOINTS =====

@ns.route('/send-otp')
class SendOTP(Resource):
    @api.expect(user_model)
    @api.doc('send_otp')
    @limiter.limit("5 per minute")
    def post(self):
        """Send OTP to email for registration"""
        app.logger.info("SendOTP endpoint called")
        
        data = request.json
        app.logger.info(f"Request data: {data}")
        
        email = sanitize_input(data.get('email', ''))
        full_name = sanitize_input(data.get('full_name', ''))
        password = data.get('password', '')
        
        app.logger.info(f"Processing OTP request for email: {email}")
        
        if not email or not password:
            app.logger.warning("Missing email or password in request")
            return {"message": "Email and password are required"}, 400
        
        if not validate_email(email):
            app.logger.warning(f"Invalid email format: {email}")
            return {"message": "Invalid email format"}, 400
        
        valid, msg = validate_password(password)
        if not valid:
            app.logger.warning(f"Invalid password: {msg}")
            return {"message": msg}, 400
        
        conn = get_db_connection()
        if not conn:
            app.logger.error("Database connection failed")
            return {"message": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            
            # Check if user already exists
            cur.execute("SELECT email, is_verified FROM users WHERE email=%s", (email,))
            existing_user = cur.fetchone()
            
            if existing_user and existing_user[1]:  # User exists and is verified
                app.logger.warning(f"User already exists and is verified: {email}")
                return {"message": "User already exists and is verified"}, 409
            
            # Generate OTP
            otp = generate_otp()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
            
            app.logger.info(f"Generated OTP for {email}: {otp}")
            
            # Store OTP in database
            cur.execute(
                "INSERT INTO otp_verifications (email, otp, expires_at) VALUES (%s, %s, %s)",
                (email, otp, expires_at)
            )
            
            # Store temporary user data (if new user)
            if not existing_user:
                password_hash = generate_password_hash(password)
                cur.execute(
                    "INSERT INTO users (email, password_hash, full_name, is_verified) VALUES (%s, %s, %s, FALSE) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, full_name=EXCLUDED.full_name",
                    (email, password_hash, full_name)
                )
            
            conn.commit()
            cur.close()
            
            # Send OTP via email
            email_sent = send_otp_email(email, otp)
            
            resp_data = {
                "message": "OTP sent successfully to your email" if email_sent else f"Verification code: {otp}",
                "email": email
            }
            if not email_sent:
                resp_data["otp"] = otp
            
            return resp_data, 200
                
        except Exception as e:
            app.logger.error(f"Error in send_otp: {str(e)}")
            return {"message": f"Error: {str(e)}"}, 500
        finally:
            release_db_connection(conn)

@ns.route('/verify-otp')
class VerifyOTP(Resource):
    @api.expect(otp_model)
    @api.doc('verify_otp')
    @limiter.limit("10 per minute")
    def post(self):
        """Verify OTP and complete registration"""
        data = request.json
        email = sanitize_input(data.get('email', ''))
        otp = data.get('otp', '')
        
        if not email or not otp:
            return {"message": "Email and OTP are required"}, 400
        
        conn = get_db_connection()
        if not conn:
            return {"message": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get the latest OTP for this email
            cur.execute(
                """SELECT * FROM otp_verifications 
                   WHERE email=%s AND is_used=FALSE 
                   ORDER BY created_at DESC LIMIT 1""",
                (email,)
            )
            otp_record = cur.fetchone()
            
            if not otp_record:
                return {"message": "No OTP found for this email"}, 404
            
            # Check if OTP is expired
            if datetime.now(timezone.utc) > otp_record['expires_at']:
                return {"message": "OTP has expired. Please request a new one"}, 400
            
            # Check attempts
            if otp_record['attempts'] >= 5:
                return {"message": "Too many failed attempts. Please request a new OTP"}, 400
            
            # Verify OTP
            if otp_record['otp'] != otp:
                # Increment attempts
                cur.execute(
                    "UPDATE otp_verifications SET attempts=attempts+1 WHERE id=%s",
                    (otp_record['id'],)
                )
                conn.commit()
                return {"message": "Invalid OTP"}, 401
            
            # Mark OTP as used
            cur.execute(
                "UPDATE otp_verifications SET is_used=TRUE WHERE id=%s",
                (otp_record['id'],)
            )
            
            # Mark user as verified
            cur.execute(
                "UPDATE users SET is_verified=TRUE WHERE email=%s RETURNING email, full_name",
                (email,)
            )
            user = cur.fetchone()
            
            conn.commit()
            
            # Generate JWT token
            token = generate_token(email)
            
            cur.close()
            
            return {
                "message": "Email verified successfully",
                "token": token,
                "user": {
                    "email": user['email'],
                    "full_name": user['full_name']
                }
            }, 200
            
        except Exception as e:
            app.logger.error(f"Error in verify_otp: {e}")
            return {"message": f"Error: {str(e)}"}, 500
        finally:
            release_db_connection(conn)

@ns.route('/resend-otp')
class ResendOTP(Resource):
    @api.doc('resend_otp')
    @limiter.limit("5 per minute")
    def post(self):
        """Resend OTP to email"""
        data = request.json
        email = sanitize_input(data.get('email', ''))
        
        if not email:
            return {"message": "Email is required"}, 400
        
        conn = get_db_connection()
        if not conn:
            return {"message": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            
            # Check if user exists
            cur.execute("SELECT email, full_name FROM users WHERE email=%s", (email,))
            user = cur.fetchone()
            
            if not user:
                return {"message": "User not found"}, 404
            
            # Generate new OTP
            otp = generate_otp()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
            
            # Store OTP in database
            cur.execute(
                "INSERT INTO otp_verifications (email, otp, expires_at) VALUES (%s, %s, %s)",
                (email, otp, expires_at)
            )
            
            conn.commit()
            cur.close()
            
            # Send OTP via email
            email_sent = send_otp_email(email, otp)
            
            resp_data = {
                "message": "OTP resent successfully" if email_sent else f"New verification code: {otp}",
                "email": email
            }
            if not email_sent:
                resp_data["otp"] = otp
            
            return resp_data, 200
                
        except Exception as e:
            app.logger.error(f"Error in resend_otp: {str(e)}")
            return {"message": f"Error: {str(e)}"}, 500
        finally:
            release_db_connection(conn)

@ns.route('/register')
class RegisterUser(Resource):
    @api.expect(user_model)
    @api.doc('register')
    @limiter.limit("10 per minute")
    def post(self):
        """Register new user - Direct registration without OTP"""
        data = request.json
        email = sanitize_input(data.get('email', ''))
        password = data.get('password', '')
        full_name = sanitize_input(data.get('full_name', ''))
        
        if not email or not password:
            return {"message": "Email and password are required"}, 400
        
        if not validate_email(email):
            return {"message": "Invalid email format"}, 400
        
        valid, msg = validate_password(password)
        if not valid:
            return {"message": msg}, 400
        
        conn = get_db_connection()
        if not conn:
            return {"message": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            
            # Check if user already exists
            cur.execute("SELECT email FROM users WHERE email=%s", (email,))
            if cur.fetchone():
                return {"message": "User already exists"}, 409
            
            # Create user with is_verified=TRUE (no OTP needed)
            password_hash = generate_password_hash(password)
            cur.execute(
                """INSERT INTO users (email, password_hash, full_name, is_verified) 
                   VALUES (%s, %s, %s, TRUE) RETURNING email, full_name""",
                (email, password_hash, full_name)
            )
            user = cur.fetchone()
            conn.commit()
            cur.close()
            
            return {
                "message": "Registration successful. Please login.",
                "user": {
                    "email": user[0],
                    "full_name": user[1]
                }
            }, 201
            
        except Exception as e:
            app.logger.error(f"Error in register: {e}")
            return {"message": f"Error: {str(e)}"}, 500
        finally:
            release_db_connection(conn)

@ns.route('/login')
class Login(Resource):
    @api.expect(login_model)
    @api.doc('login')
    @limiter.limit("10 per minute")
    def post(self):
        """Login user and return JWT token"""
        data = request.json
        email = sanitize_input(data.get('email', ''))
        password = data.get('password', '')
        remember_me = data.get('remember_me', False)
        
        if not email or not password:
            return {"message": "Email and password are required"}, 400
        
        if not validate_email(email):
            return {"message": "Invalid email format"}, 400
        
        conn = get_db_connection()
        if not conn:
            return {"message": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM users WHERE email=%s", (email,))
            user = cur.fetchone()
            
            if not user:
                return {"message": "Invalid credentials"}, 401
            
            if not check_password_hash(user['password_hash'], password):
                return {"message": "Invalid credentials"}, 401
            
            if not user.get('is_verified', True):
                return {"message": "Email not verified. Please verify your email first"}, 403
            
            if not user.get('is_active', True):
                return {"message": "Account is disabled"}, 403
            
            # Update last login
            cur.execute(
                "UPDATE users SET last_login=NOW(), login_count=login_count+1 WHERE email=%s",
                (email,)
            )
            conn.commit()
            
            token = generate_token(email, remember_me)
            
            cur.close()
            return {
                "message": "Login successful",
                "token": token,
                "user": {
                    "email": user['email'],
                    "full_name": user['full_name'],
                    "avatar_url": user['avatar_url'],
                    "preferences": user['preferences'],
                    "notification_settings": user['notification_settings']
                }
            }, 200
        except Exception as e:
            app.logger.error(f"Error in login: {e}")
            return {"message": f"Error: {str(e)}"}, 500
        finally:
            release_db_connection(conn)

@ns.route('/verify')
class VerifyToken(Resource):
    @api.doc('verify_token')
    @token_required
    def get(self, email):
        """Verify token and return user data"""
        conn = get_db_connection()
        if not conn:
            return {"message": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT email, full_name, avatar_url, preferences, notification_settings FROM users WHERE email=%s", (email,))
            user = cur.fetchone()
            cur.close()
            
            if not user:
                return {"message": "User not found"}, 404
            
            return {
                "valid": True,
                "user": dict(user)
            }, 200
        except Exception as e:
            app.logger.error(f"Error in verify_token: {e}")
            return {"message": f"Error: {str(e)}"}, 500
        finally:
            release_db_connection(conn)

@ns.route('/logout')
class Logout(Resource):
    @api.doc('logout')
    @token_required
    def post(self, email):
        """Logout user"""
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO user_activity_log (user_email, activity_type) VALUES (%s, %s)",
                    (email, 'logout')
                )
                conn.commit()
                cur.close()
            except:
                pass
            finally:
                release_db_connection(conn)
        
        return {"message": "Logout successful"}, 200

@ns.route('/forgot-password')
class ForgotPassword(Resource):
    @api.doc('forgot_password')
    @limiter.limit("5 per minute")
    def post(self):
        """Send password reset email"""
        data = request.json
        email = sanitize_input(data.get('email', ''))
        
        if not email:
            return {"message": "Email is required"}, 400
        
        conn = get_db_connection()
        if not conn:
            return {"message": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            cur.execute("SELECT email FROM users WHERE email=%s", (email,))
            user = cur.fetchone()
            
            if not user:
                return {"message": "If the email exists, a reset link has been sent"}, 200
            
            reset_token = jwt.encode({
                'email': email,
                'exp': datetime.now(timezone.utc) + timedelta(hours=1),
                'purpose': 'password_reset'
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
            cur.execute(
                "INSERT INTO password_reset_tokens (user_email, token, expires_at) VALUES (%s, %s, %s)",
                (email, reset_token, expires_at)
            )
            conn.commit()
            cur.close()
            
            return {
                "message": "If the email exists, a reset link has been sent",
                "reset_token": reset_token
            }, 200
        except Exception as e:
            app.logger.error(f"Error in forgot_password: {e}")
            return {"message": f"Error: {str(e)}"}, 500
        finally:
            release_db_connection(conn)

@ns.route('/reset-password')
class ResetPassword(Resource):
    @api.doc('reset_password')
    def post(self):
        """Reset password with token"""
        data = request.json
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return {"message": "Token and new password are required"}, 400
        
        valid, msg = validate_password(new_password)
        if not valid:
            return {"message": msg}, 400
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            email = payload['email']
            
            if payload.get('purpose') != 'password_reset':
                return {"message": "Invalid token"}, 401
        except:
            return {"message": "Invalid or expired token"}, 401
        
        conn = get_db_connection()
        if not conn:
            return {"message": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            
            cur.execute(
                "SELECT used FROM password_reset_tokens WHERE token=%s AND user_email=%s",
                (token, email)
            )
            token_record = cur.fetchone()
            
            if not token_record or token_record[0]:
                return {"message": "Token already used or invalid"}, 401
            
            password_hash = generate_password_hash(new_password)
            cur.execute(
                "UPDATE users SET password_hash=%s WHERE email=%s",
                (password_hash, email)
            )
            
            cur.execute(
                "UPDATE password_reset_tokens SET used=TRUE WHERE token=%s",
                (token,)
            )
            
            conn.commit()
            cur.close()
            
            return {"message": "Password reset successful"}, 200
        except Exception as e:
            app.logger.error(f"Error in reset_password: {e}")
            return {"message": f"Error: {str(e)}"}, 500
        finally:
            release_db_connection(conn)

# ===== TEST ENDPOINTS =====

@api.route('/test-mail')
class TestMail(Resource):
    def get(self):
        """Test email configuration"""
        try:
            msg = Message(
                subject="Test Email",
                recipients=["test@example.com"],  # Replace with your test email
                sender=app.config['MAIL_USERNAME']
            )
            
            msg.body = "This is a test email from YouTube Analytics."
            mail.send(msg)
            
            return {"message": "Test email sent successfully"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

@api.route('/test-connection')
class TestConnection(Resource):
    def get(self):
        return jsonify({
            "status": "ok",
            "message": "Connection test successful",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

# ===== DATABASE INITIALIZATION =====
def init_db():
    conn = get_db_connection()
    if not conn:
        app.logger.warning("Could not initialize DB (connection failed).")
        return
    
    cur = None
    try:
        cur = conn.cursor()
        
        # Users table with email verification
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                avatar_url TEXT,
                preferences JSONB DEFAULT '{"theme":"dark","language":"en","notifications":true}',
                notification_settings JSONB DEFAULT '{"email":true,"push":true,"milestone":true,"trend":true}',
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE
            )
        """)
        
        # OTP verification table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                attempts INTEGER DEFAULT 0
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email, is_used)")
        
        # Password reset tokens table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                token VARCHAR(500) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token, user_email)")
        
        # Search history table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS search_history (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                search_query TEXT NOT NULL,
                search_type VARCHAR(50),
                filters JSONB,
                results_count INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_search_user ON search_history(user_email, created_at)")
        
        # Channel stats history
        cur.execute("""
            CREATE TABLE IF NOT EXISTS channel_stats_history (
                id SERIAL PRIMARY KEY,
                channel_id VARCHAR(255) NOT NULL,
                subscriber_count BIGINT,
                view_count BIGINT,
                video_count INTEGER,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_channel_date ON channel_stats_history(channel_id, recorded_at)")
        
        # Monitored channels
        cur.execute("""
            CREATE TABLE IF NOT EXISTS monitored_channels (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                channel_id VARCHAR(255) NOT NULL,
                channel_name VARCHAR(255),
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP,
                UNIQUE(user_email, channel_id)
            )
        """)
        
        # Trending topics
        cur.execute("""
            CREATE TABLE IF NOT EXISTS trending_topics (
                id SERIAL PRIMARY KEY,
                keyword VARCHAR(500) NOT NULL,
                popularity_score INTEGER,
                growth_rate FLOAT,
                sentiment VARCHAR(50),
                lifecycle VARCHAR(50),
                region VARCHAR(100),
                category VARCHAR(100),
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_topic_date ON trending_topics(keyword, recorded_at)")
        
        # Saved items
        cur.execute("""
            CREATE TABLE IF NOT EXISTS saved_items (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                item_type VARCHAR(50) NOT NULL,
                item_id VARCHAR(255) NOT NULL,
                item_title VARCHAR(500),
                item_data JSONB,
                tags TEXT[],
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_email, item_type, item_id)
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_items(user_email)")
        
        # Filter presets
        cur.execute("""
            CREATE TABLE IF NOT EXISTS filter_presets (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                preset_name VARCHAR(255) NOT NULL,
                filter_config JSONB NOT NULL,
                feature_type VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_email, preset_name, feature_type)
            )
        """)
        
        # Notifications
        cur.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                notification_type VARCHAR(100),
                title VARCHAR(500),
                message TEXT,
                data JSONB,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_email, is_read)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_notif_composite ON notifications(user_email, is_read, created_at DESC)")
        
        # Export history
        cur.execute("""
            CREATE TABLE IF NOT EXISTS export_history (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                export_type VARCHAR(50),
                file_name VARCHAR(500),
                file_path VARCHAR(1000),
                data_summary JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Activity log
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_activity_log (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                activity_type VARCHAR(100),
                activity_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_email, created_at)")
        
        # Predictions history
        cur.execute("""
            CREATE TABLE IF NOT EXISTS predictions_history (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                video_title TEXT,
                video_description TEXT,
                video_tags TEXT,
                predicted_views INTEGER,
                confidence_score FLOAT,
                prediction_features JSONB,
                actual_views INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_pred_user ON predictions_history(user_email, created_at)")
        
        conn.commit()
        app.logger.info("Database tables initialized successfully")
    except Exception as e:
        app.logger.error(f"Error initializing database: {e}")
    finally:
        if cur:
            try:
                cur.close()
            except Exception:
                pass
        release_db_connection(conn)

# Initialize database tables on startup if database is accessible
try:
    init_db()
except Exception as _e:
    app.logger.warning(f"Initial DB check warning: {_e}")

# ===== ERROR HANDLING =====
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Server Error: {error}')
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({'error': 'Rate limit exceeded', 'message': str(e.description)}), 429

# ===== USER PROFILE & ACTIVITY ENDPOINTS =====

@api.route('/user/profile')
class UserProfile(Resource):
    @api.doc('get_user_profile')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Get user profile"""
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT email, full_name, avatar_url, preferences, notification_settings, created_at, last_login, login_count FROM users WHERE email=%s",
                (email,)
            )
            user = cur.fetchone()
            cur.close()
            return {"user": dict(user) if user else None}, 200
        except Exception as e:
            app.logger.error(f"Error in get_user_profile: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)
    
    @api.doc('update_user_profile')
    @token_required
    @limiter.limit("30 per minute")
    def put(self, email):
        """Update user profile"""
        data = request.json
        full_name = sanitize_input(data.get('full_name', ''))
        avatar_url = sanitize_input(data.get('avatar_url', ''))
        preferences = data.get('preferences')
        notification_settings = data.get('notification_settings')
        
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            
            updates = []
            params = []
            if full_name:
                updates.append("full_name=%s")
                params.append(full_name)
            if avatar_url:
                updates.append("avatar_url=%s")
                params.append(avatar_url)
            if preferences:
                updates.append("preferences=%s")
                params.append(json.dumps(preferences))
            if notification_settings:
                updates.append("notification_settings=%s")
                params.append(json.dumps(notification_settings))
            
            if updates:
                params.append(email)
                cur.execute(f"UPDATE users SET {','.join(updates)} WHERE email=%s", params)
                conn.commit()
            
            cur.close()
            return {"message": "Profile updated"}, 200
        except Exception as e:
            app.logger.error(f"Error in update_user_profile: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)

@api.route('/user/search-history')
class SearchHistory(Resource):
    @api.doc('get_search_history')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Get user's search history"""
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """SELECT * FROM search_history 
                   WHERE user_email=%s 
                   ORDER BY created_at DESC 
                   LIMIT 50""",
                (email,)
            )
            history = cur.fetchall()
            cur.close()
            return {"history": [dict(h) for h in history]}, 200
        except Exception as e:
            app.logger.error(f"Error in get_search_history: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)

@api.route('/user/activity')
class UserActivity(Resource):
    @api.doc('get_user_activity')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Get user's activity log"""
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """SELECT * FROM user_activity_log 
                   WHERE user_email=%s 
                   ORDER BY created_at DESC 
                   LIMIT 100""",
                (email,)
            )
            activity = cur.fetchall()
            cur.close()
            return {"activity": [dict(a) for a in activity]}, 200
        except Exception as e:
            app.logger.error(f"Error in get_user_activity: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)

# ===== SAVED ITEMS & NOTIFICATIONS =====
# -------------------- save_item --------------------
@api.route('/save_item')
class SaveItem(Resource):
    @api.doc('save_item')
    @token_required
    @limiter.limit("30 per minute")
    def post(self, email):
        """Save an item"""
        data = request.json
        item_type = sanitize_input(data.get('type', ''))
        item_id = sanitize_input(data.get('item_id', '')) or sanitize_input(data.get('keyword', ''))
        item_title = sanitize_input(data.get('keyword', ''))
        item_data = data.get('item_data', {})
        tags = [sanitize_input(tag) for tag in data.get('tags', [])]
        notes = sanitize_input(data.get('notes', ''))

        if not item_type or not item_id:
            return {"error": "item_type and item_id required"}, 400

        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500

        try:
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO saved_items (user_email, item_type, item_id, item_title, item_data, tags, notes) 
                   VALUES (%s,%s,%s,%s,%s,%s,%s) 
                   ON CONFLICT (user_email, item_type, item_id) 
                   DO UPDATE SET item_title=EXCLUDED.item_title, item_data=EXCLUDED.item_data, tags=EXCLUDED.tags, notes=EXCLUDED.notes 
                   RETURNING id""",
                (email, item_type, item_id, item_title, json.dumps(item_data), tags if tags else None, notes)
            )
            conn.commit()
            cur.close()
            return {"message": "Item saved"}, 201
        except Exception as e:
            app.logger.error(f"Error in save_item: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)


# -------------------- get_saved_items --------------------
@api.route('/get_saved_items')
class GetSavedItems(Resource):
    @api.doc('get_saved_items')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Get user's saved items"""
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500

        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM saved_items WHERE user_email=%s ORDER BY created_at DESC", (email,))
            items = cur.fetchall()
            cur.close()

            saved_items = []
            for item in items:
                d = dict(item)
                if isinstance(d.get("created_at"), datetime):
                    d["created_at"] = d["created_at"].isoformat()
                saved_items.append(d)

            return {"saved_items": saved_items}, 200
        except Exception as e:
            app.logger.error(f"Error in get_saved_items: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)

@api.route('/delete_saved_item')
class DeleteSavedItem(Resource):
    @api.doc('delete_saved_item')
    @token_required
    @limiter.limit("30 per minute")
    def delete(self, email):
        """Delete a saved item"""
        item_id = request.args.get('id')
        if not item_id:
            return {"error": "Item ID required"}, 400
        
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM saved_items WHERE id=%s AND user_email=%s", (item_id, email))
            conn.commit()
            cur.close()
            return {"message": "Item deleted"}, 200
        except Exception as e:
            app.logger.error(f"Error in delete_saved_item: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)

@api.route('/get_notifications')
class GetNotifications(Resource):
    @api.doc('get_notifications')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Get user notifications"""
        unread_only = request.args.get('unread_only') == 'true'
        
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            if unread_only:
                cur.execute("SELECT * FROM notifications WHERE user_email=%s AND is_read=FALSE ORDER BY created_at DESC", (email,))
            else:
                cur.execute("SELECT * FROM notifications WHERE user_email=%s ORDER BY created_at DESC LIMIT 50", (email,))
            notifications = cur.fetchall()
            cur.close()
            return {"notifications": [dict(n) for n in notifications]}, 200
        except Exception as e:
            app.logger.error(f"Error in get_notifications: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)

@api.route('/mark_notification_read')
class MarkNotificationRead(Resource):
    @api.doc('mark_notification_read')
    @token_required
    @limiter.limit("30 per minute")
    def post(self, email):
        """Mark notification as read"""
        data = request.json
        notification_id = data.get('notification_id')
        
        if not notification_id:
            return {"error": "Notification ID required"}, 400
        
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            cur.execute("UPDATE notifications SET is_read=TRUE WHERE id=%s AND user_email=%s", (notification_id, email))
            conn.commit()
            cur.close()
            return {"message": "Notification marked as read"}, 200
        except Exception as e:
            app.logger.error(f"Error in mark_notification_read: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)

@api.route('/create_notification')
class CreateNotification(Resource):
    @api.doc('create_notification')
    @token_required
    @limiter.limit("30 per minute")
    def post(self, email):
        """Create a notification"""
        data = request.json
        n_type = sanitize_input(data.get('notification_type', ''))
        title = sanitize_input(data.get('title', ''))
        message = sanitize_input(data.get('message', ''))
        payload = data.get('data', {})
        
        if not title or not message:
            return {"error": "title and message required"}, 400
        
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO notifications (user_email, notification_type, title, message, data) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (email, n_type, title, message, json.dumps(payload))
            )
            conn.commit()
            cur.close()
            return {"message": "Notification created"}, 201
        except Exception as e:
            app.logger.error(f"Error in create_notification: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)


def parse_published_date(published_raw: str):
    """Parse YouTube published date"""
    try:
        return datetime.strptime(published_raw, "%Y-%m-%dT%H:%M:%S.%fZ")
    except ValueError:
        try:
            return datetime.strptime(published_raw, "%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            return datetime.now(timezone.utc)

def format_channel_age(days: int) -> str:
    """Format channel age in human readable format"""
    years = days // 365
    months = (days % 365) // 30
    days_left = (days % 365) % 30
    parts = []
    
    if years > 0:
        parts.append(f"{years}y")
    if months > 0:
        parts.append(f"{months}m")
    if days_left > 0 or not parts:
        parts.append(f"{days_left}d")
    
    return " ".join(parts)
# ===== PREDICTIONS =====

@api.route('/predict_performance_realtime')
class PredictPerformanceRealtime(Resource):
    @api.doc('predict_performance_realtime')
    @token_required
    @limiter.limit("10 per minute")
    def post(self, email):
        """Predict video performance with real-time features"""
        try:
            data = request.json or {}
            title = sanitize_input(data.get("title", ""))
            description = sanitize_input(data.get("description", ""))
            tags = sanitize_input(data.get("tags", ""))
            category_id = data.get("category_id", "0")
            
            if not os.path.exists(MODEL_FILE) or not os.path.exists(SCALER_FILE):
                return {"error": "Model not trained yet. Please train the model first."}, 500
            
            features = fetch_realtime_youtube_features(title, description, tags, category_id)
            model = joblib.load(MODEL_FILE)
            scaler = joblib.load(SCALER_FILE)
            
            feature_array = [[
                features['title_length'],
                features['description_length'],
                features['tag_count'],
                features['category_id'],
                features['trending_match_score'],
                features['avg_competitor_views'],
                features['sentiment_score'],
                features['engagement_rate_estimate'],
                features['similar_video_count']
            ]]
            
            feature_array_scaled = scaler.transform(feature_array)
            prediction = int(model.predict(feature_array_scaled)[0])
            
            confidence_interval = {
                "lower": int(prediction * 0.8),
                "upper": int(prediction * 1.2),
                "confidence_score": round(0.75 + features['trending_match_score'] * 0.05, 2)
            }
            
            # Save prediction to DB
            conn = get_db_connection()
            if conn:
                try:
                    cur = conn.cursor()
                    cur.execute("""
                        INSERT INTO predictions_history
                        (user_email, video_title, video_description, video_tags, predicted_views, confidence_score, prediction_features)
                        VALUES (%s,%s,%s,%s,%s,%s,%s)
                    """, (email, title, description, tags, prediction, confidence_interval['confidence_score'], json.dumps(features)))
                    conn.commit()
                    cur.close()
                except Exception as e:
                    app.logger.error(f"Error storing prediction: {e}")
                finally:
                    release_db_connection(conn)
            
            return {
                "predicted_views_30d": prediction,
                "confidence_interval": confidence_interval,
                "features_analyzed": features,
                "recommendations": generate_recommendations(features)
            }, 200
        except Exception as e:
            app.logger.error(f"Error in predict_performance_realtime: {e}")
            return {"error": str(e)}, 400

@api.route('/predictions_history')
class PredictionsHistory(Resource):
    @api.doc('get_predictions_history')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Get user's predictions history"""
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """SELECT * FROM predictions_history 
                   WHERE user_email=%s 
                   ORDER BY created_at DESC 
                   LIMIT 50""",
                (email,)
            )
            predictions = cur.fetchall()
            cur.close()
            return {"predictions": [dict(p) for p in predictions]}, 200
        except Exception as e:
            app.logger.error(f"Error in get_predictions_history: {e}")
            return {"error": str(e)}, 500
        finally:
            release_db_connection(conn)

# ===== VIDEO SEARCH & ANALYTICS =====

@api.route('/search_videos')
class SearchVideos(Resource):
    @api.doc('search_videos')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Search YouTube videos with advanced filters"""
        query = sanitize_input(request.args.get('query', ''))
        if not query:
            return {"error": "Query required"}, 400
        
        # Log search activity
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                cur.execute("INSERT INTO user_activity_log (user_email, activity_type, activity_data) VALUES (%s,%s,%s)",
                            (email, 'video_search', json.dumps({"query": query})))
                conn.commit()
                cur.close()
            except:
                pass
            finally:
                release_db_connection(conn)
        
        # Check cache
        cache_key = f"search_videos_{hashlib.md5(str(request.args).encode()).hexdigest()}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data, 200
        
        duration_filter = request.args.get('duration')
        date_filter = request.args.get('date')
        type_filter = request.args.get('type')
        language = request.args.get('language', 'en')
        use_cache = request.args.get('use_cache', 'true') == 'true'
        
        try:
            limit = max(1, min(int(request.args.get('limit', 10)), 50))
        except ValueError:
            limit = 10
        
        sort = request.args.get('sort', 'relevance')
        
        params = build_search_params(query, duration_filter, date_filter, type_filter, language)
        if not youtube:
            return {"error": "YouTube API not configured"}, 500
        
        try:
            search_resp = youtube.search().list(**params).execute()
            query_terms = query.lower().split()
            videos = []
            
            items = search_resp.get('items', [])
            video_ids = [item['id']['videoId'] for item in items if item.get('id', {}).get('videoId')]
            
            # Batch fetch all video statistics in a single outbound request (eliminates N individual calls)
            stats_cache = {}
            if video_ids and youtube:
                try:
                    stats_response = youtube.videos().list(part="statistics", id=','.join(video_ids[:50])).execute()
                    for v_item in stats_response.get("items", []):
                        st = v_item.get("statistics", {})
                        stats_cache[v_item["id"]] = (
                            int(st.get("viewCount", 0)),
                            int(st.get("likeCount", 0)),
                            int(st.get("commentCount", 0))
                        )
                except Exception as e:
                    app.logger.warning(f"Batched stats retrieval fallback: {e}")

            for item in items:
                vid = item['id'].get('videoId')
                if not vid:
                    continue
                
                snip = item['snippet']
                title = snip.get("title", "")
                desc = snip.get("description", "")
                views, likes, comments_count = stats_cache.get(vid) if vid in stats_cache else get_video_stats(vid)
                avg_sentiment = analyze_sentiment(vid)
                sentiment = sentiment_label(avg_sentiment)
                cscore, rscore, fscore = calculate_scores(title, desc, views, likes, comments_count, avg_sentiment, query_terms)
                
                videos.append({
                    "videoId": vid,
                    "title": title,
                    "description": desc,
                    "thumbnail": snip.get("thumbnails", {}).get("high", {}).get("url"),
                    "channelTitle": snip.get("channelTitle"),
                    "views": views,
                    "likes": likes,
                    "commentsCount": comments_count,
                    "sentimentScore": avg_sentiment,
                    "sentiment": sentiment,
                    "customScore": round(cscore, 2),
                    "relevanceScore": rscore,
                    "finalScore": round(fscore, 2),
                    "publishedAt": snip.get("publishedAt"),
                })
            
            # Sort results
            if sort == "views":
                videos.sort(key=lambda x: x["views"], reverse=True)
            elif sort == "likes":
                videos.sort(key=lambda x: x["likes"], reverse=True)
            elif sort == "comments":
                videos.sort(key=lambda x: x["commentsCount"], reverse=True)
            else:
                videos.sort(key=lambda x: x["finalScore"], reverse=True)
            
            result = {"videos": videos[:limit], "cached": False, "timestamp": time.time()}
            
            # Cache the result
            cache_set(cache_key, result)
            
            return result, 200
        except HttpError as e:
            app.logger.error(f"YouTube API error in search_videos: {e}")
            return {"error": "YouTube API search failed"}, 500

@api.route('/refresh_video_metrics')
class RefreshVideoMetrics(Resource):
    @api.doc('refresh_video_metrics')
    @token_required
    @limiter.limit("10 per minute")
    def post(self, email):
        """Refresh metrics for specific videos"""
        data = request.json or {}
        video_ids = data.get('video_ids', [])
        if not video_ids:
            return {"error": "video_ids required"}, 400
        
        try:
            updated_videos = []
            for vid in video_ids:
                views, likes, comments_count = get_video_stats(vid)
                avg_sentiment = analyze_sentiment(vid)
                sentiment = sentiment_label(avg_sentiment)
                updated_videos.append({
                    "videoId": vid, 
                    "views": views, 
                    "likes": likes, 
                    "commentsCount": comments_count, 
                    "sentimentScore": avg_sentiment, 
                    "sentiment": sentiment
                })
            return {"videos": updated_videos}, 200
        except Exception as e:
            app.logger.error(f"Error in refresh_video_metrics: {e}")
            return {"error": str(e)}, 500
# ===== CHANNEL ENDPOINTS =====
@api.route('/search_channels_by_name')
class SearchChannelsByName(Resource):
    @api.doc('search_channels_by_name')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Search channels by name"""
        name = sanitize_input(request.args.get('name', ''))
        if not name or not youtube:
            return {"error": "Invalid request"}, 400
        
        try:
            # First search for channels
            search_response = youtube.search().list(
                q=name, 
                part='id,snippet', 
                type='channel', 
                maxResults=10
            ).execute()
            
            channel_ids = []
            for item in search_response.get('items', []):
                if item['id'].get('channelId'):
                    channel_ids.append(item['id']['channelId'])
            
            if not channel_ids:
                return {"channels": []}, 200
            
            # Get detailed channel information
            channels_response = youtube.channels().list(
                id=','.join(channel_ids),
                part='snippet,statistics',
                maxResults=10
            ).execute()
            
            channels = []
            for channel in channels_response.get('items', []):
                snippet = channel.get('snippet', {})
                statistics = channel.get('statistics', {})
                
                channels.append({
                    'channelId': channel['id'],
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', ''),
                    'thumbnail': snippet.get('thumbnails', {}).get('default', {}).get('url', ''),
                    'subscriberCount': int(statistics.get('subscriberCount', 0))
                })
            
            return {"channels": channels}, 200
        except Exception as e:
            app.logger.error(f"Error in search_channels_by_name: {e}")
            return {"error": "Search failed"}, 500

@api.route('/channel_performance', methods=['GET'])
class ChannelPerformance(Resource):
    @api.doc('channel_performance')
    @token_required
    @limiter.limit("15 per minute")
    def get(self, email):
        """Fetch YouTube channel performance metrics"""
        channel_id = request.args.get('channel_id', '').strip()
        if not channel_id:
            return {"error": "Missing channel_id"}, 400

        if not youtube:
            return {"error": "YouTube API not configured"}, 500

        try:
            # Fetch channel statistics
            channel_resp = youtube.channels().list(
                part="snippet,statistics,contentDetails",
                id=channel_id
            ).execute()

            if not channel_resp.get("items"):
                return {"error": "Channel not found"}, 404

            channel = channel_resp["items"][0]
            snippet = channel.get("snippet", {})
            stats = channel.get("statistics", {})

            # Compute channel info
            published_at = snippet.get("publishedAt", "")
            view_count = int(stats.get("viewCount", 0))
            sub_count = int(stats.get("subscriberCount", 0))
            video_count = int(stats.get("videoCount", 0))

            # Calculate channel age
            from datetime import datetime
            created_date = datetime.strptime(published_at, "%Y-%m-%dT%H:%M:%SZ")
            days_active = max((datetime.utcnow() - created_date).days, 1)
            channel_age_pretty = f"{days_active // 365} years" if days_active >= 365 else f"{days_active} days"

            avg_views_per_video = round(view_count / max(video_count, 1))
            views_per_day = round(view_count / days_active, 2)
            subs_to_views_ratio = round((sub_count / max(view_count, 1)) * 100, 2)

            # Fetch recent videos
            uploads_playlist = channel["contentDetails"]["relatedPlaylists"]["uploads"]
            videos_resp = youtube.playlistItems().list(
                playlistId=uploads_playlist,
                part="snippet,contentDetails",
                maxResults=10
            ).execute()

            video_stats = []
            for item in videos_resp.get("items", []):
                video_id = item["contentDetails"]["videoId"]
                vid_details = youtube.videos().list(
                    part="statistics,snippet",
                    id=video_id
                ).execute()

                if vid_details["items"]:
                    v = vid_details["items"][0]
                    s = v["statistics"]
                    snip = v["snippet"]
                    video_stats.append({
                        "id": video_id,
                        "title": snip.get("title", ""),
                        "views": int(s.get("viewCount", 0)),
                        "likes": int(s.get("likeCount", 0)),
                        "comments": int(s.get("commentCount", 0)),
                        "publishedAt": snip.get("publishedAt", "")
                    })

            channel_info = {
                "id": channel_id,
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "profile_picture": snippet["thumbnails"]["default"]["url"],
                "banner_image": snippet["thumbnails"].get("high", {}).get("url"),
                "viewCount": view_count,
                "subscriberCount": sub_count,
                "videoCount": video_count,
                "publishedAt": published_at,
                "channelAgePretty": channel_age_pretty,
                "avgViewsPerVideo": avg_views_per_video,
                "viewsPerDay": views_per_day,
                "subsToViewsRatio": subs_to_views_ratio
            }

            return {
                "channel_info": channel_info,
                "video_stats": video_stats
            }, 200

        except HttpError as e:
            app.logger.error(f"YouTube API Error: {e}")
            return {"error": "YouTube API quota exceeded or invalid channel ID"}, 500
        except Exception as e:
            app.logger.error(f"Error in channel_performance: {e}")
            return {"error": f"Internal server error: {str(e)}"}, 500

# -------------------- topic_trends --------------------
@api.route('/topic_trends')
class TopicTrends(Resource):
    @api.doc('topic_trends')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Get trending topics for a region"""
        try:
            region = request.args.get("region", "IN")
            category = request.args.get("category", "0")
            cache_key = f"topic_trends_{region}_{category}"

            # Check cache first
            cached_data = cache_get(cache_key)
            if cached_data:
                return {"trends": cached_data, "cached": True}, 200

            if not youtube:
                return {"error": "YouTube API not configured"}, 500

            params = {
                "part": "snippet",
                "chart": "mostPopular",
                "regionCode": region,
                "maxResults": 25,
            }

            if category != "0":
                params["videoCategoryId"] = category

            resp = youtube.videos().list(**params).execute()
            app.logger.info(f"Fetched {len(resp.get('items', []))} videos from YouTube API")

            words = []
            for item in resp.get("items", []):
                snippet = item.get("snippet", {})
                title = snippet.get("title", "")
                tags = snippet.get("tags", []) or []
                text = title + " " + " ".join(tags)
                words += [w.lower() for w in re.findall(r"\w+", text) if len(w) > 1]

            counter = Counter(words)
            most_common = counter.most_common(10)
            trends = []

            for word, freq in most_common:
                trends.append({
                    "keyword": word,
                    "popularity": freq * 10,
                    "growthRate": round((freq / max(1, most_common[0][1])) * 100, 2),
                    "type": "trend"
                })

            cache_set(cache_key, trends, TREND_CACHE_TTL)
            return {"trends": trends, "cached": False}, 200

        except HttpError as e:
            app.logger.error(f"YouTube API error in topic_trends: {e}")
            return {"error": "YouTube API request failed"}, 500
        except Exception as e:
            app.logger.error(f"Error in topic_trends: {e}")
            return {"error": f"Failed to fetch topic trends: {str(e)}"}, 500


# ===== HELPER FUNCTIONS FOR CHANNEL ANALYSIS =====


def fetch_recent_videos(channel_id: str, max_results: int = 10) -> list:
    """Fetch recent videos from a channel"""
    if not youtube:
        return []
    
    try:
        search_response = youtube.search().list(
            part='snippet',
            channelId=channel_id,
            maxResults=max_results,
            order='date',
            type='video'
        ).execute()
        
        video_ids = []
        for item in search_response.get('items', []):
            if item['id'].get('videoId'):
                video_ids.append(item['id']['videoId'])
        
        return video_ids
        
    except Exception as e:
        app.logger.error(f"Error fetching recent videos: {e}")
        return []

def compute_video_stats(video_ids: list) -> tuple:
    """Compute statistics for a list of videos"""
    if not video_ids or not youtube:
        return [], {}
    
    try:
        # Get video details
        videos_response = youtube.videos().list(
            id=','.join(video_ids),
            part='snippet,statistics'
        ).execute()
        
        video_stats = []
        engagement_rates = []
        total_likes = 0
        total_comments = 0
        total_views = 0
        
        for video in videos_response.get('items', []):
            statistics = video.get('statistics', {})
            snippet = video.get('snippet', {})
            
            views = int(statistics.get('viewCount', 0))
            likes = int(statistics.get('likeCount', 0))
            comments = int(statistics.get('commentCount', 0))
            
            total_views += views
            total_likes += likes
            total_comments += comments
            
            # Calculate engagement rate
            if views > 0:
                engagement_rate = ((likes + comments) / views) * 100
                engagement_rates.append(engagement_rate)
            
            video_stats.append({
                'id': video.get('id', ''),
                'title': snippet.get('title', ''),
                'views': views,
                'likes': likes,
                'comments': comments,
                'publishedAt': snippet.get('publishedAt', '')
            })
        
        # Sort by publish date
        video_stats.sort(key=lambda x: x.get('publishedAt', ''), reverse=True)
        
        # Calculate aggregates
        aggregates = {
            'avgEngagementRate': round(sum(engagement_rates) / len(engagement_rates), 2) if engagement_rates else 0,
            'avgLikesPerVideo': total_likes // max(1, len(video_stats)),
            'avgCommentsPerVideo': total_comments // max(1, len(video_stats)),
            'likesPercent': round((total_likes / total_views) * 100, 2) if total_views > 0 else 0,
            'commentsPercent': round((total_comments / total_views) * 100, 2) if total_views > 0 else 0
        }
        
        return video_stats, aggregates
        
    except Exception as e:
        app.logger.error(f"Error compute_video_stats: {e}")
        return [], {}

@api.route('/channel_comparison')
class ChannelComparison(Resource):
    @api.doc('channel_comparison')
    @token_required
    @limiter.limit("20 per minute")
    def post(self, email):
        """Compare multiple channels"""
        data = request.json or {}
        channel_ids = data.get('channel_ids', [])
        
        if not channel_ids or len(channel_ids) < 2:
            return {"error": "At least 2 channel IDs required for comparison"}, 400
        
        if len(channel_ids) > 5:
            return {"error": "Maximum 5 channels can be compared at once"}, 400
        
        if not youtube:
            return {"error": "YouTube API not configured"}, 500
        
        try:
            comparison_data = []
            
            for channel_id in channel_ids:
                try:
                    # Get channel details
                    channel_response = youtube.channels().list(
                        part='snippet,statistics',
                        id=channel_id
                    ).execute()
                    
                    if not channel_response.get('items'):
                        continue
                    
                    channel_data = channel_response['items'][0]
                    snippet = channel_data.get('snippet', {})
                    statistics = channel_data.get('statistics', {})
                    
                    # Parse published date
                    published_date = parse_published_date(snippet.get('publishedAt'))
                    channel_age_days = (datetime.now(timezone.utc) - published_date).days
                    
                    # Calculate metrics
                    total_views = int(statistics.get('viewCount', 0))
                    total_videos = int(statistics.get('videoCount', 0))
                    total_subs = int(statistics.get('subscriberCount', 0))
                    
                    # Get recent videos for engagement rate
                    video_ids = fetch_recent_videos(channel_id)
                    _, aggregates = compute_video_stats(video_ids)
                    
                    comparison_data.append({
                        'channelId': channel_id,
                        'title': snippet.get('title', ''),
                        'thumbnail': snippet.get('thumbnails', {}).get('default', {}).get('url', ''),
                        'subscriberCount': total_subs,
                        'viewCount': total_views,
                        'videoCount': total_videos,
                        'channelAgeDays': channel_age_days,
                        'avgViewsPerVideo': total_views // max(1, total_videos),
                        'viewsPerDay': round(total_views / max(1, channel_age_days), 2) if channel_age_days > 0 else 0,
                        'subsToViewsRatio': round((total_subs / max(1, total_views)) * 100, 2) if total_views > 0 else 0,
                        'avgEngagementRate': aggregates.get('avgEngagementRate', 0),
                        'avgLikesPerVideo': aggregates.get('avgLikesPerVideo', 0),
                        'avgCommentsPerVideo': aggregates.get('avgCommentsPerVideo', 0)
                    })
                    
                except Exception as e:
                    app.logger.error(f"Error processing channel {channel_id}: {e}")
                    continue
            
            # Sort by subscriber count
            comparison_data.sort(key=lambda x: x['subscriberCount'], reverse=True)
            
            # Log activity
            conn = get_db_connection()
            if conn:
                try:
                    cur = conn.cursor()
                    cur.execute(
                        "INSERT INTO user_activity_log (user_email, activity_type, activity_data) VALUES (%s,%s,%s)",
                        (email, 'channel_comparison', json.dumps({
                            'channel_count': len(comparison_data),
                            'channel_ids': channel_ids
                        }))
                    )
                    conn.commit()
                    cur.close()
                except Exception as e:
                    app.logger.error(f"Error logging activity: {e}")
                finally:
                    release_db_connection(conn)
            
            return {"comparison": comparison_data}, 200
            
        except HttpError as e:
            app.logger.error(f"YouTube API error in channel_comparison: {e}")
            return {"error": "Failed to compare channels"}, 500
        except Exception as e:
            app.logger.error(f"Error in channel_comparison: {e}")
            return {"error": "Failed to compare channels"}, 500

@api.route('/channel_growth_trend')
class ChannelGrowthTrend(Resource):
    @api.doc('channel_growth_trend')
    @token_required
    @limiter.limit("20 per minute")
    def get(self, email):
        """Get channel growth trend over time"""
        channel_id = request.args.get('channel_id')
        days = int(request.args.get('days', 30))
        
        if not channel_id:
            return {"error": "Channel ID is required"}, 400
        
        if days > 365:
            return {"error": "Maximum 365 days allowed"}, 400
        
        # Check database for historical data
        conn = get_db_connection()
        if not conn:
            return {"error": "Database error"}, 500
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get historical stats from database
            cur.execute(
                """SELECT * FROM channel_stats_history 
                   WHERE channel_id=%s 
                   AND recorded_at >= NOW() - INTERVAL '%s days'
                   ORDER BY recorded_at ASC""",
                (channel_id, days)
            )
            
            historical_data = cur.fetchall()
            cur.close()
            
            if not historical_data:
                # If no historical data, return current stats
                channel_response = youtube.channels().list(
                    part='statistics',
                    id=channel_id
                ).execute()
                
                if channel_response.get('items'):
                    stats = channel_response['items'][0]['statistics']
                    return {
                        "trend": [{
                            "date": datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                            "subscribers": int(stats.get('subscriberCount', 0)),
                            "views": int(stats.get('viewCount', 0)),
                            "videos": int(stats.get('videoCount', 0))
                        }],
                        "message": "No historical data available. Showing current stats."
                    }, 200
                else:
                    return {"error": "Channel not found"}, 404
            
            # Format trend data
            trend_data = []
            for record in historical_data:
                trend_data.append({
                    "date": record['recorded_at'].strftime('%Y-%m-%d'),
                    "subscribers": record['subscriber_count'],
                    "views": record['view_count'],
                    "videos": record['video_count']
                })
            
            # Calculate growth rates
            if len(trend_data) > 1:
                first_record = trend_data[0]
                last_record = trend_data[-1]
                
                subscriber_growth = ((last_record['subscribers'] - first_record['subscribers']) / max(1, first_record['subscribers'])) * 100
                view_growth = ((last_record['views'] - first_record['views']) / max(1, first_record['views'])) * 100
                
                return {
                    "trend": trend_data,
                    "growth_rates": {
                        "subscriber_growth_percent": round(subscriber_growth, 2),
                        "view_growth_percent": round(view_growth, 2),
                        "period_days": days
                    }
                }, 200
            else:
                return {"trend": trend_data}, 200
                
        except Exception as e:
            app.logger.error(f"Error in channel_growth_trend: {e}")
            return {"error": "Failed to fetch growth trend"}, 500
        finally:
            release_db_connection(conn)

@api.route('/upload_thumbnail')
class UploadThumbnail(Resource):
    @api.doc('upload_thumbnail')
    @token_required
    @limiter.limit("10 per minute")
    def post(self, email):
        """Upload thumbnail for A/B testing"""
        video_id = sanitize_input(request.form.get("videoId", ""))
        if not video_id:
            return {"error": "videoId is required"}, 400
        
        if "file" not in request.files:
            return {"error": "No file uploaded"}, 400
        
        file = request.files["file"]
        if file.filename == "":
            return {"error": "No selected file"}, 400
        
        if not allowed_file(file.filename):
            return {"error": "Invalid file type"}, 400
        
        filename = secure_filename(f"{video_id}_{file.filename}")
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        file_url = f"/uploads/{filename}"
        
        if video_id not in video_thumbnails:
            video_thumbnails[video_id] = []
        
        video_thumbnails[video_id].append(file_url)
        
        return {
            "message": "Thumbnail uploaded successfully", 
            "videoId": video_id, 
            "url": file_url, 
            "all_thumbnails": video_thumbnails[video_id]
        }, 201

@api.route('/track_impression')
class TrackImpression(Resource):
    @api.doc('track_impression')
    @token_required
    @limiter.limit("100 per minute")
    def post(self, email):
        """Track thumbnail impression"""
        data = request.json or {}
        video_id = sanitize_input(data.get("videoId", ""))
        thumbnail_url = sanitize_input(data.get("thumbnailUrl", ""))
        
        if not video_id or not thumbnail_url:
            return {"error": "videoId and thumbnailUrl required"}, 400
        
        if video_id not in thumbnail_stats:
            thumbnail_stats[video_id] = {}
        
        if thumbnail_url not in thumbnail_stats[video_id]:
            thumbnail_stats[video_id][thumbnail_url] = {"clicks": 0, "impressions": 0}
        
        thumbnail_stats[video_id][thumbnail_url]["impressions"] += 1
        
        return {
            "message": "Impression tracked", 
            "videoId": video_id, 
            "thumbnailUrl": thumbnail_url, 
            "impressions": thumbnail_stats[video_id][thumbnail_url]["impressions"]
        }, 200

@api.route('/track_click')
class TrackClick(Resource):
    @api.doc('track_click')
    @token_required
    @limiter.limit("100 per minute")
    def post(self, email):
        """Track thumbnail click"""
        data = request.json or {}
        video_id = sanitize_input(data.get("videoId", ""))
        thumbnail_url = sanitize_input(data.get("thumbnailUrl", ""))
        
        if not video_id or not thumbnail_url:
            return {"error": "videoId and thumbnailUrl required"}, 400
        
        if video_id not in thumbnail_stats:
            thumbnail_stats[video_id] = {}
        
        if thumbnail_url not in thumbnail_stats[video_id]:
            thumbnail_stats[video_id][thumbnail_url] = {"clicks": 0, "impressions": 0}
        
        thumbnail_stats[video_id][thumbnail_url]["clicks"] += 1
        
        return {
            "message": "Click tracked", 
            "videoId": video_id, 
            "thumbnailUrl": thumbnail_url, 
            "clicks": thumbnail_stats[video_id][thumbnail_url]["clicks"]
        }, 200

@api.route('/get_stats/<video_id>')
class GetThumbnailStats(Resource):
    @api.doc('get_thumbnail_stats')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email, video_id):
        """Get thumbnail A/B test statistics"""
        if video_id not in thumbnail_stats:
            return {"videoId": video_id, "thumbnails": {}}, 200
        
        stats = {}
        for thumb, data in thumbnail_stats[video_id].items():
            impressions = data["impressions"]
            clicks = data["clicks"]
            ctr = (clicks / impressions * 100) if impressions > 0 else 0
            stats[thumb] = {
                "clicks": clicks, 
                "impressions": impressions, 
                "ctr": round(ctr, 2)
            }
        
        return {"videoId": video_id, "thumbnails": stats}, 200

# ===== SEO AND KEYWORD ENDPOINTS =====
@api.route('/video_seo_analysis', methods=['POST'])
class VideoSEOAnalysis(Resource):
    @api.doc('video_seo_analysis')
    @token_required
    @limiter.limit("30 per minute")
    def post(self, email):
        """Get SEO analysis for a video keyword"""
        # Accept both JSON body and query params
        data = request.json or {}
        keyword = sanitize_input(data.get('keyword', ''))
        if not keyword:
            keyword = sanitize_input(request.args.get('keyword', ''))

        if not keyword:
            return {"error": "Missing 'keyword' parameter"}, 400

        if not youtube:
            return {"error": "YouTube API not configured"}, 500

        try:
            # --- YouTube Search ---
            search_resp = youtube.search().list(
                q=keyword,
                part='id,snippet',
                type='video',
                maxResults=10,
                order='relevance'
            ).execute()

            video_ids = [i['id']['videoId'] for i in search_resp.get('items', []) if i['id'].get('videoId')]
            if not video_ids:
                return {"recommendations": {
                    "titles": [],
                    "descriptions": [],
                    "tags": [],
                    "top_videos": []
                }, "seo_score": 0}, 200

            videos_resp = youtube.videos().list(
                id=','.join(video_ids),
                part='snippet,statistics'
            ).execute()

            recommendations = {'titles': [], 'descriptions': [], 'tags': set(), 'top_videos': []}

            for item in videos_resp.get('items', []):
                snippet = item.get('snippet', {})
                stats = item.get('statistics', {})
                title = snippet.get('title', 'N/A')
                desc = snippet.get('description', 'N/A')
                tags = snippet.get('tags', []) or []

                recommendations['titles'].append(title)
                recommendations['descriptions'].append(desc)
                recommendations['tags'].update(tags)
                recommendations['top_videos'].append({
                    'title': title,
                    'channelTitle': snippet.get('channelTitle', 'N/A'),
                    'viewCount': stats.get('viewCount', '0'),
                    'videoId': item.get('id', 'N/A'),
                    'url': f"https://www.youtube.com/watch?v={item.get('id', 'N/A')}"
                })

            # Convert tags set → list
            recommendations['tags'] = list(recommendations['tags'])

            # Extract common words from titles for keyword relevance
            all_title_words = " ".join(recommendations["titles"]).lower().split()
            common_words = [w for w, _ in Counter(all_title_words).most_common(20)]
            recommendations["common_words"] = common_words

            # --- Scoring Logic (more accurate) ---
            def compute_score(recommendations, keyword):
                score = 0
                keyword_lower = keyword.lower()

                # Title relevance (20 points)
                title_matches = sum(keyword_lower in t.lower() for t in recommendations["titles"])
                title_score = min(20, (title_matches / max(1, len(recommendations["titles"]))) * 20)
                score += title_score

                # Description relevance (20 points)
                desc_matches = sum(keyword_lower in d.lower() for d in recommendations["descriptions"])
                desc_score = min(20, (desc_matches / max(1, len(recommendations["descriptions"]))) * 20)
                score += desc_score

                # Tag diversity (20 points)
                tag_score = min(20, len(set(recommendations["tags"])) / 20 * 20)
                score += tag_score

                # Engagement proxy via view counts (20 points)
                views = [int(v["viewCount"]) for v in recommendations["top_videos"] if v["viewCount"].isdigit()]
                if views:
                    avg_views = sum(views) / len(views)
                    view_score = min(20, (avg_views / 1_000_000) * 20)
                else:
                    view_score = 0
                score += view_score

                # Keyword frequency in common words (20 points)
                if keyword_lower in [w.lower() for w in recommendations["common_words"]]:
                    keyword_score = 15
                else:
                    keyword_score = 5
                score += keyword_score

                total = round(min(100, score), 2)
                return total, title_score, desc_score, tag_score, view_score, keyword_score

            # Compute SEO Score
            seo_score, title_score, desc_score, tag_score, view_score, keyword_score = compute_score(recommendations, keyword)

            # Return full response
            return {
                "recommendations": recommendations,
                "seo_score": seo_score,
                "score_breakdown": {
                    "titles": round(title_score, 2),
                    "descriptions": round(desc_score, 2),
                    "tags": round(tag_score, 2),
                    "views": round(view_score, 2),
                    "keyword_presence": keyword_score
                }
            }, 200

        except HttpError as e:
            app.logger.error(f"YouTube API error in seo_analysis: {e}")
            return {"error": f"YouTube API Error: {str(e)}"}, 500

        except Exception as e:
            app.logger.error(f"General error in seo_analysis: {e}")
            return {"error": f"Internal server error: {str(e)}"}, 500

# ===== SOCIAL SHARING ENDPOINTS =====

@api.route('/social_share')
class SocialShare(Resource):
    @api.doc('social_share')
    @token_required
    @limiter.limit("10 per minute")
    def post(self, email):
        """Share video on social media platforms"""
        data = request.json or {}
        video_id = sanitize_input(data.get('videoId', ''))
        platforms = data.get('platforms', [])
        custom_message = sanitize_input(data.get('message', ''))
        
        if not video_id or not platforms:
            return {"error": "Missing video ID or platforms"}, 400
        
        results = perform_real_share(video_id, platforms, custom_message)
        failed = [r for r in results if r.get('status') != 'success']
        
        if failed:
            return {
                "message": "Some shares failed", 
                "results": results, 
                "failed_platforms": [f['platform'] for f in failed]
            }, 500
        
        return {"message": "Shared successfully", "results": results}, 200

@api.route('/schedule_share')
class ScheduleShare(Resource):
    @api.doc('schedule_share')
    @token_required
    @limiter.limit("10 per minute")
    def post(self, email):
        """Schedule social media share"""
        data = request.json or {}
        video_id = sanitize_input(data.get('videoId', ''))
        platforms = data.get('platforms', [])
        custom_message = sanitize_input(data.get('message', ''))
        scheduled_time_str = data.get('scheduledTime')
        
        if not video_id or not platforms or not scheduled_time_str:
            return {"error": "Missing video ID, platforms, or scheduled time"}, 400
        
        try:
            scheduled_time = datetime.fromisoformat(scheduled_time_str)
            now = datetime.now()
            delay = (scheduled_time - now).total_seconds()
            
            if delay <= 0:
                return {"error": "Scheduled time must be in the future"}, 400
            
            timer = Timer(delay, perform_real_share, args=[video_id, platforms, custom_message])
            timer.start()
            
            return {
                "message": f"Share scheduled for {scheduled_time_str}", 
                "scheduledTime": scheduled_time_str
            }, 200
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DDTHH:MM:SS"}, 400

# ===== COMPETITOR ANALYSIS ENDPOINTS =====

@api.route('/competitor_analysis')
class CompetitorAnalysis(Resource):
    @api.doc('competitor_analysis')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """Analyze competitor channels"""
        channel_ids_str = request.args.get('channel_ids')
        if not channel_ids_str:
            return {"error": "Channel IDs are required"}, 400
        
        channel_ids = channel_ids_str.split(',')
        analysis = []
        
        for cid in channel_ids:
            try:
                ch_stats = get_channel_stats(cid)
                if not ch_stats:
                    continue
                
                vids = fetch_recent_videos(cid)
                vstats, agg = compute_video_stats(vids)
                analysis.append({
                    "channelInfo": ch_stats, 
                    "videoTrend": vstats, 
                    "aggregates": agg
                })
            except Exception as e:
                app.logger.error(f"Error analyzing channel {cid}: {e}")
                continue
        
        return analysis, 200

# ===== DASHBOARD ENDPOINTS =====


# ===== HELPER FUNCTIONS =====

def allowed_file(filename):
    """Check if file extension is allowed"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def build_search_params(query, duration_filter, date_filter, type_filter, language='en'):
    """Build YouTube search parameters"""
    params = {
        'q': query, 
        'part': 'id,snippet', 
        'maxResults': 50, 
        'type': 'video', 
        'relevanceLanguage': language, 
        'safeSearch': 'moderate'
    }
    
    if duration_filter in ['long', 'medium', 'short']:
        params['videoDuration'] = duration_filter
    
    if date_filter:
        now = datetime.now(timezone.utc)
        mapping = {
            'last_hour': timedelta(hours=1),
            'today': timedelta(days=1),
            'this_week': timedelta(weeks=1),
            'this_month': timedelta(days=30),
            'this_year': timedelta(days=365),
        }
        if date_filter in mapping:
            params['publishedAfter'] = (now - mapping[date_filter]).isoformat()
    
    if type_filter in ['live', 'upcoming', 'completed']:
        params['eventType'] = type_filter
    
    return params

def get_video_stats(video_id):
    """Get video statistics from YouTube API"""
    if not youtube:
        return 0, 0, 0
    try:
        stats_response = youtube.videos().list(part="statistics", id=video_id).execute()
        stats = stats_response["items"][0]["statistics"]
        return (
            int(stats.get("viewCount", 0)), 
            int(stats.get("likeCount", 0)), 
            int(stats.get("commentCount", 0))
        )
    except Exception:
        return 0, 0, 0

def analyze_sentiment(video_id):
    """Analyze sentiment of video comments"""
    if not youtube:
        return 0.0
    try:
        comments = youtube.commentThreads().list(
            part="snippet", 
            videoId=video_id, 
            maxResults=30, 
            textFormat="plainText"
        ).execute()
        
        total = 0.0
        count = 0
        for c in comments.get("items", []):
            text = c["snippet"]["topLevelComment"]["snippet"].get("textDisplay", "")
            if text:
                total += TextBlob(text).sentiment.polarity
                count += 1
        
        return round(total / max(1, count), 2)
    except HttpError:
        return 0.0

def sentiment_label(score: float) -> str:
    """Get sentiment label from score"""
    if score > 0.2: return "Positive"
    if score < -0.2: return "Negative"
    return "Neutral"

def calculate_scores(title, description, views, likes, comments_count, sentiment, query_terms):
    """Calculate video relevance and custom scores"""
    custom_score = (likes * 2 + comments_count * 3) * (1 + sentiment) + (views * 0.1)
    relevance_score = sum(1 for term in query_terms if term in (title + " " + description).lower())
    final_score = custom_score + (relevance_score * 50)
    return custom_score, relevance_score, final_score

def fetch_recent_videos(channel_id: str, max_results: int = 10) -> list:
    """Fetch recent videos from a channel"""
    if not youtube:
        return []
    
    try:
        search_response = youtube.search().list(
            part='snippet',
            channelId=channel_id,
            maxResults=max_results,
            order='date',
            type='video'
        ).execute()
        
        video_ids = []
        for item in search_response.get('items', []):
            if item['id'].get('videoId'):
                video_ids.append(item['id']['videoId'])
        
        return video_ids
        
    except Exception as e:
        app.logger.error(f"Error fetching recent videos: {e}")
        return []

def compute_video_stats(video_ids: list) -> tuple:
    """Compute statistics for a list of videos"""
    if not video_ids or not youtube:
        return [], {}
    
    try:
        # Get video details
        videos_response = youtube.videos().list(
            id=','.join(video_ids),
            part='snippet,statistics'
        ).execute()
        
        video_stats = []
        engagement_rates = []
        total_likes = 0
        total_comments = 0
        total_views = 0
        
        for video in videos_response.get('items', []):
            statistics = video.get('statistics', {})
            snippet = video.get('snippet', {})
            
            views = int(statistics.get('viewCount', 0))
            likes = int(statistics.get('likeCount', 0))
            comments = int(statistics.get('commentCount', 0))
            
            total_views += views
            total_likes += likes
            total_comments += comments
            
            # Calculate engagement rate
            if views > 0:
                engagement_rate = ((likes + comments) / views) * 100
                engagement_rates.append(engagement_rate)
            
            video_stats.append({
                'id': video.get('id', ''),
                'title': snippet.get('title', ''),
                'views': views,
                'likes': likes,
                'comments': comments,
                'publishedAt': snippet.get('publishedAt', '')
            })
        
        # Sort by publish date
        video_stats.sort(key=lambda x: x.get('publishedAt', ''), reverse=True)
        
        # Calculate aggregates
        aggregates = {
            'avgEngagementRate': round(sum(engagement_rates) / len(engagement_rates), 2) if engagement_rates else 0,
            'avgLikesPerVideo': total_likes // max(1, len(video_stats)),
            'avgCommentsPerVideo': total_comments // max(1, len(video_stats)),
            'likesPercent': round((total_likes / total_views) * 100, 2) if total_views > 0 else 0,
            'commentsPercent': round((total_comments / total_views) * 100, 2) if total_views > 0 else 0
        }
        
        return video_stats, aggregates
        
    except Exception as e:
        app.logger.error(f"Error compute_video_stats: {e}")
        return [], {}

def get_channel_stats(channel_id: str):
    """Get channel statistics"""
    if not youtube:
        return None
    try:
        resp = youtube.channels().list(
            part="statistics,snippet", 
            id=channel_id
        ).execute()
        
        if not resp.get('items'):
            return None
        
        ch = resp['items'][0]
        stats = ch.get('statistics', {})
        snip = ch.get('snippet', {})
        
        return {
            "channelId": channel_id,
            "title": snip.get('title'),
            "thumbnail": snip.get('thumbnails', {}).get('default', {}).get('url'),
            "subscriberCount": int(stats.get('subscriberCount', 0)),
            "videoCount": int(stats.get('videoCount', 0)),
            "viewCount": int(stats.get('viewCount', 0))
        }
    except Exception as e:
        app.logger.error(f"Error get_channel_stats: {e}")
        return None

def fetch_realtime_youtube_features(title, description, tags, category_id='0'):
    """Fetch real-time YouTube features for prediction"""
    features = {
        'title_length': len(title),
        'description_length': len(description),
        'tag_count': len(tags.split(',')) if tags else 0,
        'category_id': int(category_id) if str(category_id).isdigit() else 0,
        'trending_match_score': 0,
        'avg_competitor_views': 0,
        'sentiment_score': 0,
        'engagement_rate_estimate': 0,
        'similar_video_count': 0
    }
    
    if not youtube:
        return features
    
    try:
        # Get trending videos for comparison
        trending_response = youtube.videos().list(
            part='snippet,statistics', 
            chart='mostPopular', 
            regionCode='US', 
            maxResults=10
        ).execute()
        
        trending_keywords = []
        competitor_views = []
        
        for v in trending_response.get('items', []):
            trending_keywords.extend(re.findall(r"\w+", v['snippet'].get('title', '').lower()))
            competitor_views.append(int(v['statistics'].get('viewCount', 0)))
        
        # Calculate trending match score
        title_words = re.findall(r"\w+", title.lower())
        features['trending_match_score'] = sum(1 for w in title_words if w in trending_keywords)
        
        if competitor_views:
            features['avg_competitor_views'] = int(np.mean(competitor_views))
        
        # Sentiment analysis
        blob = TextBlob((title or "") + " " + (description or ""))
        features['sentiment_score'] = round(blob.sentiment.polarity, 3)
        
        # Similar videos analysis
        search_query = (title[:50] or description[:50]) or ""
        if search_query:
            resp = youtube.search().list(
                q=search_query, 
                part='id', 
                type='video', 
                maxResults=5
            ).execute()
            
            features['similar_video_count'] = len(resp.get('items', []))
            
            if resp.get('items'):
                ids = [i['id']['videoId'] for i in resp['items'] if i['id'].get('videoId')]
                if ids:
                    stats_resp = youtube.videos().list(
                        id=','.join(ids), 
                        part='statistics'
                    ).execute()
                    
                    engagement_rates = []
                    for vi in stats_resp.get('items', []):
                        s = vi.get('statistics', {})
                        views = int(s.get('viewCount', 0)) or 1
                        likes = int(s.get('likeCount', 0))
                        comments = int(s.get('commentCount', 0))
                        engagement_rates.append((likes + comments) / views * 100)
                    
                    if engagement_rates:
                        features['engagement_rate_estimate'] = round(float(np.mean(engagement_rates)), 2)
    except Exception as e:
        app.logger.error(f"Error fetching realtime features: {e}")
    
    return features

def generate_recommendations(features):
    """Generate recommendations based on features"""
    recs = []
    
    if features.get('trending_match_score', 0) < 2:
        recs.append("Consider adding trending keywords to your title.")
    
    if features.get('sentiment_score', 0) < 0:
        recs.append("Title/description sentiment negative — consider positive wording.")
    
    if features.get('tag_count', 0) < 5:
        recs.append("Add more relevant tags (aim for 10-15).")
    
    if features.get('title_length', 0) < 30:
        recs.append("Title is short — aim for 50-60 characters.")
    
    if features.get('description_length', 0) < 100:
        recs.append("Add a longer description (aim 300+ words).")
    
    return recs

def perform_real_share(video_id, platforms, custom_message=""):
    """Perform actual social media sharing"""
    results = []
    
    for p in platforms:
        if p == "Twitter":
            results.append(share_on_twitter(custom_message, video_id))
        else:
            results.append({"platform": p, "status": "failed", "error": "Not implemented"})
    
    return results

def share_on_twitter(message, video_id):
    """Share on Twitter (placeholder implementation)"""
    try:
        # In a real implementation, you would use Twitter API
        # import tweepy
        # client = tweepy.Client(...)
        # full_message = f"{message}\n\nCheck out this video: https://www.youtube.com/watch?v={video_id}"
        # resp = client.create_tweet(text=full_message)
        
        app.logger.info(f"Would share to Twitter: {message} - {video_id}")
        return {"platform": "Twitter", "status": "success"}
    except Exception as e:
        app.logger.error(f"Twitter share failed: {e}")
        return {"platform": "Twitter", "status": "failed", "error": str(e)}

# ===== ML MODEL FUNCTIONS =====

def fetch_youtube_data(query, max_results=50):
    """Fetch YouTube data for training"""
    if not youtube:
        return []
    
    video_ids = []
    try:
        search_response = youtube.search().list(
            q=query, 
            part='id', 
            type='video', 
            maxResults=max_results
        ).execute()
        
        for item in search_response.get('items', []):
            vid = item['id'].get('videoId')
            if vid:
                video_ids.append(vid)
        
        if not video_ids:
            return []
        
        videos_response = youtube.videos().list(
            id=','.join(video_ids), 
            part='snippet,statistics'
        ).execute()
        
        training_data = []
        for item in videos_response.get('items', []):
            snippet = item.get('snippet', {})
            stats = item.get('statistics', {})
            
            title_length = len(snippet.get('title', ''))
            description_length = len(snippet.get('description', ''))
            tag_count = len(snippet.get('tags', []))
            view_count = int(stats.get('viewCount', 0))
            
            training_data.append({
                "title_length": title_length,
                "description_length": description_length,
                "tag_count": tag_count,
                "views": view_count
            })
        
        return training_data
    except HttpError as e:
        app.logger.error("YouTube API error in fetch_youtube_data:", e)
        return []

def collect_training_data(query="education", max_results=50):
    """Collect training data from YouTube"""
    data = fetch_youtube_data(query, max_results)
    if not data:
        return []
    
    df = pd.DataFrame(data)
    
    if os.path.exists(DATA_FILE):
        existing = pd.read_csv(DATA_FILE)
        df = pd.concat([existing, df], ignore_index=True)
    
    df.drop_duplicates(inplace=True)
    df.to_csv(DATA_FILE, index=False)
    return df

def train_model():
    """Train the prediction model"""
    if not os.path.exists(DATA_FILE):
        return {"error": "No training data available."}
    
    df = pd.read_csv(DATA_FILE)
    features = ["title_length", "description_length", "tag_count"]
    target = "views"
    
    if df.empty or len(df) < 20:
        return {"error": "Not enough training samples."}
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    
    joblib.dump(model, MODEL_FILE)
    
    return {"mse": mse, "r2": r2, "samples": len(df)}

def train_enhanced_model():
    """Train enhanced model with more features"""
    if not os.path.exists(DATA_FILE):
        return {"error": "No training data available"}
    
    df = pd.read_csv(DATA_FILE)
    feature_cols = [
        'title_length', 'description_length', 'tag_count', 'category_id',
        'trending_match_score', 'avg_competitor_views', 'sentiment_score',
        'engagement_rate_estimate', 'similar_video_count'
    ]
    
    for c in feature_cols:
        if c not in df.columns:
            df[c] = 0
    
    if len(df) < 20:
        return {"error": "Not enough training samples"}
    
    X = df[feature_cols]
    y = df['views']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = GradientBoostingRegressor(
        n_estimators=200, 
        learning_rate=0.1, 
        max_depth=5, 
        random_state=42
    )
    model.fit(X_train_scaled, y_train)
    
    preds = model.predict(X_test_scaled)
    mse = mean_squared_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    
    joblib.dump(model, MODEL_FILE)
    joblib.dump(scaler, SCALER_FILE)
    
    return {"mse": mse, "r2": r2, "samples": len(df)}

# ===== ML ENDPOINTS =====

@api.route('/collect_data')
class CollectData(Resource):
    @api.doc('collect_training_data')
    @token_required
    @limiter.limit("5 per minute")
    def post(self, email):
        """Collect training data from YouTube"""
        data = request.json or {}
        query = sanitize_input(data.get("query", "education"))
        max_results = int(data.get("max_results", 30))
        
        df = collect_training_data(query, max_results)
        return {"message": f"Collected {len(df)} samples", "total_samples": len(df)}, 200

@api.route('/train_model')
class TrainModel(Resource):
    @api.doc('train_model')
    @token_required
    @limiter.limit("2 per minute")
    def post(self, email):
        """Train the prediction model"""
        result = train_model()
        return result, 200

@api.route('/train_enhanced_model')
class TrainEnhancedModel(Resource):
    @api.doc('train_enhanced_model')
    @token_required
    @limiter.limit("2 per minute")
    def post(self, email):
        """Train the enhanced prediction model"""
        result = train_enhanced_model()
        return result, 200

@api.route('/predict_performance')
class PredictPerformance(Resource):
    @api.doc('predict_performance')
    @token_required
    @limiter.limit("10 per minute")
    def post(self, email):
        """Predict video performance"""
        try:
            data = request.json or {}
            title = sanitize_input(data.get("title", ""))
            description = sanitize_input(data.get("description", ""))
            tags = sanitize_input(data.get("tags", ""))
            
            if not os.path.exists(MODEL_FILE):
                return {"error": "Model not trained yet."}, 500
            
            model = joblib.load(MODEL_FILE)
            features = [[len(title), len(description), len((tags or "").split(",")) if tags else 0]]
            prediction = int(model.predict(features)[0])
            
            return {"predicted_views_30d": prediction}, 200
        except Exception as e:
            app.logger.error(f"Error in predict_performance: {e}")
            return {"error": str(e)}, 400

try:
    from openai import OpenAI
    openrouter_key = os.getenv('OPENROUTER_API_KEY', '')
    if openrouter_key:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
        )
    else:
        client = None
except Exception:
    client = None

@api.route('/chatbot/ask')
class ChatbotAsk(Resource):
    def post(self):
        try:
            data = request.get_json(force=True)
            question = (data.get("question") or "").strip()
            raw_channels = data.get("channel_data", [])

            if not question:
                return {"answer": "⚠️ Please enter a question."}, 400

            # --- Normalize channel data ---
            channels = []
            for ch in raw_channels:
                info = ch.get("channelInfo", ch)
                trend = ch.get("videoTrend", [])
                channels.append({
                    "title": info.get("title", "Unknown Channel"),
                    "topVideos": sorted(trend, key=lambda v: v.get("views", 0), reverse=True)[:5],
                })

            # --- Detect topic and user type ---
            import re

            lang_keywords = ["python","java","javascript","c++","react","machine learning","data science","c#","html","css","flutter"]
            topic = next((kw for kw in lang_keywords if re.search(rf"\b{kw}\b", question, re.IGNORECASE)), "general")

            # User type detection
            user_map = {
                "student": ["learn","study","tutorial","education","course","best channel"],
                "creator": ["upload","growth","analytics","views","monetization","content","strategy"],
                "senior": ["health","pension","recipes","news","old age","easy"],
                "foodie": ["recipe","food","cooking","cuisine","restaurant","vlog"]
            }
            user_type = "general"
            for ut, kws in user_map.items():
                if any(k.lower() in question.lower() for k in kws):
                    user_type = ut
                    break

            # Question type detection
            question_type = "general"
            if any(k in question.lower() for k in ["compare","better","vs","difference"]):
                question_type = "comparison"
            elif any(k in question.lower() for k in ["how","tips","growth","improve","start"]):
                question_type = "advice"

            # Keep only relevant videos
            for ch in channels:
                ch["topic_videos"] = [v for v in ch["topVideos"] if topic.lower() in v.get("title","").lower()]

            # --- AI Prompt ---
            role_prompt = f"""
You are an AI YouTube assistant for {user_type}.
Answer the user question accurately.
- Only include metrics if explicitly asked.
- Recommend channels, videos, or strategies based on the topic.
- Give concise, actionable, clear advice in Markdown.
- Avoid unnecessary stats unless requested.
"""

            summary_lines = []
            for ch in channels:
                vids = "\n".join([f"• {v.get('title','N/A')}" for v in ch["topic_videos"]])
                summary_lines.append(f"### {ch['title']}\n{vids}")

            summary = "\n\n".join(summary_lines)

            prompt = f"""
User Question: "{question}"

Detected Topic: {topic}
Relevant Channel Data:
{summary}
"""

            completion = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[
                    {"role": "system", "content": role_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                max_tokens=900,
            )

            answer = completion.choices[0].message.content.strip()

            return jsonify({
                "answer": answer,
                "user_type": user_type,
                "question_type": question_type
            })

        except Exception as e:
            print("ChatbotAsk error:", e)
            return {"answer": f"⚠️ Error processing AI insight: {str(e)}"}, 500


@api.route('/keyword-research-ai')
class KeywordResearchAI(Resource):
    @api.doc('keyword_research_ai')
    @token_required
    @limiter.limit("30 per minute")
    def get(self, email):
        """AI-powered keyword research"""
        query = sanitize_input(request.args.get('query', ''))
        if not query:
            return {"error": "Query required"}, 400
        
        cache_key = f"kw_{query}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return {"cached": True, **cached_data}, 200
        
        if not youtube:
            return {"error": "YouTube API not configured"}, 500
        
        try:
            search = youtube.search().list(
                q=query, 
                part='id', 
                type='video', 
                maxResults=50
            ).execute()
            
            video_ids = [i['id']['videoId'] for i in search.get('items', []) if i['id'].get('videoId')]
            if not video_ids:
                return {"error": "No videos found"}, 404
            
            videos = youtube.videos().list(
                id=','.join(video_ids), 
                part='snippet,statistics'
            ).execute()
            
            keywords = Counter()
            total_views = 0
            
            for v in videos.get('items', []):
                tags = v['snippet'].get('tags', [])
                views = int(v['statistics'].get('viewCount', 0))
                total_views += views
                
                for tag in tags:
                    keywords[tag.lower()] += 1
            
            suggested = [[kw, freq * 1000] for kw, freq in keywords.most_common(15)]
            difficulty = min(100, int((total_views / len(video_ids) / 100000) * 100))
            
            result = {
                "mainKeyword": query, 
                "suggestedKeywords": suggested, 
                "difficulty": difficulty,
                "opportunities": ["Long-tail keywords", "Trending topics"],
                "aiInsights": f"Based on {len(video_ids)} videos. " + 
                             ("Low competition!" if difficulty < 40 else "Competitive niche.")
            }
            
            cache_set(cache_key, result)
            return {"cached": False, **result}, 200
        except Exception as e:
            app.logger.error(f"Error in keyword_research_ai: {e}")
            return {"error": str(e)}, 500

# ===== YOUTUBE OAUTH & THUMBNAIL TESTING ENDPOINTS =====

# YouTube OAuth Configuration
YOUTUBE_CLIENT_ID = os.getenv("YOUTUBE_CLIENT_ID", "")
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET", "")
YOUTUBE_REDIRECT_URI = os.getenv("YOUTUBE_REDIRECT_URI", "http://localhost:3000/youtube-oauth-callback.html")
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly"
]

# Store OAuth states and tokens (in production, use database)
oauth_states = {}
youtube_tokens = {}

@api.route('/youtube/check_connection')
class CheckYouTubeConnection(Resource):
    @api.doc('check_youtube_connection')
    @token_required
    def get(self, email):
        """Check if YouTube account is connected"""
        try:
            # Check if user has a valid YouTube token
            connected = email in youtube_tokens and youtube_tokens[email].get('access_token')
            
            return {
                "connected": connected,
                "email": email
            }, 200
        except Exception as e:
            app.logger.error(f"Error checking YouTube connection: {e}")
            return {"error": str(e)}, 500

@api.route('/youtube/connect')
class ConnectYouTube(Resource):
    @api.doc('connect_youtube')
    @token_required
    def get(self, email):
        """Initiate YouTube OAuth connection"""
        try:
            from google_auth_oauthlib.flow import Flow
            import secrets
            
            # Generate state for CSRF protection
            state = secrets.token_urlsafe(32)
            oauth_states[state] = email
            
            # Create OAuth flow
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": YOUTUBE_CLIENT_ID,
                        "client_secret": YOUTUBE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [YOUTUBE_REDIRECT_URI]
                    }
                },
                scopes=YOUTUBE_SCOPES,
                redirect_uri=YOUTUBE_REDIRECT_URI
            )
            
            authorization_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                state=state,
                prompt='consent'
            )
            
            return {
                "authorization_url": authorization_url,
                "state": state
            }, 200
            
        except Exception as e:
            app.logger.error(f"Error initiating YouTube OAuth: {e}")
            return {"error": f"Failed to initiate OAuth: {str(e)}"}, 500

@api.route('/youtube/callback')
class YouTubeCallback(Resource):
    @api.doc('youtube_callback')
    @token_required
    def post(self, email):
        """Handle YouTube OAuth callback"""
        try:
            from google_auth_oauthlib.flow import Flow
            
            data = request.json or {}
            code = data.get('code')
            state = data.get('state')
            
            if not code or not state:
                return {"error": "Missing code or state"}, 400
            
            # Verify state
            if state not in oauth_states or oauth_states[state] != email:
                return {"error": "Invalid state"}, 400
            
            # Exchange code for token
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": YOUTUBE_CLIENT_ID,
                        "client_secret": YOUTUBE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [YOUTUBE_REDIRECT_URI]
                    }
                },
                scopes=YOUTUBE_SCOPES,
                redirect_uri=YOUTUBE_REDIRECT_URI
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Store tokens
            youtube_tokens[email] = {
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes
            }
            
            # Clean up state
            del oauth_states[state]
            
            return {
                "message": "YouTube connected successfully",
                "connected": True
            }, 200
            
        except Exception as e:
            app.logger.error(f"Error in YouTube callback: {e}")
            return {"error": f"OAuth callback failed: {str(e)}"}, 500

@api.route('/youtube/channel_videos')
class GetChannelVideos(Resource):
    @api.doc('get_channel_videos')
    @token_required
    def get(self, email):
        """Get user's YouTube channel videos with analytics"""
        try:
            # Check if user has connected YouTube
            if email not in youtube_tokens:
                return {"error": "YouTube account not connected"}, 401
            
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            
            # Create credentials from stored tokens
            token_data = youtube_tokens[email]
            credentials = Credentials(
                token=token_data['access_token'],
                refresh_token=token_data.get('refresh_token'),
                token_uri=token_data.get('token_uri', 'https://oauth2.googleapis.com/token'),
                client_id=token_data.get('client_id', YOUTUBE_CLIENT_ID),
                client_secret=token_data.get('client_secret', YOUTUBE_CLIENT_SECRET),
                scopes=token_data.get('scopes', YOUTUBE_SCOPES)
            )
            
            # Build YouTube service with user's credentials
            youtube_service = build('youtube', 'v3', credentials=credentials)
            
            # Get user's channel
            channels_response = youtube_service.channels().list(
                part='contentDetails,statistics',
                mine=True
            ).execute()
            
            if not channels_response.get('items'):
                return {"error": "No channel found for this account"}, 404
            
            channel = channels_response['items'][0]
            uploads_playlist_id = channel['contentDetails']['relatedPlaylists']['uploads']
            
            # Get recent videos from uploads playlist
            playlist_response = youtube_service.playlistItems().list(
                part='snippet,contentDetails',
                playlistId=uploads_playlist_id,
                maxResults=20
            ).execute()
            
            video_ids = []
            for item in playlist_response.get('items', []):
                video_id = item['contentDetails']['videoId']
                video_ids.append(video_id)
            
            if not video_ids:
                return {"videos": []}, 200
            
            # Get detailed video statistics
            videos_response = youtube_service.videos().list(
                part='snippet,statistics,contentDetails',
                id=','.join(video_ids)
            ).execute()
            
            videos = []
            for video in videos_response.get('items', []):
                snippet = video.get('snippet', {})
                statistics = video.get('statistics', {})
                content_details = video.get('contentDetails', {})
                
                # Parse duration
                duration_str = content_details.get('duration', 'PT0S')
                duration_seconds = parse_duration(duration_str)
                
                # Calculate CTR (mock calculation - real CTR requires YouTube Analytics API)
                views = int(statistics.get('viewCount', 0))
                impressions = int(views * 1.5)  # Mock impressions
                ctr = (views / impressions * 100) if impressions > 0 else 0
                
                videos.append({
                    'id': video['id'],
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', ''),
                    'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                    'publishedAt': snippet.get('publishedAt', ''),
                    'views': views,
                    'likes': int(statistics.get('likeCount', 0)),
                    'comments': int(statistics.get('commentCount', 0)),
                    'shares': 0,  # Not available in basic API
                    'watchTime': duration_seconds * views,  # Estimated
                    'avgDuration': duration_seconds,
                    'ctr': round(ctr, 2),
                    'impressions': impressions
                })
            
            return {
                "videos": videos,
                "channel_stats": channel.get('statistics', {})
            }, 200
            
        except Exception as e:
            app.logger.error(f"Error fetching channel videos: {e}")
            return {"error": f"Failed to fetch videos: {str(e)}"}, 500

def parse_duration(duration_str):
    """Parse ISO 8601 duration to seconds"""
    import re
    
    pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
    match = re.match(pattern, duration_str)
    
    if not match:
        return 0
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    
    return hours * 3600 + minutes * 60 + seconds

@api.route('/youtube/disconnect')
class DisconnectYouTube(Resource):
    @api.doc('disconnect_youtube')
    @token_required
    def post(self, email):
        """Disconnect YouTube account"""
        try:
            if email in youtube_tokens:
                del youtube_tokens[email]
            
            return {
                "message": "YouTube account disconnected",
                "connected": False
            }, 200
        except Exception as e:
            app.logger.error(f"Error disconnecting YouTube: {e}")
            return {"error": str(e)}, 500

# ===== FILE SERVING =====

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# ===== HEALTH CHECK =====

@api.route('/health')
class HealthCheck(Resource):
    @api.doc('health_check')
    def get(self):
        """Health check endpoint"""
        status = {
            "status": "ok",
            "time": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "services": {
                "database": "ok" if DATABASE_URL else "warning",
                "redis": "ok" if redis_client else "warning",
                "youtube": "ok" if youtube else "warning"
            }
        }
        return status, 200

# ===== RUN APPLICATION =====

if __name__ == '__main__':
    # Initialize database tables
    init_db()
    
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")
    
    # Run the Flask app
    app.run(
        debug=debug_mode, 
        host='0.0.0.0', 
        port=port,
        threaded=True
    )
