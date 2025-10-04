import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Favorite from "./pages/Favorite/Favorite";
import Home from "./pages/Home/Home";
import HomeLocal from "./pages/HomeLocal/HomeLocal";
import HomeIPTV from "./pages/HomeIPTV/HomeIPTV";
import FilmLocal from "./pages/Film/FilmLocal";
import SeriesLocal from "./pages/SeriesLocal/SeriesLocal";

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
