# backend/tmdb.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("TMDB_API_KEY")
if not API_KEY:
    raise RuntimeError("TMDB_API_KEY non définie. Ajoute-la en variable d'environnement ou dans un .env")

BASE_URL = "https://api.themoviedb.org/3"

def search_movie(title: str):
    url = f"{BASE_URL}/search/movie"
    params = {
        "api_key": API_KEY,
        "query": title,
        "language": "fr-FR"
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        return []
    data = response.json()
    results = []
    for movie in data.get("results", []):
        results.append({
            "title": movie.get("title"),
            "year": movie.get("release_date", "")[:4] if movie.get("release_date") else None,
            "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None
        })
    return results
