import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import AuthenticationApi from "./AuthenticationApi";
import { getCurrentUser } from "./user";
import mockUser from "../mocks/user.mock";

vi.mock("./user");

const mockGetCurrentUser = getCurrentUser as Mock;

describe("AuthenticationApi - getLoggedInUser", () => {
  let sut: AuthenticationApi;

  beforeEach(() => {
    sut = new AuthenticationApi();
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
