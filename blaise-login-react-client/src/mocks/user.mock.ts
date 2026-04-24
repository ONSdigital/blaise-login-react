import type { User } from "blaise-api-node-client";

const mockUser: User = Object.freeze({
  name: "Jake Bullet",
  role: "Manager",
  serverParks: ["gusty"],
  defaultServerPark: "gusty",
});

export const buildMockUser = (overrides?: Partial<User>): User => ({
  ...mockUser,
  ...overrides,
});

export default mockUser;
