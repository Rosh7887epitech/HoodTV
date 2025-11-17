import sqlite3

DB_FILE = "app.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Pour récupérer dict-like
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Vérifier si la table movies existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='movies'")
    movies_exists = cursor.fetchone()
    
    # Si movies existe, la renommer en stars
    if movies_exists:
        # Créer la nouvelle table stars
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS stars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            year INTEGER,
            poster_url TEXT
        )
        """)
        
        # Copier les données de movies vers stars
        cursor.execute("SELECT * FROM movies")
        movies_data = cursor.fetchall()
        if movies_data:
            cursor.execute("DELETE FROM stars")  # Nettoyer stars avant insertion
            for movie in movies_data:
                cursor.execute(
                    "INSERT INTO stars (id, title, year, poster_url) VALUES (?, ?, ?, ?)",
                    (movie['id'], movie['title'], movie['year'], movie['poster_url'])
                )
        
        # Supprimer l'ancienne table movies
        cursor.execute("DROP TABLE IF EXISTS movies")
    else:
        # Créer directement la table stars si movies n'existe pas
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS stars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            year INTEGER,
            poster_url TEXT
        )
        """)
    
    # Vérifier si la table user existe avec l'ancienne structure
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
    user_exists = cursor.fetchone()
    
    if user_exists:
        # Vérifier la structure actuelle
        cursor.execute("PRAGMA table_info(user)")
        columns = {column[1]: column for column in cursor.fetchall()}
        
        # Si password est NOT NULL ou si has_password n'existe pas, recréer la table
        password_column = columns.get('password')
        has_password_exists = 'has_password' in columns
        
        if password_column and password_column[3] == 1:  # 1 = NOT NULL
            print("Migration de la table user...")
            # Sauvegarder les données existantes
            cursor.execute("SELECT * FROM user")
            users_data = cursor.fetchall()
            
            # Supprimer l'ancienne table
            cursor.execute("DROP TABLE user")
            
            # Créer la nouvelle table avec password nullable
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
            
            # Réinsérer les données
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
            # Juste ajouter la colonne has_password
            cursor.execute("ALTER TABLE user ADD COLUMN has_password INTEGER DEFAULT 0")
            cursor.execute("UPDATE user SET has_password = 1 WHERE password IS NOT NULL AND password != ''")
    else:
        # Créer la table user avec la bonne structure
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

# Appelle init_db au lancement pour créer les tables
init_db()
