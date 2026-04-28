import type { User } from "../types/User";

const mockUser: User = Object.freeze({
  name: "Jake Bullet",
  role: "Manager",
  serverParks: ["gusty"],
  defaultServerPark: "gusty",
});

export default mockUser;
