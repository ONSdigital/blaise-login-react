import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import LoginForm from "./LoginForm";
import { AuthManager } from "../services/AuthManager";

const mockAdapter = new MockAdapter(axios);

describe("LoginForm", () => {
  const mockSetLoggedIn = vi.fn();
  const authManager = new AuthManager();

  beforeEach(() => {
    mockSetLoggedIn.mockClear();
    mockAdapter.reset();
  });

  afterEach(() => {
    mockAdapter.reset();
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

      mockAdapter.onPost("/api/login/users/password/validate").reply(200, false);

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

      mockAdapter.onPost("/api/login/users/password/validate").reply(200, true);
      mockAdapter.onGet("/api/login/users/test/authorized").reply(403);

      render(
        <LoginForm
          authManager={authManager}
          setLoggedIn={mockSetLoggedIn}
        />,
      );

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/do not have the correct permissions/i)).toBeVisible();
      expect(mockSetLoggedIn).not.toHaveBeenCalled();
    });
  });

  describe("when authentication succeeds", () => {
    it("calls setLoggedIn(true) after successful login", async () => {
      const user = userEvent.setup();

      mockAdapter.onPost("/api/login/users/password/validate").reply(200, true);
      mockAdapter.onGet("/api/login/users/test/authorized").reply(200, { token: "fake-jwt" });

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
