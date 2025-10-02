import sqlite3

DB_FILE = "app.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Pour récupérer dict-like
    return conn

def init_db():
    conn = get_connection()
    conn.execute("""
    CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        year INTEGER,
        poster_url TEXT
    )
    """)
    conn.commit()
    conn.close()

# Appelle init_db au lancement pour créer la table si elle n'existe pas
init_db()
