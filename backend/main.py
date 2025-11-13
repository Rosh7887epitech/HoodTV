from fastapi import FastAPI, Query, Request
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from database import get_connection
from tmdb import search_movie, search_tv
from fastapi.middleware.cors import CORSMiddleware
import os
import mimetypes
from pathlib import Path
from urllib.parse import unquote
from fastapi.responses import Response
import httpx
from typing import Optional
import re
from difflib import SequenceMatcher

app = FastAPI(title="HoodTV API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_title(title: str) -> str:
    """Nettoie un titre de film ou série en retirant les patterns communs"""
    clean = re.sub(r'\[.*?\]', '', title)
    clean = re.sub(r'\(.*?\)', '', clean)
    clean = re.sub(r'\b(19|20)\d{2}\b', '', clean)
    clean = re.sub(r'\b(1080p|720p|2160p|4K|UHD|HDR|HDTV|WEB-DL|WEBRip|BluRay|BRRip|HDRip|DVDRip|PROPER|REPACK|EXTENDED|UNRATED|Directors\.Cut|DC)\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\b(x264|x265|h264|h265|HEVC|AAC|AC3|DTS|FLAC)\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\b(YIFY|YTS|RARBG|SPARKS|DEFLATE|ROVERS|AMRAP|BLOW)\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'[._-]+', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def normalize_string(s: str) -> str:
    """Normalise une chaîne pour la comparaison"""
    s = s.lower()
    s = s.replace('é', 'e').replace('è', 'e').replace('ê', 'e').replace('ë', 'e')
    s = s.replace('à', 'a').replace('â', 'a').replace('ä', 'a')
    s = s.replace('ô', 'o').replace('ö', 'o')
    s = s.replace('û', 'u').replace('ü', 'u').replace('ù', 'u')
    s = s.replace('î', 'i').replace('ï', 'i')
    s = s.replace('ç', 'c')
    s = re.sub(r'[^a-z0-9\s]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def calculate_similarity(str1: str, str2: str) -> float:
    """Calcule la similarité entre deux chaînes (0-1)"""
    norm1 = normalize_string(str1)
    norm2 = normalize_string(str2)
    
    if norm1 == norm2:
        return 1.0
    
    if norm1 in norm2 or norm2 in norm1:
        return 0.95
    
    return SequenceMatcher(None, norm1, norm2).ratio()

def find_best_match(clean_title: str, tmdb_results: list, title_key: str = "title") -> dict:
    """Trouve le meilleur match parmi les résultats TMDB"""
    if not tmdb_results:
        return None
    
    best_match = None
    best_score = 0
    
    for result in tmdb_results:
        title = result.get(title_key, "")
        score = calculate_similarity(clean_title, title)
        
        original_key = "original_title" if title_key == "title" else "original_name"
        original_title = result.get(original_key, "")
        if original_title:
            original_score = calculate_similarity(clean_title, original_title)
            score = max(score, original_score)
        
        if score > best_score:
            best_score = score
            best_match = result
    
    if best_score < 0.6 and tmdb_results:
        sorted_results = sorted(tmdb_results, key=lambda x: x.get('popularity', 0), reverse=True)
        return sorted_results[0]
    
    return best_match

class Movie(BaseModel):
    title: str
    year: int = None
    poster_url: str = None

class MovieRequest(BaseModel):
    title: str

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/movies/search")
def search_movies(query: str = Query(..., min_length=1)):
    results = search_movie(query)
    return {"results": results}

@app.get("/movies")
def list_movies():
    conn = get_connection()
    cursor = conn.execute("SELECT * FROM stars")
    movies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"movies": movies}

@app.post("/movies")
def add_movie(movie: Movie):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO stars (title, year, poster_url) VALUES (?, ?, ?)",
        (movie.title, movie.year, movie.poster_url)
    )
    conn.commit()
    movie_id = cursor.lastrowid
    conn.close()
    return {"id": movie_id, "message": f"Film '{movie.title}' ajouté"}

@app.delete("/movies/{movie_id}")
def delete_movie(movie_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM stars WHERE id = ?", (movie_id,))
    conn.commit()
    conn.close()
    return {"message": f"Film {movie_id} supprimé"}

@app.post("/movies/add_tmdb")
def add_movie_from_tmdb(movie_req: MovieRequest):
    title = movie_req.title
    results = search_movie(title)
    if not results:
        return {"message": "Aucun film trouvé"}
    
    movie = results[0]
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO stars (title, year, poster_url) VALUES (?, ?, ?)",
        (movie["title"], movie["year"], movie["poster_url"])
    )
    conn.commit()
    movie_id = cursor.lastrowid
    conn.close()
    return {"id": movie_id, "movie": movie}

@app.get("/movies/local")
def get_local_movies(enrich_tmdb: bool = Query(default=True)):
    possible_folders = [
        "/home/rosh/Vidéos/Films"
    ]
    
    video_extensions = {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'}
    
    local_movies = []
    scanned_folders = []
    
    try:
        for movies_folder in possible_folders:
            if os.path.exists(movies_folder):
                scanned_folders.append(movies_folder)
                for root, dirs, files in os.walk(movies_folder):
                    for file in files:
                        file_path = os.path.join(root, file)
                        file_extension = Path(file).suffix.lower()
                        
                        if file_extension in video_extensions:
                            # Obtenir les informations du fichier
                            file_size = os.path.getsize(file_path)
                            file_size_mb = round(file_size / (1024 * 1024), 2)
                            
                            # Nom sans extension pour le titre
                            title = Path(file).stem
                            
                            movie_data = {
                                "title": title,
                                "filename": file,
                                "path": file_path,
                                "size_mb": file_size_mb,
                                "extension": file_extension,
                                "folder": os.path.relpath(root, movies_folder),
                                "source_folder": movies_folder,
                                "tmdb_title": None,
                                "tmdb_poster": None,
                                "tmdb_year": None
                            }
                            
                            # Enrichir avec les données TMDB si demandé
                            if enrich_tmdb:
                                try:
                                    # Nettoyer le titre
                                    clean_movie_title = clean_title(title)
                                    
                                    # Rechercher sur TMDB
                                    tmdb_results = search_movie(clean_movie_title)
                                    if tmdb_results:
                                        best_match = find_best_match(clean_movie_title, tmdb_results, "title")
                                        if best_match:
                                            movie_data["tmdb_title"] = best_match.get("title")
                                            movie_data["tmdb_poster"] = best_match.get("poster_url")
                                            movie_data["tmdb_year"] = best_match.get("year")
                                except Exception as tmdb_error:
                                    print(f"Erreur TMDB pour {title}: {str(tmdb_error)}")
                            
                            local_movies.append(movie_data)
        
        return {
            "movies": local_movies,
            "total": len(local_movies),
            "scanned_folders": scanned_folders
        }
    except Exception as e:
        return {"error": f"Erreur lors du scan: {str(e)}", "movies": [], "scanned_folders": scanned_folders}


@app.get("/photos/local")
def get_local_photos():
    possible_folders = [
        "/home/rosh/Images/Photo",
    ]
    
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.ico', '.raw', '.heic'}
    
    local_photos = []
    scanned_folders = []
    
    try:
        for photos_folder in possible_folders:
            if os.path.exists(photos_folder):
                scanned_folders.append(photos_folder)
                for root, dirs, files in os.walk(photos_folder):
                    for file in files:
                        file_path = os.path.join(root, file)
                        file_extension = Path(file).suffix.lower()
                        
                        if file_extension in image_extensions:
                            file_size = os.path.getsize(file_path)
                            
                            title = Path(file).stem
                            
                            local_photos.append({
                                "title": title,
                                "filename": file,
                                "path": file_path,
                                "size_bytes": file_size,
                                "extension": file_extension,
                                "folder": os.path.relpath(root, photos_folder),
                                "source_folder": photos_folder
                            })
        
        return {
            "photos": local_photos,
            "total": len(local_photos),
            "scanned_folders": scanned_folders
        }
    except Exception as e:
        return {"error": f"Erreur lors du scan: {str(e)}", "photos": [], "scanned_folders": scanned_folders}


@app.get("/view-image/{file_path:path}")
def view_image(file_path: str):
    """
    Affichage d'images avec support des formats courants
    """
    file_path = unquote(file_path)
    if not os.path.exists(file_path):
        return {"error": "Fichier non trouvé"}
    
    file_extension = Path(file_path).suffix.lower()
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.ico'}
    
    if file_extension not in image_extensions:
        return {"error": "Type de fichier non supporté"}
    
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        if file_extension in {'.jpg', '.jpeg'}:
            content_type = "image/jpeg"
        elif file_extension == '.png':
            content_type = "image/png"
        elif file_extension == '.gif':
            content_type = "image/gif"
        elif file_extension == '.webp':
            content_type = "image/webp"
        else:
            content_type = "image/jpeg"
    
    return FileResponse(
        file_path,
        media_type=content_type,
        headers={"Cache-Control": "max-age=3600"}
    )


@app.get("/thumbnail/{file_path:path}")
def get_thumbnail(file_path: str):
    """
    Génération de miniatures pour les images
    """
    try:
        from PIL import Image
        
        file_path = unquote(file_path)
        if not os.path.exists(file_path):
            return {"error": "Fichier non trouvé"}
        
        file_extension = Path(file_path).suffix.lower()
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
        
        if file_extension not in image_extensions:
            return {"error": "Type de fichier non supporté"}
        
        thumbnails_dir = "/tmp/hoodtv_thumbnails"
        os.makedirs(thumbnails_dir, exist_ok=True)
        
        import hashlib
        thumbnail_name = hashlib.md5(file_path.encode()).hexdigest() + "_thumb.jpg"
        thumbnail_path = os.path.join(thumbnails_dir, thumbnail_name)
        
        if not os.path.exists(thumbnail_path):
            with Image.open(file_path) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                img.save(thumbnail_path, "JPEG", quality=85)
        
        return FileResponse(
            thumbnail_path,
            media_type="image/jpeg",
            headers={"Cache-Control": "max-age=86400"}
        )
        
    except ImportError:
        return FileResponse(
            file_path,
            media_type="image/jpeg",
            headers={"Cache-Control": "max-age=3600"}
        )
    except Exception as e:
        return {"error": f"Erreur lors de la génération de la miniature: {str(e)}"}


@app.get("/series/local")
def get_local_series(enrich_tmdb: bool = Query(default=True)):
    possible_folders = [
        "/home/rosh/Vidéos/Séries"
    ]
    
    video_extensions = {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'}
    
    series_folders = []
    scanned_folders = []
    
    try:
        for base_folder in possible_folders:
            if os.path.exists(base_folder):
                scanned_folders.append(base_folder)
                
                for item in os.listdir(base_folder):
                    item_path = os.path.join(base_folder, item)
                    if os.path.isdir(item_path):
                        episode_count = 0
                        total_size = 0
                        
                        for root, dirs, files in os.walk(item_path):
                            for file in files:
                                file_extension = Path(file).suffix.lower()
                                if file_extension in video_extensions:
                                    episode_count += 1
                                    file_path = os.path.join(root, file)
                                    total_size += os.path.getsize(file_path)
                        
                        if episode_count > 0:
                            total_size_mb = round(total_size / (1024 * 1024), 2)
                            
                            series_data = {
                                "name": item,
                                "path": item_path,
                                "episode_count": episode_count,
                                "total_size_mb": total_size_mb,
                                "source_folder": base_folder,
                                "tmdb_name": None,
                                "tmdb_poster": None,
                                "tmdb_backdrop": None,
                                "tmdb_year": None,
                                "tmdb_overview": None,
                                "tmdb_rating": None
                            }
                            if enrich_tmdb:
                                try:
                                    clean_series_name = clean_title(item)
                                    clean_series_name = re.sub(r'\b(Season|S\d+|saison|complete|integral|integrale)\b', '', clean_series_name, flags=re.IGNORECASE)
                                    clean_series_name = clean_series_name.strip()
                                    
                                    tmdb_results = search_tv(clean_series_name)
                                    if tmdb_results:
                                        best_match = find_best_match(clean_series_name, tmdb_results, "name")
                                        if best_match:
                                            series_data["tmdb_name"] = best_match.get("name")
                                            series_data["tmdb_poster"] = best_match.get("poster_url")
                                            series_data["tmdb_backdrop"] = best_match.get("backdrop_url")
                                            series_data["tmdb_year"] = best_match.get("year")
                                            series_data["tmdb_overview"] = best_match.get("overview")
                                            series_data["tmdb_rating"] = best_match.get("vote_average")
                                except Exception as tmdb_error:
                                    print(f"Erreur TMDB pour {item}: {str(tmdb_error)}")
                            
                            series_folders.append(series_data)
        
        return {
            "series": series_folders,
            "total": len(series_folders),
            "scanned_folders": scanned_folders
        }
    except Exception as e:
        return {"error": f"Erreur lors du scan: {str(e)}", "series": [], "scanned_folders": scanned_folders}


@app.get("/series/local/{series_name}/episodes")
def get_series_episodes(series_name: str):
    possible_folders = [
        "/home/rosh/Vidéos/Séries"
    ]
    
    video_extensions = {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'}
    
    series_name = unquote(series_name)
    
    try:
        for base_folder in possible_folders:
            series_path = os.path.join(base_folder, series_name)
            if os.path.exists(series_path) and os.path.isdir(series_path):
                episodes = []
                
                for root, dirs, files in os.walk(series_path):
                    for file in files:
                        file_extension = Path(file).suffix.lower()
                        if file_extension in video_extensions:
                            file_path = os.path.join(root, file)
                            file_size = os.path.getsize(file_path)
                            file_size_mb = round(file_size / (1024 * 1024), 2)
                            
                            relative_folder = os.path.relpath(root, series_path)
                            if relative_folder == ".":
                                relative_folder = "Racine"
                            
                            episodes.append({
                                "title": Path(file).stem,
                                "filename": file,
                                "path": file_path,
                                "size_mb": file_size_mb,
                                "extension": file_extension,
                                "season_folder": relative_folder,
                                "series_name": series_name
                            })
                
                episodes.sort(key=lambda x: x["filename"])
                
                return {
                    "series_name": series_name,
                    "episodes": episodes,
                    "total_episodes": len(episodes)
                }
        
        return {"error": f"Série '{series_name}' non trouvée", "episodes": []}
    
    except Exception as e:
        return {"error": f"Erreur lors de la récupération des épisodes: {str(e)}", "episodes": []}


@app.get("/stream/{file_path:path}")
def stream_video(file_path: str, request: Request):
    """
    Streaming de fichiers vidéo avec support des range requests
    """
    file_path = unquote(file_path)
    if not os.path.exists(file_path):
        return {"error": "Fichier non trouvé"}
    file_extension = Path(file_path).suffix.lower()
    video_extensions = {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'}
    if file_extension not in video_extensions:
        return {"error": "Type de fichier non supporté"}
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = "video/mp4"
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")
    
    if range_header:
        byte_start = 0
        byte_end = file_size - 1
        if range_header.startswith("bytes="):
            range_value = range_header[6:]
            if "-" in range_value:
                start_str, end_str = range_value.split("-", 1)
                if start_str:
                    byte_start = int(start_str)
                if end_str:
                    byte_end = int(end_str)
        
        byte_start = max(0, byte_start)
        byte_end = min(file_size - 1, byte_end)
        content_length = byte_end - byte_start + 1
        
        def iterfile(file_path, start, end):
            with open(file_path, "rb") as file:
                file.seek(start)
                remaining = end - start + 1
                while remaining:
                    chunk_size = min(8192, remaining)
                    chunk = file.read(chunk_size)
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk
        
        return StreamingResponse(
            iterfile(file_path, byte_start, byte_end),
            status_code=206,
            headers={
                "Content-Range": f"bytes {byte_start}-{byte_end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
                "Content-Type": content_type,
            },
        )
    else:
        return FileResponse(
            file_path,
            media_type=content_type,
            headers={"Accept-Ranges": "bytes"}
        )


@app.get("/audio/local")
def get_local_audio():
    possible_folders = [
        "/home/rosh/Audio"
    ]
    
    audio_extensions = {'.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.wma', '.opus', '.aiff', '.au', '.ra'}
    
    local_audio = []
    scanned_folders = []
    
    try:
        for audio_folder in possible_folders:
            if os.path.exists(audio_folder):
                scanned_folders.append(audio_folder)
                for root, dirs, files in os.walk(audio_folder):
                    for file in files:
                        file_path = os.path.join(root, file)
                        file_extension = Path(file).suffix.lower()
                        
                        if file_extension in audio_extensions:
                            file_size = os.path.getsize(file_path)
                            file_size_mb = round(file_size / (1024 * 1024), 2)
                            
                            title = Path(file).stem
                            
                            artist = "Artiste inconnu"
                            album = "Album inconnu"
                            
                            relative_path = os.path.relpath(root, audio_folder)
                            path_parts = relative_path.split(os.sep) if relative_path != "." else []
                            
                            if len(path_parts) >= 2:
                                artist = path_parts[0]
                                album = path_parts[1]
                            elif len(path_parts) == 1:
                                artist = path_parts[0]
                            
                            local_audio.append({
                                "title": title,
                                "artist": artist,
                                "album": album,
                                "filename": file,
                                "path": file_path,
                                "size_mb": file_size_mb,
                                "extension": file_extension,
                                "folder": os.path.relpath(root, audio_folder),
                                "source_folder": audio_folder
                            })
        
        return {
            "audio": local_audio,
            "total": len(local_audio),
            "scanned_folders": scanned_folders
        }
    except Exception as e:
        return {"error": f"Erreur lors du scan: {str(e)}", "audio": [], "scanned_folders": scanned_folders}


@app.get("/stream-audio/{file_path:path}")
def stream_audio(file_path: str, request: Request):
    """
    Streaming de fichiers audio avec support des range requests
    """
    file_path = unquote(file_path)
    if not os.path.exists(file_path):
        return {"error": "Fichier non trouvé"}
    
    file_extension = Path(file_path).suffix.lower()
    audio_extensions = {'.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.wma', '.opus', '.aiff', '.au', '.ra'}
    
    if file_extension not in audio_extensions:
        return {"error": "Type de fichier non supporté"}
    
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type_map = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.flac': 'audio/flac',
            '.ogg': 'audio/ogg',
            '.aac': 'audio/aac',
            '.m4a': 'audio/mp4',
            '.wma': 'audio/x-ms-wma',
            '.opus': 'audio/opus',
            '.aiff': 'audio/aiff',
            '.au': 'audio/basic',
            '.ra': 'audio/x-pn-realaudio'
        }
        content_type = content_type_map.get(file_extension, 'audio/mpeg')
    
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")
    
    if range_header:
        byte_start = 0
        byte_end = file_size - 1
        
        if range_header.startswith("bytes="):
            range_value = range_header[6:]
            if "-" in range_value:
                start_str, end_str = range_value.split("-", 1)
                if start_str:
                    byte_start = int(start_str)
                if end_str:
                    byte_end = int(end_str)
        
        byte_start = max(0, byte_start)
        byte_end = min(file_size - 1, byte_end)
        content_length = byte_end - byte_start + 1
        
        def iterfile(file_path, start, end):
            with open(file_path, "rb") as file:
                file.seek(start)
                remaining = end - start + 1
                while remaining:
                    chunk_size = min(8192, remaining)
                    chunk = file.read(chunk_size)
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk
        
        return StreamingResponse(
            iterfile(file_path, byte_start, byte_end),
            status_code=206,
            headers={
                "Content-Range": f"bytes {byte_start}-{byte_end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
                "Content-Type": content_type,
            },
        )
    else:
        return FileResponse(
            file_path,
            media_type=content_type,
            headers={"Accept-Ranges": "bytes"}
        )


@app.get("/proxy/{url:path}")
async def proxy_stream(url: str, request: Request):
    """
    Proxy IPTV avec gestion correcte du Content-Length
    """
    from urllib.parse import unquote
    
    url = unquote(url)
    
    if not url.startswith(('http://', 'https://')):
        return {"error": "URL invalide"}
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Connection': 'keep-alive',
        }
        
        if 'range' in request.headers:
            headers['Range'] = request.headers['range']
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            
            response_headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Cache-Control': 'no-cache',
            }
            
            headers_to_copy = ['content-type', 'content-range', 'accept-ranges', 'last-modified']
            
            for header in headers_to_copy:
                if header in response.headers:
                    response_headers[header] = response.headers[header]
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=response_headers,
                media_type=response.headers.get('content-type', 'application/octet-stream')
            )
            
    except httpx.TimeoutException:
        return Response(
            content='{"error": "Timeout - le serveur ne répond pas"}',
            status_code=504,
            media_type="application/json"
        )
    except httpx.HTTPStatusError as e:
        return Response(
            content=f'{{"error": "Erreur HTTP {e.response.status_code}"}}',
            status_code=e.response.status_code,
            media_type="application/json"
        )
    except Exception as e:
        print(f"Erreur proxy pour {url}: {str(e)}")  # Log pour debug
        return Response(
            content=f'{{"error": "Erreur de proxy: {str(e)}"}}',
            status_code=500,
            media_type="application/json"
        )


@app.options("/proxy/{url:path}")
async def proxy_options(url: str):
    """Gère les requêtes OPTIONS pour CORS preflight"""
    return Response(
        status_code=200,
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '3600',
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
