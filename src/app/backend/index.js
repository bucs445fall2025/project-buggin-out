// ---------------------- Load environment variables ----------------------
require("dotenv").config();

// ---------------------- Imports ----------------------
const express = require("express");
const cors = require("cors");
const axios = require("axios");

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

// ---------------------- Routes ----------------------

// Root test route
app.get("/", async (req, res) => {
  try {
    // Note: The root test route is not using the 'spoon' axios instance for demonstration,
    // but the API key is correctly appended by the client in this case.
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

// ---------------------- NEW ROUTE: Get Random Recipes ----------------------
app.get("/api/recipes/random", async (req, res) => {
  try {
    // Destructure query parameters with sensible defaults
    const {
      number = 6, // Default to 6 recipes for a nice display
      includeNutrition = true,
      "include-tags": includeTags,
      "exclude-tags": excludeTags,
    } = req.query;

    // Use the 'spoon' instance, which automatically includes the API Key
    const { data } = await spoon.get("/recipes/random", {
      params: {
        number,
        includeNutrition,
        // Only include tags if they are provided, otherwise Spoonacular will ignore them
        ...(includeTags && { "include-tags": includeTags }),
        ...(excludeTags && { "exclude-tags": excludeTags }),
      },
    });

    // The Spoonacular response for 'random' is an object containing a 'recipes' array,
    // which is the format the frontend expects.
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
// ----------------------------------------------------------------------------

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

// ---------------------- Start server ----------------------
app.listen(port, () => {
  console.log(`✅ Server is running at: http://localhost:${port}`);
});
