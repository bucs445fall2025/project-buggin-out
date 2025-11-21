import { Link } from "react-router-dom";
import "../styles/Home.css";

export default function HomePage() {
  return (
    <div className="container">
      <div className="splash">
        <h1>Welcome to Forkcast!</h1>
        <p>Your go-to app for delicious recipes.</p>
        <p>Explore a variety of meals from crunchy snacks to gourmet dishes.</p>

        <p style={{ marginTop: "2rem" }}>
          <Link to="/recipes">Browse Recipes</Link>
        </p>
      </div>
    </div>
  );
}
