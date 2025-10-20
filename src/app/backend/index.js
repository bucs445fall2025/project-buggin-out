// load api key from env
require("dotenv").config();

const cors = require("cors");
const express = require("express");
const axios = require("axios");

const app = express();
const port = 5000;

// middleware to parse JSON
app.use(express.json());
app.use(cors());

const SPOON_API_KEY = process.env.SPOON_API_KEY;

// test, temporarily setting to default page
app.get("/", async (req, res) => {
  const url = `https://api.spoonacular.com/recipes/complexSearch?query=pasta&apiKey=${SPOON_API_KEY}`
  try {
    const response = await axios.get(url);
    res.json(response.data); // display in browser
  } catch (error) {
    console.error("Error fetching data:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch from Spoonacular" });
  }
});

// start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// ---------- Spoonacular axios client ----------
const spoon = axios.create({
  baseURL: "https://api.spoonacular.com",
  params: { apiKey: process.env.SPOON_API_KEY },
});

// ---------- Routes ----------

// Search recipes (Spoonacular complexSearch + info + nutrition summary)
app.get("/api/recipes/search", async (req, res) => {
  try {
    const { query = "pasta", number = 10 } = req.query;
    const { data } = await spoon.get("/recipes/complexSearch", {
      params: {
        query,
        number,
        addRecipeInformation: true,
        addRecipeNutrition: true, // returns top-level nutrients summary
      },
    });
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch from Spoonacular",
      details: error.response?.data || error.message,
    });
  }
});

// Get macros for a recipe by ID (more robust: pulls full nutrition list and extracts P/C/F)
app.get("/api/recipes/:id/macros", async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await spoon.get(`/recipes/${id}/information`, {
      params: { includeNutrition: true },
    });

    // Find Protein, Carbohydrates, Fat in the nutrients array
    const nutrients = data?.nutrition?.nutrients || [];
    const get = (name) => nutrients.find((n) => n.name === name)?.amount || 0;

    const macros = {
      protein: Math.round(get("Protein")),
      carbs: Math.round(get("Carbohydrates")),
      fat: Math.round(get("Fat")),
    };

    res.json({ id, title: data.title, image: data.image, macros });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch recipe macros",
      details: error.response?.data || error.message,
    });
  }
});

