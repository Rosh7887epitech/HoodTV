from fastapi import FastAPI, Query
from pydantic import BaseModel
from database import get_connection
from tmdb import search_movie
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HoodTV API")

# Autoriser ton frontend React
origins = [
    "http://localhost:5173",  # ou le port de ton frontend
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],    # permet GET, POST, DELETE, etc.
    allow_headers=["*"],    # permet tous les headers
)

# Modèle pour films dans la DB
class Movie(BaseModel):
    title: str
    year: int = None
    poster_url: str = None

# Modèle pour ajouter un film depuis TMDB
class MovieRequest(BaseModel):
    title: str

@app.get("/")
def root():
    return {"status": "ok"}

# Endpoint recherche TMDB
@app.get("/movies/search")
def search_movies(query: str = Query(..., min_length=1)):
    results = search_movie(query)
    return {"results": results}

# Liste tous les films de la DB
@app.get("/movies")
def list_movies():
    conn = get_connection()
    cursor = conn.execute("SELECT * FROM movies")
    movies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"movies": movies}

# Ajouter un film manuellement
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

# Supprimer un film
@app.delete("/movies/{movie_id}")
def delete_movie(movie_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM movies WHERE id = ?", (movie_id,))
    conn.commit()
    conn.close()
    return {"message": f"Film {movie_id} supprimé"}

# Ajouter un film directement depuis TMDB
@app.post("/movies/add_tmdb")
def add_movie_from_tmdb(movie_req: MovieRequest):
    title = movie_req.title
    results = search_movie(title)
    if not results:
        return {"message": "Aucun film trouvé"}
    
    movie = results[0]  # Premier résultat
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
