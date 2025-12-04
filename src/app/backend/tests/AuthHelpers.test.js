process.env.JWT_SECRET = "test_secret";
const jwt = require("jsonwebtoken");
const { signToken, requireAuth } = require("../helpers/auth");

jest.mock("jsonwebtoken");

describe("AuthHelpers", () => {
  describe("signToken", () => {
    test("test_signToken_validUser", () => {
      const user = { id: 1, email: "test@test.com" };

      jwt.sign.mockReturnValue("mock.jwt.token");

      const result = signToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 1, email: "test@test.com" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      expect(result).toBe("mock.jwt.token");
    });

    test("test_signToken_missingFields", () => {
      expect(() => signToken({})).toThrow();
      expect(() => signToken({ id: 1 })).toThrow();
      expect(() => signToken({ email: "x@test.com" })).toThrow();
    });
  });

  describe("requireAuth", () => {
    const next = jest.fn();
    let req, res;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next.mockClear();
    });

    test("test_requireAuth_validToken", () => {
      req.headers.authorization = "Bearer valid.token";

      jwt.verify.mockReturnValue({ sub: 1, email: "test@test.com" });

      requireAuth(req, res, next);

      expect(req.user).toEqual({ sub: 1, email: "test@test.com" });
      expect(next).toHaveBeenCalled();
    });

    test("test_requireAuth_missingToken", () => {
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing token" });
      expect(next).not.toHaveBeenCalled();
    });

    test("test_requireAuth_invalidToken", () => {
      req.headers.authorization = "Bearer invalid";
      jwt.verify.mockImplementation(() => {
        throw new Error("bad token");
      });

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });
  });
});
