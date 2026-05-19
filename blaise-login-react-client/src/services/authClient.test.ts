import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { mockUser } from "../mocks/user.mock";

import { AuthClient } from "./authClient";
import { getCurrentUser } from "./user";

vi.mock("./user");

const mockGetCurrentUser = getCurrentUser as Mock;

describe("AuthClient", () => {
  let sut: AuthClient;

  beforeEach(() => {
    sut = new AuthClient({
      sessionKey: "blaise-user-test",
      cookieDomain: ".social-surveys.gcp.onsdigital.uk",
    });
    vi.resetAllMocks();
  });

  it("should return the expected user when the API call succeeds", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const user = await sut.getLoggedInUser();

    expect(user).toEqual(mockUser);
    expect(mockGetCurrentUser).toHaveBeenCalledWith(sut);
  });

  it("should return null when the API reports no logged in user", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const user = await sut.getLoggedInUser();

    expect(user).toBeNull();
  });

  it("should propagate errors from getCurrentUser", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Network failure"));

    await expect(sut.getLoggedInUser()).rejects.toThrow("Network failure");
  });

  it("should clear the token when logOut is called", () => {
    const clearTokenSpy = vi.spyOn(sut, "clearToken");

    sut.logOut();

    expect(clearTokenSpy).toHaveBeenCalled();
  });

  it("should expose the inherited session config", () => {
    expect(sut.sessionKey).toBe("blaise-user-test");
    expect(sut.cookieDomain).toBe("social-surveys.gcp.onsdigital.uk");
  });
});
