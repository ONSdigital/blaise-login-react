import { AuthManager } from "./authManager";
import { getCurrentUser } from "./user";

import type { User } from "../types/user.types";

export class AuthClient extends AuthManager {
  public logOut(): void {
    this.clearToken();
  }

  // Changed: let current-user failures bubble to the UI so callers can distinguish a real error from a signed-out session.
  public getLoggedInUser(): Promise<User | null> {
    return getCurrentUser(this);
  }
}
