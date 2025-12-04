import { Routes, Route } from "react-router-dom";
import { useEffect } from "react"; // 1. Import useEffect
import "./App.css";

// 2. Import AOS libraries
import "aos/dist/aos.css";
import AOS from "aos";

import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import MacroTracker from "./pages/MacroTracker";
import Profile from "./pages/Profile";
import SignUp from "./pages/SignUp";
import Grocery from "./pages/Grocery";
import Login from "./pages/Login";
import AccountSetup from "./pages/AccountSetup";
import NavBar from "./components/NavBar";
import Posts from "./pages/Posts";
import UploadRecipe from "./pages/UploadRecipe";

function App() {
  // 3. Initialize AOS using useEffect
  useEffect(() => {
    AOS.init({
      offset: 150, // Trigger animations 150px before element enters viewport
      duration: 700, // Animation duration is 0.8 seconds
      easing: "ease-out",
      once: false, // Animation only happens once
    });
    AOS.refresh(); // Recalculate positions on component load
  }, []);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/macro" element={<MacroTracker />} />
        <Route path="/account-setup" element={<AccountSetup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/grocery" element={<Grocery />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/upload" element={<UploadRecipe />} />
      </Routes>
    </>
  );
}

export default App;
