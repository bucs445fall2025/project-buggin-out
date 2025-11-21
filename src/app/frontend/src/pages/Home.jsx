import { Link } from "react-router-dom";
import "../styles/Home.css";

export default function HomePage() {
  return (
    <div className="container">
      <div className="hero-splash">
        {/* Updated structure for better hierarchy */}
        <h1 className="main-title">Welcome to **Forkcast**!</h1>
        <h2 className="tagline">
          Your all-in-one companion for delicious recipes, macro tracking, and
          food journaling.
        </h2>
        <p className="description">
          Explore a world of recipes from healthy snacks to gourmet dishes, and
          easily track your nutrition goals.
        </p>

        {/* Clear Call-to-Action (CTA) section */}
        <div className="cta-group">
          <Link to="/recipes" className="cta-button primary">
            Explore Recipes
          </Link>
        </div>
      </div>
    </div>
  );
}
