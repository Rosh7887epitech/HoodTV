import sqlite3

DB_FILE = "app.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='movies'")
    movies_exists = cursor.fetchone()
    
    if movies_exists:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS stars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            year INTEGER,
            poster_url TEXT
        )
        """)
        
        cursor.execute("SELECT * FROM movies")
        movies_data = cursor.fetchall()
        if movies_data:
            cursor.execute("DELETE FROM stars")
            for movie in movies_data:
                cursor.execute(
                    "INSERT INTO stars (id, title, year, poster_url) VALUES (?, ?, ?, ?)",
                    (movie['id'], movie['title'], movie['year'], movie['poster_url'])
                )
        
        cursor.execute("DROP TABLE IF EXISTS movies")
    else:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS stars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            year INTEGER,
            poster_url TEXT
        )
        """)
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
    user_exists = cursor.fetchone()
    
    if user_exists:
        cursor.execute("PRAGMA table_info(user)")
        columns = {column[1]: column for column in cursor.fetchall()}
        
        password_column = columns.get('password')
        has_password_exists = 'has_password' in columns
        
        if password_column and password_column[3] == 1:
            print("Migration de la table user...")
            cursor.execute("SELECT * FROM user")
            users_data = cursor.fetchall()
            
            cursor.execute("DROP TABLE user")
            
            cursor.execute("""
            CREATE TABLE user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                password TEXT,
                age INTEGER,
                profile_photo TEXT,
                has_password INTEGER DEFAULT 0
            )
            """)
            
            for user in users_data:
                user_dict = dict(user)
                has_password = 1 if user_dict.get('password') else 0
                cursor.execute(
                    "INSERT INTO user (id, name, password, age, profile_photo, has_password) VALUES (?, ?, ?, ?, ?, ?)",
                    (user_dict['id'], user_dict['name'], user_dict.get('password'), 
                     user_dict.get('age'), user_dict.get('profile_photo'), has_password)
                )
            print("✓ Migration terminée")
        elif not has_password_exists:
            cursor.execute("ALTER TABLE user ADD COLUMN has_password INTEGER DEFAULT 0")
            cursor.execute("UPDATE user SET has_password = 1 WHERE password IS NOT NULL AND password != ''")
    else:
        cursor.execute("""
        CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            password TEXT,
            age INTEGER,
            profile_photo TEXT,
            has_password INTEGER DEFAULT 0
        )
        """)
    
    conn.commit()
    conn.close()

init_db()
