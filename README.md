# Blaise Login React 🔐

A cohesive authentication solution for Blaise React applications. This repository provides both the Express.js server handlers and the React client components necessary to implement a secure, token-based login flow.

Because backend Node.js environments and frontend React environments require different build lifecycles and dependencies, the library exposes two distinct import paths from a single installation.

## 📝 Usage

Add this repository to your project as a dependency, specifying the target release version:

```shell
yarn add git+https://github.com/ONSdigital/blaise-login-react#<RELEASE_VERSION>
```

Release versions can be found on this repos [GitHub releases](https://github.com/ONSdigital/blaise-login-react/releases).

### 🖥️ Server-Side Implementation

The server module provides an Express handler and authentication middleware to protect your downstream API routes. It relies on the `blaise-api-node-client` to validate credentials.

```typescript
import express, { Request, Response } from "express";
import BlaiseApiClient from "blaise-api-node-client";
import { Auth, newLoginHandler, type AuthConfig } from "blaise-login-react/blaise-login-react-server";

const server = express();
const blaiseApiClient = new BlaiseApiClient("http://localhost:8081");

const config: AuthConfig = {
  SessionSecret: process.env.SESSION_SECRET || "fallback-secret",
  SessionTimeout: "12h",
  TokenIssuer: process.env.PROJECT_ID || "ons-blaise-v2-local",
  Roles: ["DST", "Admin"],
};

const auth = new Auth(config);

// mount the login handler to process authentication requests
server.use("/", newLoginHandler(auth, blaiseApiClient));

// use the auth middleware to securely protect specific api routes
server.get("/my-protected-endpoint", auth.middleware, async (req: Request, res: Response) => {
  res.status(200).json("Hello, securely authenticated world!");
});
```

### 💻 Client-Side Implementation

The client module provides the `<Authenticate>` React component. By wrapping this around your root application components, it prevents the UI from rendering until the user has successfully logged in.

#### Component Wrapping

```typescript
import { ReactElement } from "react";
import {
  Authenticate,
  createSessionKey,
  normaliseCookieDomain,
} from "blaise-login-react/blaise-login-react-client";
import LayoutTemplate from "./Common/components/LayoutTemplate";
import AppRoutes from "./Common/components/AppRoutes";

const projectId = window.appConfig.projectId;
const urlDomain = window.appConfig.urlDomain;

export default function App(): ReactElement {
  return (
    <Authenticate
      title="Blaise Editing Service"
      sessionKey={createSessionKey(projectId)}
      cookieDomain={normaliseCookieDomain(urlDomain)}
    >
      {(user, loggedIn, logOutFunction) => (
        <LayoutTemplate showSignOutButton={loggedIn} signOut={() => logOutFunction()}>
          <AppRoutes user={user} />
        </LayoutTemplate>
      )}
    </Authenticate>
  );
}
```

#### Authenticate Render Props

The component utilizes the "render props" pattern to pass the following authentication state down to your application:

| Parameter | Type | Description |
| --- | --- | --- |
user | Object | Contains user information properties: `name` (string), `role` (string), `serverParks` (string array), `defaultServerPark` (string). |
loggedIn | Boolean | Evaluates to `true` if a user is currently authenticated with a valid session token. |
logOutFunction | Function | A callable utility function to assign to a "Sign Out" button or link. |

#### Downstream API Requests

Once authenticated, you can use the `AuthManager` utility to automatically append the user's JWT token to downstream API requests to hit your protected server endpoints.

```typescript
import {
  AuthManager,
  createSessionKey,
  normaliseCookieDomain,
} from "blaise-login-react/blaise-login-react-client";

const projectId = window.appConfig.projectId;
const urlDomain = window.appConfig.urlDomain;

const authManager = new AuthManager({
  sessionKey: createSessionKey(projectId),
  cookieDomain: normaliseCookieDomain(urlDomain),
});

export async function fetchProtectedData() {
  const response = await fetch("/my-protected-endpoint", {
    method: "GET",
    headers: authManager.authHeader(), 
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch protected data: HTTP ${response.status}`);
  }

  return await response.json();
}
```

If you omit `cookieDomain`, the session stays scoped to the current host and will not be shared with sibling subdomains.

### Shared Sign-On Across Services

To support single sign-on across sibling UIs in the same environment, configure the library with one shared session scope per environment.

- Every UI in the same environment must use the same `sessionKey`.
- Every UI that should share login across sibling subdomains must use the same `cookieDomain`.
- Every backend in the same environment must use the same `SessionSecret` and `TokenIssuer`.
- Each service should keep its own `Roles` list so authentication can be shared while authorization stays service-specific.

A good pattern is to use your environment identifier, such as `PROJECT_ID`, for `TokenIssuer` and to derive `sessionKey` with `createSessionKey(PROJECT_ID)`. Use your shared DNS suffix, such as `.social-surveys.gcp.onsdigital.uk`, for `cookieDomain`.

Use different `SessionSecret`, `TokenIssuer`, and `sessionKey` values for each environment so that tokens from one environment are rejected by another.

Deployed services should fail fast if `SessionSecret` is missing. Do not generate a random fallback secret outside local development, or sibling services will stop trusting each other's tokens after a restart.

```typescript
import { createSessionKey, normaliseCookieDomain } from "blaise-login-react/blaise-login-react-client";

