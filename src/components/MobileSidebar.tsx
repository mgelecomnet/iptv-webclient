import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface MobileSidebarProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <button
        onClick={toggleMenu}
        style={{
          position: "fixed",
          bottom: "15px",
          right: "15px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#333",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "none",
          zIndex: 1001,
          cursor: "pointer"
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "white" }}></span>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "white" }}></span>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "white" }}></span>
        </div>
      </button>

      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999
          }}
          onClick={toggleMenu}
        ></div>
      )}

      <div
        style={{
          display: menuOpen ? "block" : "none",
          position: "fixed",
          bottom: "70px",
          right: "15px",
          width: "200px",
          backgroundColor: "rgba(26, 26, 26, 0.95)",
          borderRadius: "8px",
          padding: "15px",
          zIndex: 1000
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ marginBottom: "15px" }}>
            <Link
              to="/search"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: location.pathname === "/search" ? "#007bff" : "#e0e0e0",
                textDecoration: "none",
                fontWeight: location.pathname === "/search" ? "bold" : "normal"
              }}
              onClick={toggleMenu}
            >
              <span>جستجو</span>
              <span style={{ marginLeft: "10px" }}>🔍</span>
            </Link>
          </li>
          <li style={{ marginBottom: "15px" }}>
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: location.pathname === "/" ? "#007bff" : "#e0e0e0",
                textDecoration: "none",
                fontWeight: location.pathname === "/" ? "bold" : "normal"
              }}
              onClick={toggleMenu}
            >
              <span>خانه</span>
              <span style={{ marginLeft: "10px" }}>🏠</span>
            </Link>
          </li>
          <li style={{ marginBottom: "15px" }}>
            <Link
              to="/movies"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: location.pathname === "/movies" ? "#007bff" : "#e0e0e0",
                textDecoration: "none",
                fontWeight: location.pathname === "/movies" ? "bold" : "normal"
              }}
              onClick={toggleMenu}
            >
              <span>فیلم</span>
              <span style={{ marginLeft: "10px" }}>🎬</span>
            </Link>
          </li>
          <li style={{ marginBottom: "15px" }}>
            <Link
              to="/series"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: location.pathname === "/series" ? "#007bff" : "#e0e0e0",
                textDecoration: "none",
                fontWeight: location.pathname === "/series" ? "bold" : "normal"
              }}
              onClick={toggleMenu}
            >
              <span>سریال</span>
              <span style={{ marginLeft: "10px" }}>📺</span>
            </Link>
          </li>
          <li style={{ marginBottom: "15px" }}>
            <Link
              to="/live"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: location.pathname === "/live" ? "#007bff" : "#e0e0e0",
                textDecoration: "none",
                fontWeight: location.pathname === "/live" ? "bold" : "normal"
              }}
              onClick={toggleMenu}
            >
              <span>پخش زنده</span>
              <span style={{ marginLeft: "10px" }}>📡</span>
            </Link>
          </li>
          <li style={{ marginBottom: "15px" }}>
            <Link
              to="/categories"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: location.pathname === "/categories" ? "#007bff" : "#e0e0e0",
                textDecoration: "none",
                fontWeight: location.pathname === "/categories" ? "bold" : "normal"
              }}
              onClick={toggleMenu}
            >
              <span>دسته‌بندی</span>
              <span style={{ marginLeft: "10px" }}>📂</span>
            </Link>
          </li>
          <li style={{ marginBottom: "15px" }}>
            <Link
              to="/more"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: location.pathname === "/more" ? "#007bff" : "#e0e0e0",
                textDecoration: "none",
                fontWeight: location.pathname === "/more" ? "bold" : "normal"
              }}
              onClick={toggleMenu}
            >
              <span>بیشتر</span>
              <span style={{ marginLeft: "10px" }}>⋯</span>
            </Link>
          </li>
          <li>
            <Link
              to="/login"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: location.pathname === "/login" ? "#007bff" : "#e0e0e0",
                textDecoration: "none",
                fontWeight: location.pathname === "/login" ? "bold" : "normal"
              }}
              onClick={toggleMenu}
            >
              <span>ورود</span>
              <span style={{ marginLeft: "10px" }}>👤</span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default MobileSidebar; 