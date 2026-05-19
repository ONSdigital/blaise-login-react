import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockUser } from "../mocks/user.mock";

import { Authenticate } from "./Authenticate";

const { mockLoggedIn, mockGetLoggedInUser } = vi.hoisted(() => {
  return {
    mockLoggedIn: vi.fn(),
    mockGetLoggedInUser: vi.fn(),
  };
});

const authClientConstructorCalls: Array<{ sessionKey: string; cookieDomain?: string }> = [];
const baseAuthenticateProps = { sessionKey: "blaise-user-ons-blaise-v2-dev-ben1" };

vi.mock("../services/authClient", () => {
  return {
    AuthClient: class {
      constructor(options: { sessionKey: string; cookieDomain?: string }) {
        authClientConstructorCalls.push(options);
      }

      loggedIn = mockLoggedIn;
      getLoggedInUser = mockGetLoggedInUser;
    },
  };
});

describe("Authenticate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientConstructorCalls.length = 0;
  });

  it("displays login prompt when user is not logged in", async () => {
    mockLoggedIn.mockResolvedValue(false);

    render(
      <BrowserRouter>
        <Authenticate {...baseAuthenticateProps}>{() => <></>}</Authenticate>
      </BrowserRouter>,
    );

    const contentView = await screen.findByTestId("login-page-content");

    expect(contentView).toHaveTextContent("Enter your Blaise username and password");
  });

  it("displays default title if none is supplied and user is not logged in", async () => {
    mockLoggedIn.mockResolvedValue(false);

    render(
      <BrowserRouter>
        <Authenticate {...baseAuthenticateProps}>{() => <></>}</Authenticate>
      </BrowserRouter>,
    );

    const headerView = await screen.findByTestId("login-page");

    expect(headerView).toHaveTextContent("Blaise login");
  });

  it("displays supplied title if provided and user is not logged in", async () => {
    mockLoggedIn.mockResolvedValue(false);

    render(
      <BrowserRouter>
        <Authenticate
          {...baseAuthenticateProps}
          title="This is the title of your application"
        >
          {() => <></>}
        </Authenticate>
      </BrowserRouter>,
    );

    const headerView = await screen.findByTestId("login-page");

    expect(headerView).toHaveTextContent("This is the title of your application");
  });

  it("matches snapshot for login page when not logged in", async () => {
    mockLoggedIn.mockResolvedValue(false);

    const { container } = render(
      <BrowserRouter>
        <Authenticate {...baseAuthenticateProps}>{() => <></>}</Authenticate>
      </BrowserRouter>,
    );

    await screen.findByTestId("login-page");

    expect(container).toMatchSnapshot();
  });

  it("displays authenticated content when user is logged in", async () => {
    mockLoggedIn.mockResolvedValue(true);
    mockGetLoggedInUser.mockResolvedValue(mockUser);

    render(
      <BrowserRouter>
        <Authenticate {...baseAuthenticateProps}>
          {(user) => (
            <div data-testid="authenticated">Authenticated content for user {user.name}</div>
          )}
        </Authenticate>
      </BrowserRouter>,
    );

    const appView = await screen.findByTestId("authenticated");

    expect(appView).toHaveTextContent(`Authenticated content for user ${mockUser.name}`);
  });

  it("passes the supplied shared session settings to the auth client", async () => {
    mockLoggedIn.mockResolvedValue(false);

    render(
      <BrowserRouter>
        <Authenticate
          sessionKey="blaise-user-ons-blaise-v2-dev-ben1"
          cookieDomain=".social-surveys.gcp.onsdigital.uk"
        >
          {() => <></>}
        </Authenticate>
      </BrowserRouter>,
    );

    await screen.findByTestId("login-page");

    expect(authClientConstructorCalls).toContainEqual({
      sessionKey: "blaise-user-ons-blaise-v2-dev-ben1",
      cookieDomain: ".social-surveys.gcp.onsdigital.uk",
    });
  });
});
