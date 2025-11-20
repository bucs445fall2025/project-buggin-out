import { Link } from "react-router-dom";
import "../styles/NavBar.css";

function NavBar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="name">
          Forkcast
        </Link>
      </div>

      <ul className="nav-center">
        <li><Link to="/recipes">Recipes</Link></li>
        <li><Link to="/grocery">Grocery</Link></li>
        <li><Link to="/macro">Macro Tracker</Link></li>
        <li><Link to="/profile">Profile</Link></li>
      </ul>

      <ul className="nav-right">
        <li><Link to="/signup" className="btn signup">Sign Up</Link></li>
        <li><Link to="/login" className="btn login">Login</Link></li>
      </ul>
    </nav>
  );
}

export default NavBar;
