# blaise-login-react-server

## Importing

We are making use of Releases and Tags to maintain versions of our repository.
In your React project add the parent repository as a dependency, specifying a release version after the # at the end. For example:

```shell
yarn add git+https://github.com/ONSdigital/blaise-login-react#<RELEASE_TAG>
```
---

This helped us to get rid of working with SHAs of the subdirectories and will be a lot easier and cleaner to specify versions with Releases that we intend to use.

### Server code
To import Modules from **blaise-login-react-server** subdirectory: For example:

```sh
import { newLoginHandler, Auth } from "blaise-login-react/blaise-login-react-server";
```

## Tests

```sh
yarn install
yarn test
```

## Build

```sh
yarn install
yarn build
# git add
# git commit
# git push (etc)
```

## Usage

**Note**: The server component is expected to be used with [express](https://expressjs.com/)


```ts
import express, {Request, Response} from "express"
import BlaiseApiClient from "blaise-api-node-client";
import { newLoginHandler, AuthConfig } from "blaise-login-react/blaise-login-react-server";

const server = express()

// We should probably be loading this from environment variables
const config: AuthConfig = {
    SessionSecret: "example-secret";
    SessionTimeout: "6h";
    Roles: ["DST"];
    BlaiseApiUrl: "http://localhost:8081";
}
const auth = new Auth(config)
const loginHandler = newLoginHandler(auth, blaiseApiClient)

server.use("/", loginHandler);

// You can also add the auth middleware to ensure certain API routes are protected e.g
server.get("/my-protected-endpoint", auth.Middleware, async function(request: Request, response: Response) {
  response.status(200).json("Hello, world!");
});
```

If you are using a protected endpoint then you can use the client side `AuthManager` to get an `authHeader` that you can
add to requests.

e.g

```ts
import { AuthManager } from "blaise-login-react/blaise-login-react-client";
import axios from "axios";

const authManager = new AuthManager();
axios.get("/my-protected-endpoint", {
  headers: authManager.authHeader()
})
```
