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
    
    # Créer la table user
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        age INTEGER,
        profile_photo TEXT
    )
    """)
    
    conn.commit()
    conn.close()

# Appelle init_db au lancement pour créer les tables
init_db()
