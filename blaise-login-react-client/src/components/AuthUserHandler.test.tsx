import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockUser } from "../mocks/user.mock";

import AuthUserHandler from "./AuthUserHandler";

const { mockClearToken, mockGetLoggedInUser, mockLogOut, mockSetToken } = vi.hoisted(() => ({
  mockClearToken: vi.fn(),
  mockGetLoggedInUser: vi.fn(),
  mockLogOut: vi.fn(),
  mockSetToken: vi.fn(),
}));

vi.mock("../services/authClient", () => ({
  AuthClient: class {
    getLoggedInUser = mockGetLoggedInUser;
    setToken = mockSetToken;
    clearToken = mockClearToken;
    logOut = mockLogOut;
  },
}));

vi.mock("blaise-design-system-react-components", () => ({
  LoadingPanel: () => <div data-testid="loading-panel">Loading</div>,
  Panel: ({ children, status }: { children: React.ReactNode; status: string }) => (
    <div data-testid={`panel-${status}`}>{children}</div>
  ),
}));

vi.mock("./LoginView", () => ({
  default: ({
    title,
    onAuthenticated,
  }: {
    title: string;
    onAuthenticated: (token: string) => Promise<void>;
  }) => (
    <div data-testid="authenticate-user">
      <div>{title}</div>
      <button onClick={() => void onAuthenticated("fresh-token")}>Simulate Login</button>
    </div>
  ),
}));

vi.mock("./LayoutTemplate", () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="layout-template">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

describe("AuthUserHandler", () => {
  const authProps = { sessionKey: "blaise-user-ons-blaise-v2-dev-ben1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays a loading state while the current user request is pending", () => {
    mockGetLoggedInUser.mockImplementation(() => new Promise(() => undefined));

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {() => <div>Secure Content</div>}
      </AuthUserHandler>,
    );

    expect(screen.getByTestId("layout-template")).toBeInTheDocument();
    expect(screen.getByTestId("loading-panel")).toBeInTheDocument();
  });

  it("displays AuthUser when there is no logged in user", async () => {
    mockGetLoggedInUser.mockResolvedValue(null);

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {() => <div>Secure Content</div>}
      </AuthUserHandler>,
    );

    expect(await screen.findByTestId("authenticate-user")).toBeInTheDocument();
    expect(screen.queryByTestId("secure-content")).not.toBeInTheDocument();
  });

  it("displays an error panel when current user loading fails", async () => {
    mockGetLoggedInUser.mockRejectedValue(new Error("Unable to load user"));

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {() => <div>Secure Content</div>}
      </AuthUserHandler>,
    );

    expect(await screen.findByTestId("panel-error")).toHaveTextContent("Unable to load user");
  });

  it("uses the fallback error message for non-Error loading failures", async () => {
    mockGetLoggedInUser.mockRejectedValue("not-an-error");

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {() => <div>Secure Content</div>}
      </AuthUserHandler>,
    );

    expect(await screen.findByTestId("panel-error")).toHaveTextContent(
      "Unable to check sign in status",
    );
  });

  it("displays authenticated content when a logged in user is present", async () => {
    mockGetLoggedInUser.mockResolvedValue(mockUser);

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {(user, loggedIn, logOutFunction) => (
          <button
            data-testid="secure-content"
            onClick={logOutFunction}
          >
            Secure Content for {user.name} {String(loggedIn)}
          </button>
        )}
      </AuthUserHandler>,
    );

    expect(await screen.findByTestId("secure-content")).toHaveTextContent(
      `Secure Content for ${mockUser.name} true`,
    );
  });

  it("stores the token and renders authenticated content after login", async () => {
    mockGetLoggedInUser.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

    const user = userEvent.setup();

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {(user) => <div data-testid="secure-content">Secure Content for {user.name}</div>}
      </AuthUserHandler>,
    );

    await user.click(await screen.findByText("Simulate Login"));

    expect(mockSetToken).toHaveBeenCalledWith("fresh-token");
    expect(await screen.findByTestId("secure-content")).toHaveTextContent(
      `Secure Content for ${mockUser.name}`,
    );
  });

  it("clears the token when login succeeds but no current user is returned", async () => {
    mockGetLoggedInUser.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const user = userEvent.setup();

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {(user) => <div data-testid="secure-content">Secure Content for {user.name}</div>}
      </AuthUserHandler>,
    );

    await user.click(await screen.findByText("Simulate Login"));

    await waitFor(() => {
      expect(mockClearToken).toHaveBeenCalled();
    });

    expect(screen.getByTestId("authenticate-user")).toBeInTheDocument();
    expect(screen.queryByTestId("secure-content")).not.toBeInTheDocument();
  });

  it("displays an error when the post-login user refresh fails", async () => {
    mockGetLoggedInUser
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("Refresh failed"));

    const user = userEvent.setup();

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {(user) => <div data-testid="secure-content">Secure Content for {user.name}</div>}
      </AuthUserHandler>,
    );

    await user.click(await screen.findByText("Simulate Login"));

    await waitFor(() => {
      expect(mockClearToken).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("panel-error")).toHaveTextContent("Refresh failed");
  });

  it("logs the user out and returns to the login view", async () => {
    mockGetLoggedInUser.mockResolvedValue(mockUser);

    const user = userEvent.setup();

    render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {(currentUser, _loggedIn, logOutFunction) => (
          <button
            data-testid="secure-content"
            onClick={logOutFunction}
          >
            Secure Content for {currentUser.name}
          </button>
        )}
      </AuthUserHandler>,
    );

    await user.click(await screen.findByTestId("secure-content"));

    expect(mockLogOut).toHaveBeenCalled();
    expect(await screen.findByTestId("authenticate-user")).toBeInTheDocument();
  });

  it("ignores a resolved current user request after unmount", async () => {
    let resolveCurrentUser!: (user: typeof mockUser | null) => void;

    mockGetLoggedInUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCurrentUser = resolve;
        }),
    );

    const { unmount } = render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {(user) => <div data-testid="secure-content">Secure Content for {user.name}</div>}
      </AuthUserHandler>,
    );

    unmount();
    resolveCurrentUser(mockUser);

    await waitFor(() => {
      expect(mockGetLoggedInUser).toHaveBeenCalledTimes(1);
    });
  });

  it("ignores a rejected current user request after unmount", async () => {
    let rejectCurrentUser!: (reason?: unknown) => void;

    mockGetLoggedInUser.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectCurrentUser = reject;
        }),
    );

    const { unmount } = render(
      <AuthUserHandler
        {...authProps}
        title="Handler Title"
      >
        {(user) => <div data-testid="secure-content">Secure Content for {user.name}</div>}
      </AuthUserHandler>,
    );

    unmount();
    rejectCurrentUser(new Error("ignored"));

    await waitFor(() => {
      expect(mockGetLoggedInUser).toHaveBeenCalledTimes(1);
    });
  });
});
