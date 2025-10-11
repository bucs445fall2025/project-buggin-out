import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import MacroTracker from "./pages/MacroTracker";
import Profile from "./pages/Profile";
import AccountSetup from "./pages/AccountSetup";
import NavBar from "./components/NavBar";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/macro" element={<MacroTracker />} />
        <Route path="/account-setup" element={<AccountSetup />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}

export default App;
