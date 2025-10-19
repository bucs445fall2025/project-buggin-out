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
