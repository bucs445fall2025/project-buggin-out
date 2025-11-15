// ---------------------- Load environment variables ----------------------
require("dotenv").config();

// ---------------------- Imports ----------------------
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// === NEW: Auth imports (bcrypt for hashing, jwt for tokens)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// === NEW: JWT secret from env (dev fallback)
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// === NEW: Auth helpers
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}
function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------------- App setup ----------------------
const app = express();
const port = process.env.PORT || 3001;

// Apply CORS BEFORE routes
app.use(
  cors({
    origin: "http://localhost:3002",
    credentials: true,
  })
);
console.log("CORS middleware applied!");

// Parse JSON request bodies
app.use(express.json());

// ---------------------- Spoonacular API setup ----------------------
const SPOON_API_KEY = process.env.SPOON_API_KEY;

const spoon = axios.create({
  baseURL: "https://api.spoonacular.com",
  // API Key is automatically included in all requests made with this instance
  params: { apiKey: SPOON_API_KEY },
});

// ---------------------- Routes ----------------------

// Root test route
app.get("/", async (req, res) => {
  try {
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=pasta&apiKey=${SPOON_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching data:",
      error.response?.data || error.message,
      error.config?.url
    );
    res.status(500).json({ error: "Failed to fetch from Spoonacular" });
  }
});

// === AUTH ROUTES =====================================================

// POST /api/auth/signup {email, password, displayName?}
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, displayName = "" } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        profile: { create: { displayName } },
      },
      include: { profile: true },
    });
    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email },
      profile: user.profile,
    });
  } catch (e) {
    if (e.code === "P2002")
      return res.status(409).json({ error: "Email already registered" });
    console.error("Signup error:", e);
    res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/auth/login {email, password}
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

// === PROFILE ROUTES ==================================================

// GET /api/me
app.get("/api/me", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { id: true, email: true, profile: true },
  });
  res.json(me);
});

// GET /api/profile
app.get("/api/profile", requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.user.sub },
  });
  res.json(profile);
});

// PUT /api/profile {displayName?, bio?, avatarUrl?}
app.put("/api/profile", requireAuth, async (req, res) => {
  const { displayName, bio, avatarUrl } = req.body || {};
  const profile = await prisma.profile.upsert({
    where: { userId: req.user.sub },
    update: { displayName, bio, avatarUrl },
    create: { userId: req.user.sub, displayName: displayName || "" },
  });
  res.json(profile);
});

// === RECIPE ROUTES ===================================================

// Search recipes (complexSearch + info + nutrition)
app.get("/api/recipes/search", async (req, res) => {
  try {
    const { query = "pasta", number = 10 } = req.query;
    const { data } = await spoon.get("/recipes/complexSearch", {
      params: {
        query,
        number,
        addRecipeInformation: true,
        addRecipeNutrition: true,
      },
    });
    res.json(data);
  } catch (error) {
    console.error("Search route error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch from Spoonacular",
      details: error.response?.data || error.message,
    });
  }
});

// Get random recipes
app.get("/api/recipes/random", async (req, res) => {
  try {
    const { number = 6, includeNutrition = true } = req.query;
    const { data } = await spoon.get("/recipes/random", {
      params: { number, includeNutrition },
    });
    res.json(data);
  } catch (error) {
    console.error(
      "Random recipe route error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch random recipes from Spoonacular",
      details: error.response?.data || error.message,
    });
  }
});

// Get macros for a recipe by ID
app.get("/api/recipes/:id/macros", async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await spoon.get(`/recipes/${id}/information`, {
      params: { includeNutrition: true },
    });

    const nutrients = data?.nutrition?.nutrients || [];
    const get = (name) => nutrients.find((n) => n.name === name)?.amount || 0;

    const macros = {
      protein: Math.round(get("Protein")),
      carbs: Math.round(get("Carbohydrates")),
      fat: Math.round(get("Fat")),
    };

    res.json({ id, title: data.title, image: data.image, macros });
  } catch (error) {
    console.error("Macros route error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch recipe macros",
      details: error.response?.data || error.message,
    });
  }
});

// Get ingredients for a recipe by ID
app.get("/api/recipes/:id/ingredients", async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await spoon.get(`/recipes/${id}/information`, {
      params: { includeNutrition: false },
    });

    const ingredients =
      data?.extendedIngredients?.map((ing) => ({
        id: ing.id,
        name: ing.originalName || ing.name,
        amount: ing.amount,
        unit: ing.unit,
      })) || [];

    res.json({
      id,
      title: data.title,
      ingredients,
    });
  } catch (error) {
    console.error(
      "Ingredients route error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch ingredients",
      details: error.response?.data || error.message,
    });
  }
});

// POST /api/recipes/save
app.post("/api/recipes/save", requireAuth, async (req, res) => {
  const { recipeId } = req.body;

  if (!recipeId) {
    return res.status(400).json({ error: "Recipe ID is required" });
  }

  try {
    // Check if the recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // Check if the recipe is already saved by the user
    const existingSavedRecipe = await prisma.savedRecipe.findFirst({
      where: {
        userId: req.user.sub,
        recipeId: recipeId,
      },
    });

    if (existingSavedRecipe) {
      return res.status(409).json({ error: "Recipe already saved" });
    }

    // Save the recipe for the user
    const savedRecipe = await prisma.savedRecipe.create({
      data: {
        userId: req.user.sub,
        recipeId: recipeId,
      },
    });

    res.status(201).json(savedRecipe);
  } catch (error) {
    console.error("Error saving recipe:", error);
    res.status(500).json({ error: "Failed to save recipe" });
  }
});

// ---------------------- Start server ----------------------
app.listen(port, () => {
  console.log(`✅ Server is running at: http://localhost:${port}`);
});
