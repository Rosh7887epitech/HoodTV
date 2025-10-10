import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Favorite from "./pages/Favorite/Favorite";
import Home from "./pages/Home/Home";
import HomeLocal from "./pages/Local/HomeLocal/HomeLocal";
import HomeIPTV from "./pages/HomeIPTV/HomeIPTV";
import FilmLocal from "./pages/Local/FilmLocal/FilmLocal";
import SeriesLocal from "./pages/Local/SeriesLocal/SeriesLocal";
import PhotoLocal from "./pages/Local/PhotoLocal/PhotoLocal";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/streaming" element={<HomeIPTV />} />
          <Route path="/local" element={<HomeLocal />} />
          <Route path="/stars" element={<Favorite />} />
          <Route path="/local-movies" element={<FilmLocal />} />
          <Route path="/local-series" element={<SeriesLocal />} />
          <Route path="/local-photos" element={<PhotoLocal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
