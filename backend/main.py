from fastapi import FastAPI, Query, Request
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from database import get_connection
from tmdb import search_movie
from fastapi.middleware.cors import CORSMiddleware
import os
import mimetypes
from pathlib import Path
from urllib.parse import unquote

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
    cursor = conn.execute("SELECT * FROM movies")
    movies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"movies": movies}

@app.post("/movies")
def add_movie(movie: Movie):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO movies (title, year, poster_url) VALUES (?, ?, ?)",
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
    cursor.execute("DELETE FROM movies WHERE id = ?", (movie_id,))
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
        "INSERT INTO movies (title, year, poster_url) VALUES (?, ?, ?)",
        (movie["title"], movie["year"], movie["poster_url"])
    )
    conn.commit()
    movie_id = cursor.lastrowid
    conn.close()
    return {"id": movie_id, "movie": movie}

@app.get("/movies/local")
def get_local_movies():
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
                            
                            local_movies.append({
                                "title": title,
                                "filename": file,
                                "path": file_path,
                                "size_mb": file_size_mb,
                                "extension": file_extension,
                                "folder": os.path.relpath(root, movies_folder),
                                "source_folder": movies_folder
                            })
        
        return {
            "movies": local_movies,
            "total": len(local_movies),
            "scanned_folders": scanned_folders
        }
    except Exception as e:
        return {"error": f"Erreur lors du scan: {str(e)}", "movies": [], "scanned_folders": scanned_folders}


@app.get("/series/local")
def get_local_series():
    possible_folders = [
        "/home/rosh/Vidéos/Séries"
    ]
    
    video_extensions = {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'}
    
    local_series = []
    scanned_folders = []
    
    try:
        for series_folder in possible_folders:
            if os.path.exists(series_folder):
                scanned_folders.append(series_folder)
                for root, dirs, files in os.walk(series_folder):
                    for file in files:
                        file_path = os.path.join(root, file)
                        file_extension = Path(file).suffix.lower()
                        
                        if file_extension in video_extensions:
                            file_size = os.path.getsize(file_path)
                            file_size_mb = round(file_size / (1024 * 1024), 2)
                            
                            title = Path(file).stem
                            
                            local_series.append({
                                "title": title,
                                "filename": file,
                                "path": file_path,
                                "size_mb": file_size_mb,
                                "extension": file_extension,
                                "folder": os.path.relpath(root, series_folder),
                                "source_folder": series_folder
                            })
        
        return {
            "series": local_series,
            "total": len(local_series),
            "scanned_folders": scanned_folders
        }
    except Exception as e:
        return {"error": f"Erreur lors du scan: {str(e)}", "series": [], "scanned_folders": scanned_folders}


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


@app.get("/proxy/{url:path}")
def proxy_stream(url: str, request: Request):
    """
    Proxy pour streaming de contenu distant (HLS, DASH, etc.)
    Utile pour contourner les problèmes CORS
    """
    import requests
    
    url = unquote(url)
    
    if not url.startswith(('http://', 'https://')):
        return {"error": "URL invalide"}
    
    try:
        headers = {}
        if 'range' in request.headers:
            headers['Range'] = request.headers['range']
        
        response = requests.get(url, headers=headers, stream=True)
        
        response_headers = {}
        for header in ['content-type', 'content-length', 'content-range', 'accept-ranges']:
            if header in response.headers:
                response_headers[header.replace('-', '_').title()] = response.headers[header]
        
        return StreamingResponse(
            response.iter_content(chunk_size=8192),
            status_code=response.status_code,
            headers=response_headers
        )
        
    except Exception as e:
        return {"error": f"Erreur de proxy: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
