# blaise-login-react-server

## Importing

We are making use of [GitPkg](https://gitpkg.vercel.app/guide/) to make importing a git subdirectory easy.

```sh
# Server code
yarn add 'https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-server?main'
```

**Note**: The drawback of this approach is that just running a `yarn upgrade` doesn't seem to work reliably.

The best workaround to this is to use a commit ref instead of `main` in the above. For example:

```sh
# Server code
yarn add 'https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-server?74e88ad500a734ce797df3ed3e2a85bdacb71980'
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

Add auth to your react app...

**Note**: If you haven't already setup the server side of this, good luck... [blaise-login-react-server](../blaise-login-react-server)

```tsx
import React, { ReactElement, useEffect, useState } from "react";
import { LoginForm, AuthManager } from "blaise-login-react-client";
import { BetaBanner, DefaultErrorBoundary, Footer, Header, ONSLoadingPanel } from "blaise-design-system-react-components";
import "./style.css";

function App(): ReactElement {
  const authManager = new AuthManager();
  const location = useLocation(); // This is important to make sure that changes pages is treated as a react event

  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    console.log(location);
    authManager.loggedIn().then(async (isLoggedIn: boolean) => {
      setLoggedIn(isLoggedIn);
      setLoaded(true);
    });
  });

  function loginPage(): ReactElement {
    if (loaded && loggedIn) {
      return <></>;
    }
    return <LoginForm authManager={authManager} setLoggedIn={setLoggedIn} />;
  }

  function signOut(): void {
    authManager.clearToken();
    setLoggedIn(false);
  }

  function loading(): ReactElement {
    if (loaded) {
      return <></>;
    }
    return <ONSLoadingPanel />;
  }

  function appContent(): ReactElement {
    if (loaded && loggedIn) {
      return <h2 className="ons-u-mt-m">This is my app</h2>;
    }
    return <></>;
  }

  return (
    <>
      <a className="ons-skip-link" href="#main-content">Skip to main content</a>
      <BetaBanner />
      <Header title={"Management Information Reports"} signOutButton={loggedIn} noSave={true} signOutFunction={signOut} />
      <div style={divStyle} className="ons-page__container ons-container">
        {loading()}
        {loginPage()}
        {appContent()}
      </div>
      <Footer />
    </>
  );
}

export default App;
```

If you need to access API endpoints that are secured by `blaise-login-react-server` then you can use:

```ts
import { AuthManager } from "blaise-login-react-client";
import axios from "axios";

const authManager = new AuthManager();
axios.get("/my-protected-endpoint", {
  headers: authManager.authHeader()
})
```
