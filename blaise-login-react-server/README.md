# blaise-login-react-server

## Importing

We are making use of [GitPkg](https://gitpkg.vercel.app/guide/) to make importing a git subdirectory easy.

```sh
# Server code
yarn add https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-server?main
```

**Note**: The drawback of this approach is that just running a `yarn upgrade` doesn't seem to work reliably.

The best workaround to this is to use a commit ref instead of `main` in the above. For example:

```
# Server code
yarn add https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-server?74e88ad500a734ce797df3ed3e2a85bdacb71980
```

Its worth noting that just because they are the same repo you do not need to use the same commit for each components,
obviously if we make breaking changes in one you will need a new version of both.

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
import { newLoginHandler, AuthConfig } from "blaise-login-react-server";

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
import { AuthManager } from "blaise-login-react-client";
import axios from "axios";

const authManager = new AuthManager();
axios.get("/my-protected-endpoint", {
  headers: authManager.authHeader()
})
```
