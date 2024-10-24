import { User } from "blaise-api-node-client";
import { AuthManager } from "./token";
import { getCurrentUser } from "./user";

export default class AuthenticationApi extends AuthManager {
  constructor() {
    super();
    this.getLoggedInUser = this.getLoggedInUser.bind(this);
  }

  logOut(setLoggedIn: (loggedIn: boolean) => void) {
    super.clearToken();
    setLoggedIn(false);
  }

  async getLoggedInUser(): Promise<User | null> {
    try {
      return await getCurrentUser(this);
    } catch (error) {
      console.error("Unable to retrieve logged in user" + error)
      return null;
    }
  }
}
