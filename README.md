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
  Roles: ["DST", "Admin"],
  BlaiseApiUrl: "http://localhost:8081",
};

const auth = new Auth(config);

// mount the login handler to process authentication requests
server.use("/", newLoginHandler(auth, blaiseApiClient));

// use the auth middleware to securely protect specific api routes
server.get("/my-protected-endpoint", auth.Middleware, async (req: Request, res: Response) => {
  res.status(200).json("Hello, securely authenticated world!");
});
```

### 💻 Client-Side Implementation

The client module provides the `<Authenticate>` React component. By wrapping this around your root application components, it prevents the UI from rendering until the user has successfully logged in.

#### Component Wrapping

```typescript
import { ReactElement } from "react";
import { Authenticate } from "blaise-login-react/blaise-login-react-client";
import LayoutTemplate from "./Common/components/LayoutTemplate";
import AppRoutes from "./Common/components/AppRoutes";

export default function App(): ReactElement {
  return (
    <Authenticate title="Blaise Editing Service">
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
import { AuthManager } from "blaise-login-react/blaise-login-react-client";
import axios from "axios";

const authManager = new AuthManager();

export async function fetchProtectedData() {
  const response = await axios.get("/my-protected-endpoint", {
    headers: authManager.authHeader(),
  });
  return response.data;
}
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
yarn build:all
yarn test:all
yarn lint:all
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
