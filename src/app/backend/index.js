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
    origin: "http://localhost:3000",
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

// ----------------------MealDB API setup (Free Alternative) ----------------------
const MEALDB_API_KEY = "1";
const mealdb = axios.create({
  baseURL: `https://www.themealdb.com/api/json/v1/${MEALDB_API_KEY}`,
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

// === THEMEALDB RECIPE ROUTES (Free Alternative) ======================

// GET /api/recipes/themealdb/details/:id
app.get("/api/recipes/themealdb/details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data } = await mealdb.get("/lookup.php", {
      params: { i: id },
    });

    const meal = data.meals?.[0];
    if (!meal) return res.status(404).json({ error: "Meal not found" });

    // Format ingredients
    const ingredients = Array.from({ length: 20 })
      .map((_, i) => {
        const ing = meal[`strIngredient${i + 1}`];
        const measure = meal[`strMeasure${i + 1}`];
        return ing && ing.trim()
          ? { ingredient: ing, measure: measure?.trim() }
          : null;
      })
      .filter(Boolean);

    const formatted = {
      id: meal.idMeal,
      title: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      image: meal.strMealThumb,
      instructions: meal.strInstructions,
      tags: meal.strTags ? meal.strTags.split(",") : [],
      youtube: meal.strYoutube,
      ingredients,
    };

    res.json(formatted);
  } catch (err) {
    console.error("Lookup error:", err);
    res.status(500).json({ error: "Failed to fetch meal details" });
  }
});

