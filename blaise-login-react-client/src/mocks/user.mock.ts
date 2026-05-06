import type { User } from "../types/user.types";

const mockUser: User = Object.freeze({
  name: "Jake Bullet",
  role: "Manager",
  serverParks: ["gusty"],
  defaultServerPark: "gusty",
});

export { mockUser };
