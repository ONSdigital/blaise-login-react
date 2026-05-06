import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as asyncHook from "../hooks/useAsyncRequest";
import { type AuthClient } from "../services/authClient";

import AuthUser from "./AuthUser";

vi.mock("./LayoutTemplate", () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="layout-template">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("./LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}));

describe("AuthUser", () => {
  const mockSetLoggedIn = vi.fn();
  const mockAuthClient = {
    loggedIn: vi.fn(),
  } as unknown as AuthClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays layout and login form when async state is 'succeeded'", () => {
    vi.spyOn(asyncHook, "useAsyncRequest").mockReturnValue({ state: "succeeded", data: undefined });

    render(
      <AuthUser
        title="Sign In"
        authClient={mockAuthClient}
        setLoggedIn={mockSetLoggedIn}
      />,
    );

    expect(screen.getByTestId("layout-template")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Enter your Blaise username and password")).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("calls checkAuthStatus and updates loggedIn state", async () => {
    vi.spyOn(asyncHook, "useAsyncRequest").mockImplementation((fn) => {
      fn();

      return { state: "loading" };
    });

    (mockAuthClient.loggedIn as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(
      <AuthUser
        title="Sign In"
        authClient={mockAuthClient}
        setLoggedIn={mockSetLoggedIn}
      />,
    );

    await waitFor(() => {
      expect(mockAuthClient.loggedIn).toHaveBeenCalled();
      expect(mockSetLoggedIn).toHaveBeenCalledWith(true);
    });
  });
});
