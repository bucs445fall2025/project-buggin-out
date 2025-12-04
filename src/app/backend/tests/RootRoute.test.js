beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

jest.mock("axios");
const axios = require("axios");
const request = require("supertest");
const app = require("../app");

describe("RootRoute", () => {
  test("test_root_returnsRecipes", async () => {
    axios.get.mockResolvedValue({
      data: [{ id: 1, name: "Recipe" }],
    });

    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("test_root_apiFailure", async () => {
    axios.get.mockRejectedValue(new Error("fail"));

    const res = await request(app).get("/");

    expect(res.status).toBe(500);
  });
});
