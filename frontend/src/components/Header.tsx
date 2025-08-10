import { Link, useLocation } from "react-router-dom";
import "./Header.css";

function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h2>Betty Blocks Assignment</h2>
        </div>
        <nav className="navigation">
          <Link
            to="/app"
            className={
              location.pathname === "/app" ? "nav-link active" : "nav-link"
            }
          >
            Data API
          </Link>
          <Link
            to="/compiler"
            className={
              location.pathname === "/compiler" ? "nav-link active" : "nav-link"
            }
          >
            Data Compiler
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
