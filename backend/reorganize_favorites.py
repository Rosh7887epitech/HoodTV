#!/usr/bin/env python3
"""
Script pour réorganiser les IDs des favoris (table stars)
Les IDs seront réinitialisés pour commencer à 1 et être consécutifs
"""

from database import reorganize_ids, get_connection

def main():
    print("🔄 Réorganisation des IDs des favoris...")
    
    # Vérifier l'état avant
    conn = get_connection()
    cursor = conn.execute("SELECT id, title FROM stars ORDER BY id")
    before = cursor.fetchall()
    conn.close()
    
    if before:
        print(f"\n📊 État AVANT la réorganisation:")
        for row in before:
            print(f"  ID {row['id']}: {row['title']}")
    else:
        print("\n⚠️  Aucun favori trouvé dans la base de données")
        return
    
    # Réorganiser les IDs
    reorganize_ids("stars")
    
    # Vérifier l'état après
    conn = get_connection()
    cursor = conn.execute("SELECT id, title FROM stars ORDER BY id")
    after = cursor.fetchall()
    conn.close()
    
    print(f"\n✅ État APRÈS la réorganisation:")
    for row in after:
        print(f"  ID {row['id']}: {row['title']}")
    
    print(f"\n✨ Réorganisation terminée ! {len(after)} favoris avec IDs consécutifs.")

if __name__ == "__main__":
    main()
