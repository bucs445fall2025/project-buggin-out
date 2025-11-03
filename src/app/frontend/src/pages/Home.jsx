import { Link } from "react-router-dom";
import "../styles/Home.css"; // Optional: Add styles for the Home page

export default function HomePage() {
  return (
    <div className="container">
      <div className="splash">
        <h1>Welcome to Forkcast!</h1>
        <p>Your go-to app for delicious recipes.</p>
        <p>
          Explore a variety of recipes from crunchy snacks to gourmet dishes.
        </p>
        <p>
          Get started by browsing our <Link to="/recipes">Recipes</Link> page or
          learn more <Link to="/about">About Us</Link>.
        </p>
      </div>
    </div>
  );
}
