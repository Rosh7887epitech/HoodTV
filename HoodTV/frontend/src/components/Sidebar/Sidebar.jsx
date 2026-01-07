import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/home" && location.pathname === "/home") return true;
    if (path !== "/home" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    {
      name: "Accueil",
      path: "/home",
      icon: "",
      exact: true
    },
    {
      name: "Streaming",
      path: "/streaming",
      icon: "",
      subItems: [
        { name: "Local IPTV", path: "/iptv", icon: ""},
        { name: "Xtream IPTV", path: "/xtream", icon: "" },

      ]
    },
    {
      name: "Local",
      path: "/local",
      icon: "",
      subItems: [
        { name: "Films", path: "/local-movies", icon: "" },
        { name: "Séries", path: "/local-series", icon: "" },
        { name: "Photos", path: "/local-photos", icon: "" },
        { name: "Musique", path: "/local-audio", icon: "" }
      ]
    },
    {
      name: "Favoris",
      path: "/stars",
      icon: ""
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">HoodTV</h2>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-menu-item">
              <Link
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-text">{item.name}</span>
              </Link>
              {item.subItems && (
                <ul className="sidebar-submenu">
                  {item.subItems.map((subItem) => (
                    <li key={subItem.path} className="sidebar-submenu-item">
                      <Link
                        to={subItem.path}
                        className={`sidebar-sublink ${
                          location.pathname === subItem.path ? "active" : ""
                        }`}
                      >
                        <span className="sidebar-icon">{subItem.icon}</span>
                        <span className="sidebar-text">{subItem.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0.0</div>
      </div>
    </aside>
  );
}
