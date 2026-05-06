import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { mockUser } from "../mocks/user.mock";

import { AuthClient } from "./authClient";
import { getCurrentUser } from "./user";

vi.mock("./user");

const mockGetCurrentUser = getCurrentUser as Mock;

describe("AuthClient - getLoggedInUser", () => {
  let sut: AuthClient;

  beforeEach(() => {
    sut = new AuthClient();
    vi.resetAllMocks();
  });

  it("should return the expected user when the API call succeeds", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const user = await sut.getLoggedInUser();

    expect(user).toEqual(mockUser);
    expect(mockGetCurrentUser).toHaveBeenCalledWith(sut);
  });

  it("should return an empty user object and log an error if getCurrentUser fails", async () => {
    const expectedFallbackUser = { name: "", role: "", serverParks: [""], defaultServerPark: "" };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockGetCurrentUser.mockRejectedValue(new Error("Network failure"));

    const user = await sut.getLoggedInUser();

    expect(user).toEqual(expectedFallbackUser);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Unable to retrieve logged in user:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("should clear the token and set logged in to false when logOut is called", () => {
    const clearTokenSpy = vi.spyOn(sut, "clearToken");
    const setLoggedIn = vi.fn();

    sut.logOut(setLoggedIn);

    expect(clearTokenSpy).toHaveBeenCalled();
    expect(setLoggedIn).toHaveBeenCalledWith(false);
  });
});
