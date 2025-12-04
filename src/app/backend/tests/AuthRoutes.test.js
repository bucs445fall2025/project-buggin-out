// --- FULL PRISMA MOCK BEFORE app.js ---
jest.mock("../prisma", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $on: jest.fn(),
  $use: jest.fn(),
}));

// --- Mock bcrypt BEFORE loading app.js ---
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// --- Mock JWT BEFORE loading app.js ---
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "fake-jwt-token"),
}));

// Load app AFTER mocks
const request = require("supertest");
const app = require("../app");
const prisma = require("../prisma");
const bcrypt = require("bcryptjs");

describe("AuthRoutes", () => {

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/signup", () => {

    test("test_signup_success", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      prisma.user.create.mockResolvedValue({
        id: 1,
        email: "x@test.com",
        profile: { displayName: "" }
      });

      bcrypt.hash.mockResolvedValue("hashed-password");

      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "x@test.com", password: "123456" });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("x@test.com");
      expect(res.body.token).toBe("fake-jwt-token");
    });

    test("test_signup_existingEmail", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "x@test.com", password: "123456" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email already registered");
    });

    test("test_signup_missingFields", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("email and password required");
    });
  });

  describe("POST /api/auth/login", () => {

    test("test_login_success", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "x@test.com",
        passwordHash: "hashed-password",
      });

      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "x@test.com", password: "123456" });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("x@test.com");
      expect(res.body.token).toBe("fake-jwt-token");
    });

    test("test_login_invalidPassword", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "x@test.com",
        passwordHash: "hashed-password",
      });

      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "x@test.com", password: "wrong" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    test("test_login_unknownEmail", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "unknown@test.com", password: "123" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });
  });
});