// GET /api/recipes/themealdb/categories
// Gets the list of all categories for the filter dropdown
app.get("/api/recipes/themealdb/categories", async (req, res) => {
  try {
    const { data } = await mealdb.get("/categories.php");
    res.json(data.categories || []);
  } catch (error) {
    console.error("TheMealDB Categories route error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/recipes/themealdb/random_3
// Workaround: Calls the single random endpoint 3 times to get 3 unique meals.
app.get("/api/recipes/themealdb/random_3", async (req, res) => {
  try {
    const mealPromises = [];
    // Make 3 concurrent calls to the single random meal endpoint
    for (let i = 0; i < 6; i++) {
      mealPromises.push(mealdb.get("/random.php"));
    }

    const responses = await Promise.all(mealPromises);

    // Map the responses to extract the single meal object from each
    const meals = responses
      .map((response) => response.data?.meals?.[0])
      .filter((meal) => meal);

    // Map to a simplified card structure immediately
    const mappedMeals = meals.map((meal) => ({
      id: meal.idMeal,
      title: meal.strMeal,
      image: `${meal.strMealThumb}/preview`,
      // Include category and area for a better random display description
      description: `Category: ${meal.strCategory} | Area: ${meal.strArea}`,
      sourceUrl: `/recipes/${meal.idMeal}`,
    }));

    res.json(mappedMeals);
  } catch (error) {
    console.error("TheMealDB Random 3 route error:", error);
    res.status(500).json({
      error: "Failed to fetch random meals from TheMealDB",
    });
  }
});

// GET /api/recipes/themealdb/search
// Handles filtering by Category ('c'), Ingredient ('i'), or searching by Name ('s')
app.get("/api/recipes/themealdb/search", async (req, res) => {
  try {
    // filterType can be 'c' (category), 'i' (ingredient), or 's' (name)
    const { query, filterType } = req.query;

    if (!query || !filterType) {
      return res
        .status(400)
        .json({ error: "Query and filterType are required." });
    }

    let endpoint = "/filter.php";
    let params = {};

    if (filterType === "c") {
      params = { c: query };
    } else if (filterType === "i") {
      params = { i: query };
    } else if (filterType === "s") {
      // Search by full name (uses a different endpoint)
      endpoint = "/search.php";
      params = { s: query };
    } else {
      return res.status(400).json({ error: "Invalid filterType specified." });
    }

    const { data } = await mealdb.get(endpoint, { params });

    // Map the basic meal results to a consistent card structure
    const mappedMeals = (data.meals || []).map((meal) => ({
      id: meal.idMeal,
      title: meal.strMeal,
      image: `${meal.strMealThumb}/preview`,
      description: "Filtered result. Click to view details.",
      sourceUrl: `/recipes/${meal.idMeal}`,
    }));

    res.json(mappedMeals);
  } catch (error) {
    console.error("TheMealDB Search route error:", error);
    res.status(500).json({
      error: "Failed to fetch search results from TheMealDB",
    });
  }
});

// === SAVED RECIPES ROUTE ============================================
app.post("/api/recipes/save", requireAuth, async (req, res) => {
  const { recipeId } = req.body;
  console.log("Incoming recipeId:", recipeId, typeof recipeId);
  console.log("User:", req.user);

  if (!recipeId) {
    return res.status(400).json({ error: "Recipe ID is required" });
  }

  try {
    // Prevent duplicates
    const existing = await prisma.savedRecipe.findFirst({
      where: {
        userId: req.user.sub,
        recipeId,
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Recipe already saved" });
    }

    const saved = await prisma.savedRecipe.create({
      data: {
        userId: req.user.sub,
        recipeId,
      },
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save recipe" });
  }
});

//GET saved recipes for user
app.get("/api/recipes/saved", requireAuth, async (req, res) => {
  try {
    const saved = await prisma.savedRecipe.findMany({
      where: { userId: req.user.sub },
      select: { recipeId: true },
    });

    if (saved.length === 0) return res.json([]);

    const results = [];

    for (const { recipeId } of saved) {
      try {
        const { data } = await mealdb.get("/lookup.php", {
          params: { i: recipeId },
        });

        const meal = data.meals?.[0];
        if (!meal) continue;

        // --- FIXED: include measurements ---
        const ingredients = Array.from({ length: 20 })
          .map((_, i) => {
            const name = meal[`strIngredient${i + 1}`];
            const measure = meal[`strMeasure${i + 1}`];

            if (name && name.trim()) {
              return {
                name: name.trim(),
                measure: measure ? measure.trim() : "",
              };
            }

            return null;
          })
          .filter(Boolean);

        results.push({
          recipeId,
          title: meal.strMeal,
          image: meal.strMealThumb,
          ingredients,
        });
      } catch (err) {
        console.error("MealDB fetch failed for:", recipeId, err);
      }
    }

    res.json(results);
    // console.log("Fetched saved recipes:", results);
  } catch (err) {
    console.error("Fetch saved recipes error:", err);
    res.status(500).json({ error: "Failed to load saved recipes" });
  }
});

// === NUTRITION BY TITLE (macros + optional micros) =========================
// GET /api/recipes/macrosByTitle?title=Chicken%20Alfredo
// Returns: { title, image, macros: {protein, carbs, fat}, micros?: [...] }
app.get("/api/recipes/macrosByTitle", async (req, res) => {
  const title = (req.query.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "Missing 'title' query param" });
  }

  try {
    // 1) Search Spoonacular by title and include nutrition
    const { data } = await spoon.get("/recipes/complexSearch", {
      params: {
        query: title,
        number: 1,
        addRecipeInformation: true,
        addRecipeNutrition: true,
      },
    });

    const hit = data?.results?.[0];
    if (!hit || !hit.nutrition?.nutrients) {
      return res.status(404).json({
        error:
          "No nutrition found for that title (Spoonacular didn’t return nutrients).",
      });
    }

    const nutrients = hit.nutrition.nutrients; // array: { name, amount, unit, ... }

    // Helpers to pull a nutrient by exact Spoonacular name
    const findAmt = (name) =>
      nutrients.find((n) => n.name === name)?.amount ?? null;
    const findUnit = (name) =>
      nutrients.find((n) => n.name === name)?.unit ?? "";

    // 2) Macros (rounded to whole grams)
    const macros = {
      protein: Math.round(findAmt("Protein") || 0),
      carbs: Math.round(findAmt("Carbohydrates") || 0),
      fat: Math.round(findAmt("Fat") || 0),
    };

    // 3) Curated micros set (keep names as users expect)
    // If a nutrient isn’t present, we skip it.
    const microNames = [
      "Calories",
      "Fiber",
      "Sugar",
      "Sodium",
      "Cholesterol",
      "Saturated Fat",
      "Calcium",
      "Iron",
      "Potassium",
      "Vitamin C",
      "Vitamin A",
      // You can add more: "Zinc", "Magnesium", "Folate", etc.
    ];

    const micros = microNames
      .map((name) => {
        const amt = findAmt(name);
        if (amt === null || amt === undefined) return null;
        return {
          name,
          amount: Math.round(amt),
          unit: findUnit(name),
        };
      })
      .filter(Boolean);

    return res.json({
      title: hit.title,
      image: hit.image,
      macros,
      // only include micros if we actually found any
      ...(micros.length ? { micros } : {}),
    });
  } catch (err) {
    console.error("macrosByTitle error:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: "Failed to fetch nutrition for title",
      details: err.response?.data || err.message,
    });
  }
});

// Return only recipe IDs saved by the current user
app.get("/api/recipes/saved/ids", requireAuth, async (req, res) => {
  try {
    const rows = await prisma.savedRecipe.findMany({
      where: { userId: req.user.sub },
      select: { recipeId: true },
      orderBy: { id: "desc" },
    });
    res.json(rows); // [{recipeId: "52772"}, ...]
  } catch (err) {
    console.error("saved/ids error:", err);
    res.status(500).json({ error: "Failed to load saved IDs" });
  }
});

// Unsave a recipe for the current user
app.post("/api/recipes/unsave", requireAuth, async (req, res) => {
  const { recipeId } = req.body || {};
  if (!recipeId) return res.status(400).json({ error: "recipeId required" });

  try {
    await prisma.savedRecipe.deleteMany({
      where: { userId: req.user.sub, recipeId: String(recipeId) },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("unsave error:", err);
    res.status(500).json({ error: "Failed to remove recipe" });
  }
});

// DELETE a saved recipe for the current user
app.delete("/api/recipes/saved/:recipeId", requireAuth, async (req, res) => {
  try {
    const recipeId = String(req.params.recipeId);
    // idempotent: deleteMany so it's safe even if the row isn't there
    const result = await prisma.savedRecipe.deleteMany({
      where: { userId: req.user.sub, recipeId },
    });
    return res.json({ ok: true, deleted: result.count });
  } catch (err) {
    console.error("Delete saved recipe error:", err);
    return res.status(500).json({ error: "Failed to remove saved recipe" });
  }
});

// ---------------------- Start server ----------------------
app.listen(port, () => {
  console.log(`✅ Server is running at: http://localhost:${port}`);
});
