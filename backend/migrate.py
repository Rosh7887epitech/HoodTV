import sqlite3

DB_FILE = "app.db"

def migrate_database():
    """Ajoute la colonne has_password à la table user si elle n'existe pas
    et reconstruit la table `user` pour rendre `password` nullable et
    ajouter la contrainte UNIQUE sur `name`.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("PRAGMA table_info(user)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'has_password' not in columns:
        print("Ajout de la colonne 'has_password' à la table user...")
        try:
            cursor.execute("ALTER TABLE user ADD COLUMN has_password INTEGER DEFAULT 0")
            cursor.execute("UPDATE user SET has_password = 1 WHERE password IS NOT NULL AND password != ''")
            
            conn.commit()
            print("✓ Migration réussie !")
        except Exception as e:
            print(f"✗ Erreur lors de la migration: {e}")
            conn.rollback()
    else:
        print("✓ La colonne 'has_password' existe déjà")
    
    print("\nVérification de la structure de la table...")
    cursor.execute("PRAGMA table_info(user)")
    cols = cursor.fetchall()
    password_not_null = False
    for col in cols:
        if col[1] == 'password' and col[3] == 1:
            password_not_null = True
            break

    if password_not_null:
        print("Le champ 'password' est NOT NULL — reconstruction de la table pour le rendre nullable...")
        try:
            cursor.execute("SELECT id, name, password, age, profile_photo, has_password FROM user")
            rows = cursor.fetchall()

            cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                password TEXT,
                age INTEGER,
                profile_photo TEXT,
                has_password INTEGER DEFAULT 0
            )
            ''')

            for r in rows:
                cursor.execute(
                    "INSERT INTO user_new (id, name, password, age, profile_photo, has_password) VALUES (?, ?, ?, ?, ?, ?)",
                    (r[0], r[1], r[2], r[3], r[4], r[5] if len(r) > 5 else 0)
                )

            cursor.execute("DROP TABLE user")
            cursor.execute("ALTER TABLE user_new RENAME TO user")
            conn.commit()
            print("✓ Reconstruction réussie — password est maintenant nullable et name est UNIQUE")
        except Exception as e:
            print(f"✗ Erreur lors de la reconstruction: {e}")
            conn.rollback()
    else:
        print("✓ Le champ 'password' est déjà nullable")

    conn.close()

if __name__ == "__main__":
    migrate_database()
