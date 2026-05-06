import { AuthManager } from "./authManager";
import { getCurrentUser } from "./user";

import type { User } from "../types/user.types";

export class AuthClient extends AuthManager {
  constructor() {
    super();
  }

  public logOut = (setLoggedIn: (loggedIn: boolean) => void): void => {
    this.clearToken();
    setLoggedIn(false);
  };

  public getLoggedInUser = async (): Promise<User> => {
    try {
      return await getCurrentUser(this);
    } catch (error: unknown) {
      console.error("Unable to retrieve logged in user:", error);

      return { name: "", role: "", serverParks: [""], defaultServerPark: "" };
    }
  };
}
