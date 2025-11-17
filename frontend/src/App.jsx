import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Favorite from "./pages/Favorite/Favorite";
import Home from "./pages/Home/Home";
import SelectUser from "./pages/SelectUser/SelectUser";
import CreateUser from "./pages/CreateUser/CreateUser";
import HomeLocal from "./pages/Local/HomeLocal/HomeLocal";
import HomeIPTV from "./pages/HomeIPTV/HomeIPTV";
import FilmLocal from "./pages/Local/FilmLocal/FilmLocal";
import SeriesLocal from "./pages/Local/SeriesLocal/SeriesLocal";
import PhotoLocal from "./pages/Local/PhotoLocal/PhotoLocal";
import AudioLocal from "./pages/Local/AudioLocal/AudioLocal";
import IPTVPage from "./pages/IPTV/IPTVPage";
import Sidebar from "./components/Sidebar/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function AppContent() {
  const location = useLocation();
  
  const noSidebarRoutes = ['/select-user', '/create-user'];
  const showSidebar = !noSidebarRoutes.includes(location.pathname);

  return (
    <div className="app-container">
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? "main-content" : "main-content-full"}>
        <Routes>
          <Route path="/" element={<SelectUser />} />
          <Route path="/select-user" element={<SelectUser />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/streaming" 
            element={
              <ProtectedRoute>
                <HomeIPTV />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/local" 
            element={
              <ProtectedRoute>
                <HomeLocal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stars" 
            element={
              <ProtectedRoute>
                <Favorite />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/local-movies" 
            element={
              <ProtectedRoute>
                <FilmLocal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/local-series" 
            element={
              <ProtectedRoute>
                <SeriesLocal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/local-photos" 
            element={
              <ProtectedRoute>
                <PhotoLocal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/local-audio" 
            element={
              <ProtectedRoute>
                <AudioLocal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/iptv" 
            element={
              <ProtectedRoute>
                <IPTVPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
