import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { AuthManager } from "./AuthManager";
import {
  getCurrentUser,
  getUser,
  validatePassword,
  validateToken,
  validateUserPermissions,
} from "./user";

const mock = new MockAdapter(axios);

describe("userService", () => {
  afterEach(() => {
    mock.reset();
  });

  describe("getCurrentUser", () => {
    it("returns the user details", async () => {
      const authManager = new AuthManager();

      mock.onGet("/api/login/current-user").reply(200, { role: "test" });
      expect(await getCurrentUser(authManager)).toEqual({ role: "test" });
    });
  });

  describe("getUser", () => {
    it("returns user details on success", async () => {
      mock.onGet("/api/login/users/bob").reply(200, { role: "test" });
      expect(await getUser("bob")).toEqual({ role: "test" });
    });

    it("returns undefined when the API call fails", async () => {
      mock.onGet("/api/login/users/bob").reply(500);
      expect(await getUser("bob")).toBeUndefined();
    });
  });

  describe("validatePassword", () => {
    it("returns true on success", async () => {
      mock.onPost("/api/login/users/password/validate").reply(200, true);
      expect(await validatePassword("bob", "password")).toBeTruthy();
    });

    it("returns false and logs error on network failure", async () => {
      mock.onPost("/api/login/users/password/validate").reply(() => {
        throw new Error("Network fail");
      });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(await validatePassword("bob", "password")).toBe(false);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("handles non-error objects thrown in catch", async () => {
      mock.onPost("/api/login/users/password/validate").reply(() => {
        throw "Just a string error";
      });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await validatePassword("bob", "password");

      expect(result).toBe(false);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Just a string error"));

      spy.mockRestore();
    });
  });

  describe("validateUserPermissions", () => {
    it("returns true and jwt on success", async () => {
      mock.onGet("/api/login/users/bob/authorised").reply(200, { token: "token" });
      const [validated, token] = await validateUserPermissions("bob");

      expect(validated).toBe(true);
      expect(token).toBe("token");
    });

    it("returns false on network error", async () => {
      mock.onGet("/api/login/users/bob/authorised").networkError();
      const [validated, token] = await validateUserPermissions("bob");

      expect(validated).toBe(false);
      expect(token).toBeNull();
    });

    it("returns false on throw/rejection", async () => {
      mock.onGet("/api/login/users/bob/authorised").reply(() => {
        throw new Error("Rejection");
      });

      const [validated, token] = await validateUserPermissions("bob");

      expect(validated).toBe(false);
      expect(token).toBeNull();
    });
  });

  describe("validateToken", () => {
    it("returns true for a valid token", async () => {
      mock.onPost("/api/login/token/validate").reply(200);

      const result = await validateToken("valid-token");

      expect(result).toBe(true);
    });

    it("returns false for an invalid token", async () => {
      mock.onPost("/api/login/token/validate").reply(403);

      const result = await validateToken("invalid-token");

      expect(result).toBe(false);
    });
  });
});
