// --- Mock Prisma BEFORE loading app.js ---
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
