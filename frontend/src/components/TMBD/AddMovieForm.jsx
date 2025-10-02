import { useState } from "react";
import axios from "axios";

export default function AddMovieForm({ refresh }) {
  const [title, setTitle] = useState("");

  const handleAdd = async () => {
    if (!title) return;

    try {
      await axios.post("http://127.0.0.1:8000/movies/add_tmdb", { title });
      setTitle("");
      refresh();
    } catch (err) {
      console.error("Erreur ajout film :", err);
      alert("Impossible d'ajouter le film.");
    }
  };

  return (
    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
      <input 
        type="text" 
        placeholder="Rechercher un film" 
        value={title} 
        onChange={e => setTitle(e.target.value)}
      />
      <button onClick={handleAdd}>Ajouter</button>
    </div>
  );
}
