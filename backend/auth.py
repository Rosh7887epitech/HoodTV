import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
from database import get_connection

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200

def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie si le mot de passe correspond au hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Créé un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Vérifie et décode un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_user_by_name(name: str):
    """Récupère un utilisateur par son nom"""
    conn = get_connection()
    cursor = conn.execute("SELECT * FROM user WHERE name = ?", (name,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def create_user(name: str, password: str = None, age: int = None):
    """Créé un nouvel utilisateur"""
    conn = get_connection()
    cursor = conn.cursor()
    
    existing = get_user_by_name(name)
    if existing:
        conn.close()
        return None
    
    has_password = 1 if password else 0
    hashed_password = hash_password(password) if password else None
    
    cursor.execute(
        "INSERT INTO user (name, password, age, has_password) VALUES (?, ?, ?, ?)",
        (name, hashed_password, age, has_password)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id

def authenticate_user(name: str, password: str = None):
    """Authentifie un utilisateur"""
    user = get_user_by_name(name)
    if not user:
        return None
    
    if not user.get('has_password') or user.get('password') is None:
        return user
    
    if not password or not verify_password(password, user['password']):
        return None
    
    return user
