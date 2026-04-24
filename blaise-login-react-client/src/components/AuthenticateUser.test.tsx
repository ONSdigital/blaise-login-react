import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthenticateUser from "./AuthenticateUser";
import AuthenticationApi from "../services/AuthenticationApi";
import * as asyncHook from "../hooks/useAsyncRequest";

vi.mock("./LayoutTemplate", () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="layout-template">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("./LoginForm", () => ({
  default: () => <div data-testid="login-form">Login Form</div>,
}));

describe("AuthenticateUser", () => {
  const mockSetLoggedIn = vi.fn();
  const mockAuthApi = {
    loggedIn: vi.fn(),
  } as unknown as AuthenticationApi;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the layout and login form when the async state succeeds", () => {
    vi.spyOn(asyncHook, "useAsyncRequest").mockReturnValue({ state: "succeeded", data: undefined });

    render(
      <AuthenticateUser
        title="Sign In"
        authenticationApi={mockAuthApi}
        setLoggedIn={mockSetLoggedIn}
      />,
    );

    expect(screen.getByTestId("layout-template")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Enter your Blaise username and password")).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("executes the checkAuthStatus side effect and updates loggedIn state", async () => {
    vi.spyOn(asyncHook, "useAsyncRequest").mockImplementation((fn) => {
      fn();

      return { state: "loading" };
    });

    (mockAuthApi.loggedIn as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(
      <AuthenticateUser
        title="Sign In"
        authenticationApi={mockAuthApi}
        setLoggedIn={mockSetLoggedIn}
      />,
    );

    await waitFor(() => {
      expect(mockAuthApi.loggedIn).toHaveBeenCalled();
      expect(mockSetLoggedIn).toHaveBeenCalledWith(true);
    });
  });
});
