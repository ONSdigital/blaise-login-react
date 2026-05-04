import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LoginForm from "./LoginForm";
import { AuthManager } from "../services/AuthManager";

vi.mock("blaise-design-system-react-components", () => ({
  ErrorPanel: ({ text }: { text: string }) => <div role="alert">{text}</div>,
  StyledForm: ({
    fields,
    onSubmitFunction,
    submitLabel,
  }: {
    fields: Array<{ name: string; id?: string; type: string; initial_value: string }>;
    onSubmitFunction: (
      values: Record<string, string>,
      setSubmitting: (isSubmitting: boolean) => void,
    ) => Promise<void>;
    submitLabel: string;
  }) => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const values = Object.fromEntries(formData.entries()) as Record<string, string>;

        await onSubmitFunction(values, vi.fn());
      }}
    >
      {fields.map((field) => {
        const inputId = field.id ?? field.name;

        return (
          <label
            key={field.name}
            htmlFor={inputId}
          >
            {field.name}
            <input
              id={inputId}
              name={field.name}
              type={field.type}
              defaultValue={field.initial_value}
            />
          </label>
        );
      })}
      <button type="submit">{submitLabel}</button>
    </form>
  ),
}));

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

  it("renders the sign in form", async () => {
    render(
      <LoginForm
        authManager={authManager}
        setLoggedIn={mockSetLoggedIn}
      />,
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  describe("when authentication fails", () => {
    it("displays error for incorrect credentials", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
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
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "test", password: "password" }),
      });
    });

    it("displays error for unauthorized users", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      render(
        <LoginForm
          authManager={authManager}
          setLoggedIn={mockSetLoggedIn}
        />,
      );

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/do not have the correct permissions/i)).toBeVisible();
      expect(mockSetLoggedIn).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("displays a generic error when the request fails unexpectedly", async () => {
      const user = userEvent.setup();

      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      render(
        <LoginForm
          authManager={authManager}
          setLoggedIn={mockSetLoggedIn}
        />,
      );

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/unable to sign in\. please try again\./i)).toBeVisible();
      expect(mockSetLoggedIn).not.toHaveBeenCalled();
    });
  });

  describe("when authentication succeeds", () => {
    it("calls setLoggedIn(true) after successful login", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ token: "fake-jwt" }) });

      const setTokenSpy = vi.spyOn(authManager, "setToken").mockImplementation(() => {});

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
      expect(setTokenSpy).toHaveBeenCalledWith("fake-jwt");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
