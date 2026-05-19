import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockUser } from "../mocks/user.mock";

import { Authenticate } from "./Authenticate";

const authUserHandlerCalls: Array<{
  children: (
    user: typeof mockUser,
    loggedIn: boolean,
    logOutFunction: () => void,
  ) => React.ReactNode;
  cookieDomain?: string;
  sessionKey: string;
  title: string;
}> = [];

vi.mock("./AuthUserHandler", () => ({
  default: (props: {
    children: (
      user: typeof mockUser,
      loggedIn: boolean,
      logOutFunction: () => void,
    ) => React.ReactNode;
    cookieDomain?: string;
    sessionKey: string;
    title: string;
  }) => {
    authUserHandlerCalls.push(props);

    return <div data-testid="auth-user-handler">{props.children(mockUser, true, vi.fn())}</div>;
  },
}));

describe("Authenticate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUserHandlerCalls.length = 0;
  });

  it("uses the default title when none is supplied", () => {
    render(
      <Authenticate sessionKey="blaise-user-ons-blaise-v2-dev-ben1">{() => <></>}</Authenticate>,
    );

    expect(authUserHandlerCalls[0]?.title).toBe("Blaise login");
  });

  it("passes the supplied props through to AuthUserHandler", () => {
    render(
      <Authenticate
        sessionKey="blaise-user-ons-blaise-v2-dev-ben1"
        cookieDomain=".social-surveys.gcp.onsdigital.uk"
        title="This is the title of your application"
      >
        {() => <></>}
      </Authenticate>,
    );

    expect(authUserHandlerCalls[0]).toMatchObject({
      sessionKey: "blaise-user-ons-blaise-v2-dev-ben1",
      cookieDomain: ".social-surveys.gcp.onsdigital.uk",
      title: "This is the title of your application",
    });
  });

  it("renders children through AuthUserHandler", async () => {
    render(
      <Authenticate sessionKey="blaise-user-ons-blaise-v2-dev-ben1">
        {(user) => (
          <div data-testid="authenticated">Authenticated content for user {user.name}</div>
        )}
      </Authenticate>,
    );

    const appView = await screen.findByTestId("authenticated");

    expect(appView).toHaveTextContent(`Authenticated content for user ${mockUser.name}`);
  });
});
