import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, type Mock } from "vitest"; // 1. Import Mock
import RenderAuthenticatedContent from "./RenderAuthenticatedContent";
import AuthenticationApi from "../services/AuthenticationApi";
import type { User } from "../types/User";

describe("RenderAuthenticatedContent", () => {
  const mockAuthApi = {
    getLoggedInUser: vi.fn(),
    logOut: vi.fn(),
  } as unknown as AuthenticationApi;

  const getLoggedInUserMock = mockAuthApi.getLoggedInUser as Mock;
  const logOutMock = mockAuthApi.logOut as Mock;

  const setLoggedIn = vi.fn();
  const mockUser: User = { name: "Bob", role: "Admin", serverParks: ["A"], defaultServerPark: "A" };

  it("displays children when user is successfully loaded", async () => {
    getLoggedInUserMock.mockResolvedValue(mockUser);

    render(
      <RenderAuthenticatedContent
        authenticationApi={mockAuthApi}
        setLoggedIn={setLoggedIn}
      >
        {(user) => <div>{user.name}</div>}
      </RenderAuthenticatedContent>,
    );

    expect(await screen.findByText("Bob")).toBeInTheDocument();
  });

  it("calls logOut when user name is empty", async () => {
    const invalidUser = { ...mockUser, name: "" };

    getLoggedInUserMock.mockResolvedValue(invalidUser);

    render(
      <RenderAuthenticatedContent
        authenticationApi={mockAuthApi}
        setLoggedIn={setLoggedIn}
      >
        {() => <div>Content</div>}
      </RenderAuthenticatedContent>,
    );

    await waitFor(() => {
      expect(logOutMock).toHaveBeenCalled();
    });
  });
});
