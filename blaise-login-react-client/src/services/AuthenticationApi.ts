import type { User } from "blaise-api-node-client";
import { AuthManager } from "./AuthManager";
import { getCurrentUser } from "./user";

export default class AuthenticationApi extends AuthManager {
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
