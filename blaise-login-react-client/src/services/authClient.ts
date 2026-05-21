import { AuthManager } from "./authManager";
import { getCurrentUser } from "./user";

import type { User } from "../types/user.types";

export class AuthClient extends AuthManager {
  public logOut(): void {
    this.clearToken();
  }

  public getLoggedInUser(): Promise<User | null> {
    return getCurrentUser(this);
  }
}
