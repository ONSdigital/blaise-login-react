import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./LoginForm";

vi.mock("blaise-design-system-react-components", () => ({
  ErrorPanel: ({ text }: { text: string }) => <div role="alert">{text}</div>,
  StyledForm: ({
    fields,
    onSubmitFunction,
    submitLabel,
  }: {
    fields: Array<{ name: string; id?: string; type: string; initialValue: string }>;
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
              defaultValue={field.initialValue}
            />
          </label>
        );
      })}
      <button type="submit">{submitLabel}</button>
    </form>
  ),
}));

describe("LoginForm", () => {
  const onAuthenticated = vi.fn().mockResolvedValue(undefined);
  const mockFetch = vi.fn();

  beforeEach(() => {
    onAuthenticated.mockClear();
    onAuthenticated.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the sign in form", async () => {
    render(<LoginForm onAuthenticated={onAuthenticated} />);

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

      render(<LoginForm onAuthenticated={onAuthenticated} />);

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/incorrect username or password/i)).toBeVisible();
      expect(onAuthenticated).not.toHaveBeenCalled();
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

      render(<LoginForm onAuthenticated={onAuthenticated} />);

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/do not have the correct permissions/i)).toBeVisible();
      expect(onAuthenticated).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("displays a generic error when the request fails unexpectedly", async () => {
      const user = userEvent.setup();

      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      render(<LoginForm onAuthenticated={onAuthenticated} />);

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/unable to sign in\. please try again\./i)).toBeVisible();
      expect(onAuthenticated).not.toHaveBeenCalled();
    });

    it("displays a rate limit error when too many attempts are made", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });

      render(<LoginForm onAuthenticated={onAuthenticated} />);

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(
        await screen.findByText(/too many login attempts, please try again later/i),
      ).toBeVisible();
      expect(onAuthenticated).not.toHaveBeenCalled();
    });
  });

  describe("when authentication succeeds", () => {
    it("calls onAuthenticated with the returned token", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ token: "fake-jwt" }) });

      render(<LoginForm onAuthenticated={onAuthenticated} />);

      await user.type(screen.getByLabelText(/username/i), "test");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(onAuthenticated).toHaveBeenCalledWith("fake-jwt");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
