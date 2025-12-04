beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

const request = require("supertest");
const { app, spoon } = require("../app"); // import your Express app and axios instance

// Mock the axios instance used in app.js
spoon.get = jest.fn();

describe("RecipesRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------- SEARCH ROUTE TESTS ---------
  test("test_searchRecipes_defaultQuery", async () => {
    spoon.get.mockResolvedValue({ data: { results: [{ id: 1 }] } });

    const res = await request(app).get("/api/recipes/search");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(1);
  });

  test("test_searchRecipes_customQuery", async () => {
    spoon.get.mockResolvedValue({ data: { results: [{ id: 99 }] } });

    const res = await request(app).get("/api/recipes/search?q=chicken");

    expect(spoon.get).toHaveBeenCalled();
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(99);
  });

  test("test_searchRecipes_apiError", async () => {
    spoon.get.mockRejectedValue(new Error("fail"));

    const res = await request(app).get("/api/recipes/search");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch from Spoonacular");
  });

  // --------- RANDOM ROUTE TESTS ---------
  test("test_randomRecipes_defaultCount", async () => {
    spoon.get.mockResolvedValue({ data: { recipes: [{ id: 1 }, { id: 2 }] } });

    const res = await request(app).get("/api/recipes/random");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].id).toBe(1);
    expect(res.body[1].id).toBe(2);
  });

  test("test_randomRecipes_withTags", async () => {
    spoon.get.mockResolvedValue({ data: { recipes: [{ id: 1 }] } });

    const res = await request(app)
      .get("/api/recipes/random?includeTags=vegan&excludeTags=gluten");

    expect(spoon.get).toHaveBeenCalled();
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(1);
  });
});
