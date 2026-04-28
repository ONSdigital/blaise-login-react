import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LoginForm from "./LoginForm";
import { AuthManager } from "../services/AuthManager";

describe("LoginForm", () => {
  const mockSetLoggedIn = vi.fn();
  const authManager = new AuthManager();
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockSetLoggedIn.mockClear();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("matches snapshot for initial render", async () => {
    const { asFragment } = render(
      <LoginForm
        authManager={authManager}
        setLoggedIn={mockSetLoggedIn}
      />,
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });

  describe("when authentication fails", () => {
    it("displays error for incorrect credentials", async () => {
      const user = userEvent.setup();

      // Mock validatePassword failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => false,
      });

      render(
        <LoginForm
          authManager={authManager}
          setLoggedIn={mockSetLoggedIn}
        />,
      );

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/incorrect username or password/i)).toBeVisible();
      expect(mockSetLoggedIn).not.toHaveBeenCalled();
    });

    it("displays error for unauthorized users", async () => {
      const user = userEvent.setup();

      // Mock validatePassword success, then validateUserPermissions failure
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => true }) // validatePassword
        .mockResolvedValueOnce({ ok: false, status: 403 }); // validateUserPermissions

      render(
        <LoginForm
          authManager={authManager}
          setLoggedIn={mockSetLoggedIn}
        />,
      );

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password"); // Adding password type to ensure first mock is hit correctly
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/do not have the correct permissions/i)).toBeVisible();
      expect(mockSetLoggedIn).not.toHaveBeenCalled();
    });
  });

  describe("when authentication succeeds", () => {
    it("calls setLoggedIn(true) after successful login", async () => {
      const user = userEvent.setup();

      // Mock both calls succeeding
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => true }) // validatePassword
        .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "fake-jwt" }) }); // validateUserPermissions

      // Ensure the authManager mock accepts the token
      vi.spyOn(authManager, "setToken").mockImplementation(() => {});

      render(
        <LoginForm
          authManager={authManager}
          setLoggedIn={mockSetLoggedIn}
        />,
      );

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(mockSetLoggedIn).toHaveBeenCalledWith(true);
    });
  });
});