const sharedSessionKey = createSessionKey("ons-blaise-v2-dev-ben1");
const sharedCookieDomain = normaliseCookieDomain(".social-surveys.gcp.onsdigital.uk");

// every dev-ben1 UI should use these same values
// every dev-ben1 backend should also share SessionSecret and TokenIssuer
```

## 🧪 Testing & Mocking

The client module exports a`<MockAuthenticate>` component to simulate user interactions without triggering real network requests. You can instruct it to render in a logged-in or logged-out state.

At the top of your Vitest/Jest file:

```typescript
import { vi } from "vitest";
import { Authenticate } from "blaise-login-react/blaise-login-react-client";

// intercept the real component and replace its render method with the mock
vi.mock("blaise-login-react/blaise-login-react-client");
const { MockAuthenticate } = vi.requireActual("blaise-login-react/blaise-login-react-client");
Authenticate.prototype.render = MockAuthenticate.prototype.render;

// define the simulated user state
const mockUser = {
  name: "Jake Bullet",
  role: "Manager",
  serverParks: ["gusty"],
  defaultServerPark: "gusty",
};

// apply the state before rendering your component in the test

// logged in:
MockAuthenticate.OverrideReturnValues(mockUser, true); 

// logged out:
MockAuthenticate.OverrideReturnValues(mockUser, false);
```

## 🛠️ Development

### Getting Started

Because this repository houses two distinct environments (React/DOM and Node/Express), you must build and test the sub-directories independently.

Clone the repository:

```shell
git clone https://github.com/ONSdigital/blaise-login-react.git
```

Install dependencies for client and server from root:

```shell
yarn install
```

Packages for client and server are controlled from single `yarn.lock` in the root.

### Quality Control

Ensure any changes to token logic or routing are strictly covered by unit tests in their respective directories.

Client:

```shell
cd blaise-login-react-client
yarn build
yarn test
yarn lint
```

Server:

```shell
cd blaise-login-react-server
yarn build
yarn test
yarn lint
```

Can also be run for client and server from the root:

```shell
yarn build
yarn test
yarn lint
```

### Dependency Management

If you add or update internal packages consumed via Git URLs (e.g., `blaise-design-system-react-components`), you must ensure they are whitelisted in the root `package.json` under the `dependenciesMeta` block.

```json
"dependenciesMeta": {
  "blaise-design-system-react-components": {
    "built": true
  }
}
```

Yarn v4 strictly blocks build lifecycle scripts (`prepack`, `build`) for remote Git dependencies unless they are explicitly authorised here. Omitting a repository from this list will result in empty, uncompiled dependencies being installed.

### Releasing

After merging to main, [create a new release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) with appropriate release notes. The `package.json` version is automatically updated via GitHub Actions when a release is published.
