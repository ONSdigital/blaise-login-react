import { render, screen } from "@testing-library/react";
import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginView from "./LoginView";

const loginFormProps: Array<{ onAuthenticated: (token: string) => Promise<void> }> = [];

vi.mock("./LayoutTemplate", () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="layout-template">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("./LoginForm", () => ({
  LoginForm: (props: { onAuthenticated: (token: string) => Promise<void> }) => {
    loginFormProps.push(props);

    return <div data-testid="login-form">Login Form</div>;
  },
}));

describe("LoginView", () => {
  const onAuthenticated = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    loginFormProps.length = 0;
  });

  it("displays the layout, prompt, and login form", () => {
    render(
      <LoginView
        title="Sign In"
        onAuthenticated={onAuthenticated}
      />,
    );

    expect(screen.getByTestId("layout-template")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Enter your Blaise username and password")).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(loginFormProps[0]?.onAuthenticated).toBe(onAuthenticated);
  });

  it("returns a valid layout element when called directly", () => {
    const element = LoginView({ title: "Sign In", onAuthenticated });

    expect(isValidElement(element)).toBe(true);
    expect(element.props.title).toBe("Sign In");
  });
});
