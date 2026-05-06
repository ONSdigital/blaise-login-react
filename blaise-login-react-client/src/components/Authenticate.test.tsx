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

vi.mock("../services/authClient", () => {
  return {
    AuthClient: class {
      loggedIn = mockLoggedIn;
      getLoggedInUser = mockGetLoggedInUser;
    },
  };
});

describe("Authenticate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays login prompt when user is not logged in", async () => {
    mockLoggedIn.mockResolvedValue(false);

    render(
      <BrowserRouter>
        <Authenticate>{() => <></>}</Authenticate>
      </BrowserRouter>,
    );

    const contentView = await screen.findByTestId("login-page-content");

    expect(contentView).toHaveTextContent("Enter your Blaise username and password");
  });

  it("displays default title if none is supplied and user is not logged in", async () => {
    mockLoggedIn.mockResolvedValue(false);

    render(
      <BrowserRouter>
        <Authenticate>{() => <></>}</Authenticate>
      </BrowserRouter>,
    );

    const headerView = await screen.findByTestId("login-page");

    expect(headerView).toHaveTextContent("Blaise login");
  });

  it("displays supplied title if provided and user is not logged in", async () => {
    mockLoggedIn.mockResolvedValue(false);

    render(
      <BrowserRouter>
        <Authenticate title="This is the title of your application">{() => <></>}</Authenticate>
      </BrowserRouter>,
    );

    const headerView = await screen.findByTestId("login-page");

    expect(headerView).toHaveTextContent("This is the title of your application");
  });

  it("matches snapshot for login page when not logged in", async () => {
    mockLoggedIn.mockResolvedValue(false);

    const { container } = render(
      <BrowserRouter>
        <Authenticate>{() => <></>}</Authenticate>
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
        <Authenticate>
          {(user) => (
            <div data-testid="authenticated">Authenticated content for user {user.name}</div>
          )}
        </Authenticate>
      </BrowserRouter>,
    );

    const appView = await screen.findByTestId("authenticated");

    expect(appView).toHaveTextContent(`Authenticated content for user ${mockUser.name}`);
  });
});
