/**
 * Mock Prisma
 */
jest.mock("../prisma", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  profile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }
}));

/**
 * Mock Auth Helpers
 * IMPORTANT: Must mock BEFORE requiring the app
 */
jest.mock("../helpers/auth", () => ({
  signToken: jest.fn(),
  requireAuth: jest.fn((req, res, next) => {
    req.user = { sub: 1 }; // pretend authenticated
    next();
  })
}));

const request = require("supertest");
const app = require("../app");
const prisma = require("../prisma");
const auth = require("../helpers/auth");

describe("UserProfileRoutes", () => {

  test("test_getMe_authenticated", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "x@test.com",
      profile: { displayName: "Johnny" }
    });

    const res = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("x@test.com");
    expect(res.body.profile.displayName).toBe("Johnny");
  });

  test("test_getMe_unauthenticated", async () => {
    // Override for this one test
    auth.requireAuth.mockImplementationOnce((req, res) => {
      return res.status(401).json({ error: "Missing token" });
    });

    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  test("test_getProfile_authenticated", async () => {
    prisma.profile.findUnique.mockResolvedValue({
      id: 1,
      displayName: "Johnny"
    });

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe("Johnny");
  });

  test("test_putProfile_update", async () => {
    prisma.profile.findUnique.mockResolvedValue({ id: 1 });

    prisma.profile.update.mockResolvedValue({
      id: 1,
      displayName: "NewName"
    });

    const res = await request(app)
      .put("/api/profile")
      .set("Authorization", "Bearer valid")
      .send({ displayName: "NewName" });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe("NewName");
  });

  test("test_putProfile_createNew", async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    prisma.profile.create.mockResolvedValue({
      id: 1,
      displayName: "FirstProfile"
    });

    const res = await request(app)
      .put("/api/profile")
      .set("Authorization", "Bearer valid")
      .send({ displayName: "FirstProfile" });

    expect(res.status).toBe(201);
    expect(res.body.displayName).toBe("FirstProfile");
  });

});

