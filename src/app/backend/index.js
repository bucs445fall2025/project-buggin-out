// ---------------------- Load environment variables ----------------------
require("dotenv").config();

// ---------------------- Imports ----------------------
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ---------------------- Uploads (multer) ----------------------
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
      cb(
        null,
        Date.now() +
          "_" +
          Math.round(Math.random() * 1e9) +
          path.extname(file.originalname)
      ),
  }),
});

// === Auth imports (bcrypt, jwt)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// === Auth helpers
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

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ---------------------- Spoonacular API setup ----------------------
const SPOON_API_KEY = process.env.SPOON_API_KEY;
const spoon = axios.create({
  baseURL: "https://api.spoonacular.com",
  params: { apiKey: SPOON_API_KEY },
});

// ---------------------- TheMealDB API (Free) ----------------------
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

app.get("/api/me", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { id: true, email: true, profile: true },
  });
  res.json(me);
});

app.get("/api/profile", requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.user.sub },
  });
  res.json(profile);
});

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

    res.json({ id, title: data.title, ingredients });
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

app.get("/api/recipes/themealdb/details/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data } = await mealdb.get("/lookup.php", { params: { i: id } });
    const meal = data.meals?.[0];
    if (!meal) return res.status(404).json({ error: "Meal not found" });

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

app.get("/api/recipes/themealdb/categories", async (req, res) => {
  try {
    const { data } = await mealdb.get("/categories.php");
    res.json(data.categories || []);
  } catch (error) {
    console.error("TheMealDB Categories route error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get("/api/recipes/themealdb/random_3", async (req, res) => {
  try {
    const mealPromises = [];
    for (let i = 0; i < 6; i++) mealPromises.push(mealdb.get("/random.php"));
    const responses = await Promise.all(mealPromises);

    const meals = responses.map((r) => r.data?.meals?.[0]).filter(Boolean);
    const mappedMeals = meals.map((meal) => ({
      id: meal.idMeal,
      title: meal.strMeal,
      image: `${meal.strMealThumb}/preview`,
      description: `Category: ${meal.strCategory} | Area: ${meal.strArea}`,
      sourceUrl: `/recipes/${meal.idMeal}`,
    }));

    res.json(mappedMeals);
  } catch (error) {
    console.error("TheMealDB Random 3 route error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch random meals from TheMealDB" });
  }
});

app.get("/api/recipes/themealdb/search", async (req, res) => {
  try {
    const { query, filterType } = req.query;
    if (!query || !filterType)
      return res
        .status(400)
        .json({ error: "Query and filterType are required." });

    let endpoint = "/filter.php";
    let params = {};
    if (filterType === "c") params = { c: query };
    else if (filterType === "i") params = { i: query };
    else if (filterType === "s") {
      endpoint = "/search.php";
      params = { s: query };
    } else {
      return res.status(400).json({ error: "Invalid filterType specified." });
    }

    const { data } = await mealdb.get(endpoint, { params });
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
    res
      .status(500)
      .json({ error: "Failed to fetch search results from TheMealDB" });
  }
});

// === SAVED RECIPES ROUTES ============================================

app.post("/api/recipes/save", requireAuth, async (req, res) => {
  const { recipeId } = req.body;
  if (!recipeId)
    return res.status(400).json({ error: "Recipe ID is required" });

  try {
    const existing = await prisma.savedRecipe.findFirst({
      where: { userId: req.user.sub, recipeId },
    });
    if (existing)
      return res.status(409).json({ error: "Recipe already saved" });

    const saved = await prisma.savedRecipe.create({
      data: { userId: req.user.sub, recipeId },
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save recipe" });
  }
});

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
  } catch (err) {
    console.error("Fetch saved recipes error:", err);
    res.status(500).json({ error: "Failed to load saved recipes" });
  }
});

app.get("/api/recipes/saved/ids", requireAuth, async (req, res) => {
  try {
    const rows = await prisma.savedRecipe.findMany({
      where: { userId: req.user.sub },
      select: { recipeId: true },
      orderBy: { id: "desc" },
    });
    res.json(rows);
  } catch (err) {
    console.error("saved/ids error:", err);
    res.status(500).json({ error: "Failed to load saved IDs" });
  }
});

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

app.delete("/api/recipes/saved/:recipeId", requireAuth, async (req, res) => {
  try {
    const recipeId = String(req.params.recipeId);
    const result = await prisma.savedRecipe.deleteMany({
      where: { userId: req.user.sub, recipeId },
    });
    return res.json({ ok: true, deleted: result.count });
  } catch (err) {
    console.error("Delete saved recipe error:", err);
    return res.status(500).json({ error: "Failed to remove saved recipe" });
  }
});

// === POSTS, LIKES (toggle), COMMENTS ======================

// GET all posts (include likes as user ids for client to compute)
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true } },
          },
        },
        comments: {
          include: { user: { select: { id: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
        likes: { select: { userId: true, postId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// CREATE post (supports image upload)
app.post(
  "/api/posts",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, category, area, ingredients, instructions, content } =
        req.body;

      // Required fields
      if (!title || !category || !area || !ingredients || !instructions) {
        return res.status(400).json({
          error:
            "Title, category, area, ingredients, and instructions are required",
        });
      }

      // Parse ingredients (may arrive as JSON string)
      let parsedIngredients;
      try {
        parsedIngredients =
          typeof ingredients === "string"
            ? JSON.parse(ingredients)
            : ingredients;

        if (!Array.isArray(parsedIngredients)) {
          return res.status(400).json({
            error: "Ingredients must be an array of { name, measure }",
          });
        }
      } catch (err) {
        return res.status(400).json({ error: "Invalid ingredients format" });
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const post = await prisma.post.create({
        data: {
          title,
          category,
          area,
          ingredients: parsedIngredients,
          instructions,
          content: content || "",
          imageUrl,
          userId: req.user.sub,
        },
      });

      res.status(201).json(post);
    } catch (err) {
      console.error("Create post error:", err);
      res.status(500).json({ error: "Failed to create post" });
    }
  }
);

// TOGGLE like/unlike — returns { liked, likes }
app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user.sub;

    const existing = await prisma.postLike.findFirst({
      where: { postId, userId },
    });

    if (existing) {
      // UNLIKE
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      // LIKE
      await prisma.postLike.create({ data: { postId, userId } });
    }

    const likes = await prisma.postLike.findMany({
      where: { postId },
      select: { userId: true, postId: true },
      orderBy: { id: "asc" },
    });
    const liked = likes.some((l) => l.userId === userId);

    return res.json({ liked, likes });
  } catch (err) {
    console.error("Like toggle error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// GET current user's posts
app.get("/api/posts/mine", requireAuth, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.user.sub },
      include: {
        user: { select: { id: true, email: true, profile: true } },
        comments: {
          include: { user: { select: { id: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
        likes: { select: { userId: true, postId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (err) {
    console.error("Fetch my posts error:", err);
    res.status(500).json({ error: "Failed to fetch your posts" });
  }
});

// DELETE a post (owner only)
app.delete("/api/posts/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ error: "Invalid post id" });

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== req.user.sub)
      return res.status(403).json({ error: "Not allowed" });

    if (post.imageUrl && post.imageUrl.startsWith("/uploads/")) {
      const abs = path.join(
        process.cwd(),
        "uploads",
        path.basename(post.imageUrl)
      );
      fs.unlink(abs, () => {}); // best-effort
    }

    await prisma.postLike.deleteMany({ where: { postId: id } });
    await prisma.postComment.deleteMany({ where: { postId: id } });
    await prisma.post.delete({ where: { id } });

    res.json({ ok: true });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// === JOURNEY (diary) ROUTES ==========================================
app.get("/api/journey", requireAuth, async (req, res) => {
  try {
    const rows = await prisma.journeyEntry.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "desc" },
    });
    res.json(rows);
  } catch (err) {
    console.error("Journey list error:", err);
    res.status(500).json({ error: "Failed to load journey" });
  }
});

app.post("/api/journey", requireAuth, async (req, res) => {
  try {
    const { title = "", content = "" } = req.body || {};
    if (!content.trim()) {
      return res.status(400).json({ error: "Content cannot be empty" });
    }
    const created = await prisma.journeyEntry.create({
      data: {
        userId: req.user.sub,
        title: title.trim() || null,
        content: content.trim(),
      },
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("Journey create error:", err);
    res.status(500).json({ error: "Failed to save entry" });
  }
});

app.delete("/api/journey/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const entry = await prisma.journeyEntry.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ error: "Not found" });
    if (entry.userId !== req.user.sub) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await prisma.journeyEntry.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Journey delete error:", err);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

// ---------------------- Start server ----------------------
app.listen(port, () => {
  console.log(`✅ Server is running at: http://localhost:${port}`);
});
