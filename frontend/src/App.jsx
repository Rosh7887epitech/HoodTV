import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Favorite from "./pages/Favorite/Favorite";
import Home from "./pages/Home/Home";
import HomeLocal from "./pages/HomeLocal/HomeLocal";
import HomeIPTV from "./pages/HomeIPTV/HomeIPTV";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/streaming" element={<HomeIPTV />} />
          <Route path="/local" element={<HomeLocal />} />
          <Route path="/movies" element={<Favorite />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
