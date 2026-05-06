import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, type Mock, vi } from "vitest";

import { type AuthClient } from "../services/authClient";

import RenderAuthenticatedContent from "./RenderAuthenticatedContent";

import type { User } from "../types/user.types";

describe("RenderAuthenticatedContent", () => {
  const mockAuthClient = {
    getLoggedInUser: vi.fn(),
    logOut: vi.fn(),
  } as unknown as AuthClient;

  const getLoggedInUserMock = mockAuthClient.getLoggedInUser as Mock;
  const logOutMock = mockAuthClient.logOut as Mock;

  const setLoggedIn = vi.fn();
  const mockUser: User = { name: "Bob", role: "Admin", serverParks: ["A"], defaultServerPark: "A" };

  it("displays children when user is successfully loaded", async () => {
    getLoggedInUserMock.mockResolvedValue(mockUser);

    render(
      <RenderAuthenticatedContent
        authClient={mockAuthClient}
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
        authClient={mockAuthClient}
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
