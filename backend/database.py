import sqlite3

DB_FILE = "app.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def reset_autoincrement(table_name):
    """Réinitialise le compteur AUTOINCREMENT d'une table"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Obtenir le max ID actuel
        cursor.execute(f"SELECT MAX(id) FROM {table_name}")
        max_id = cursor.fetchone()[0]
        if max_id is None:
            max_id = 0
        
        # Mettre à jour la séquence sqlite
        cursor.execute(f"UPDATE sqlite_sequence SET seq = ? WHERE name = ?", (max_id, table_name))
        conn.commit()
    except Exception as e:
        print(f"Erreur lors du reset autoincrement: {e}")
    finally:
        conn.close()

def reorganize_ids(table_name):
    """Réorganise les IDs d'une table pour qu'ils soient consécutifs (1, 2, 3...)"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Récupérer toutes les données
        cursor.execute(f"SELECT * FROM {table_name} ORDER BY id")
        rows = cursor.fetchall()
        
        if not rows:
            return
        
        # Créer une table temporaire
        cursor.execute(f"CREATE TEMPORARY TABLE temp_{table_name} AS SELECT * FROM {table_name}")
        
        # Vider la table originale
        cursor.execute(f"DELETE FROM {table_name}")
        
        # Réinsérer avec de nouveaux IDs consécutifs
        for new_id, row in enumerate(rows, start=1):
            row_dict = dict(row)
            columns = list(row_dict.keys())
            columns.remove('id')
            
            placeholders = ', '.join(['?'] * (len(columns) + 1))
            columns_str = 'id, ' + ', '.join(columns)
            values = [new_id] + [row_dict[col] for col in columns]
            
            cursor.execute(f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})", values)
        
        # Supprimer la table temporaire
        cursor.execute(f"DROP TABLE temp_{table_name}")
        
        # Réinitialiser le compteur AUTOINCREMENT
        cursor.execute(f"DELETE FROM sqlite_sequence WHERE name = ?", (table_name,))
        cursor.execute(f"INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)", (table_name, len(rows)))
        
        conn.commit()
        print(f"✓ IDs réorganisés pour {table_name}: {len(rows)} entrées")
    except Exception as e:
        conn.rollback()
        print(f"Erreur lors de la réorganisation des IDs: {e}")
    finally:
        conn.close()

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
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
    
    # Créer la table favorites pour les playlists personnelles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        title TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
    """)
    
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)
    """)
    
    # Créer la table xtream_accounts pour les comptes Xtream personnels par utilisateur
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS xtream_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        protocol TEXT DEFAULT 'http',
        server_info TEXT,
        user_info TEXT,
        is_active INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
    """)
    
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_xtream_accounts_user_id ON xtream_accounts(user_id)
    """)
    
    conn.commit()
    conn.close()

init_db()
