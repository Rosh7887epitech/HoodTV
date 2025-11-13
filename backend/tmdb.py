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
            "id": movie.get("id"),
            "title": movie.get("title"),
            "original_title": movie.get("original_title"),
            "year": movie.get("release_date", "")[:4] if movie.get("release_date") else None,
            "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None,
            "popularity": movie.get("popularity", 0)
        })
    return results

def search_tv(title: str):
    """Rechercher une série TV sur TMDB"""
    url = f"{BASE_URL}/search/tv"
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
    for tv in data.get("results", []):
        results.append({
            "id": tv.get("id"),
            "name": tv.get("name"),
            "original_name": tv.get("original_name"),
            "year": tv.get("first_air_date", "")[:4] if tv.get("first_air_date") else None,
            "poster_url": f"https://image.tmdb.org/t/p/w500{tv.get('poster_path')}" if tv.get("poster_path") else None,
            "backdrop_url": f"https://image.tmdb.org/t/p/original{tv.get('backdrop_path')}" if tv.get("backdrop_path") else None,
            "overview": tv.get("overview"),
            "vote_average": tv.get("vote_average"),
            "popularity": tv.get("popularity", 0)
        })
    return results
