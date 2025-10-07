import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import NavBar from "./components/NavBar";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
      </Routes>
    </>
  );
}

export default App;
