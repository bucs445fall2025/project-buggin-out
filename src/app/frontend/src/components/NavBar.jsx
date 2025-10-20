import { Link } from "react-router-dom";
import "../styles/NavBar.css"; // Optional: Add styles for your NavBar

function NavBar() {
  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li>
          <Link to="/">Buggin Out</Link>
        </li>
        <ul className="right-links">
          <li className="navbar-signup"><Link to="/signup">Sign Up</Link></li>
          <li><Link to="/login">Login</Link></li>
        </ul>
        <div className="divider">
          <li id="pages">
            <Link to="/recipes">Recipes</Link>
          </li>
          <li>
            <Link to="/grocery">Grocery</Link>
          </li>
          <li>
            <Link to="/macro">Macro Tracker</Link>
          </li>
          <li>
            <Link to="/profile">Profile</Link>
          </li>
          <li>
            <Link to="/account-setup">Account Setup</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </div>
        {/* Add more links for other pages in the `pages` folder */}
      </ul>
    </nav>
  );
}

export default NavBar;
