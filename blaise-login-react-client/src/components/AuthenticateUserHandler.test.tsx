import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthenticateUserHandler from "./AuthenticateUserHandler";
import userEvent from "@testing-library/user-event";
import type { User } from "blaise-api-node-client";
import type { ReactNode } from "react";

vi.mock("./AuthenticateUser", () => ({
  default: ({ setLoggedIn }: { setLoggedIn: (state: boolean) => void }) => (
    <div data-testid="authenticate-user">
      <button onClick={() => setLoggedIn(true)}>Simulate Login</button>
    </div>
  ),
}));

vi.mock("./RenderAuthenticatedContent", () => ({
  default: ({
    children,
  }: {
    children: (user: User, loggedIn: boolean, logOutFunction: () => void) => ReactNode;
  }) => (
    <div data-testid="render-authenticated-content">
      {children({ name: "Admin" } as User, true, vi.fn())}
    </div>
  ),
}));

describe("AuthenticateUserHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays AuthenticateUser when loggedIn is initially false", () => {
    render(
      <AuthenticateUserHandler title="Handler Title">
        {() => <div>Secure Content</div>}
      </AuthenticateUserHandler>,
    );

    expect(screen.getByTestId("authenticate-user")).toBeInTheDocument();
    expect(screen.queryByTestId("render-authenticated-content")).not.toBeInTheDocument();
  });

  it("displays RenderAuthenticatedContent when loggedIn becomes true", async () => {
    const user = userEvent.setup();

    render(
      <AuthenticateUserHandler title="Handler Title">
        {(user) => <div data-testid="secure-content">Secure Content for {user.name}</div>}
      </AuthenticateUserHandler>,
    );

    await user.click(screen.getByText("Simulate Login"));

    expect(screen.queryByTestId("authenticate-user")).not.toBeInTheDocument();
    expect(screen.getByTestId("render-authenticated-content")).toBeInTheDocument();
    expect(screen.getByTestId("secure-content")).toHaveTextContent("Secure Content for Admin");
  });
});
