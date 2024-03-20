# blaise-login-react-client

## Importing

We are making use of [GitPkg](https://gitpkg.vercel.app/guide/) to make importing a git subdirectory easy.

```sh
# Server code
yarn add 'https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-client?main'
```

**Note**: The drawback of this approach is that just running a `yarn upgrade` doesn't seem to work reliably.

The best workaround to this is to use a commit ref instead of `main` in the above. For example:

```sh
# Server code
yarn add 'https://gitpkg.now.sh/ONSdigital/blaise-login-react/blaise-login-react-client?74e88ad500a734ce797df3ed3e2a85bdacb71980'
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

With the introduction of the `<Authenticate>` component in [v1.1.0](https://github.com/ONSdigital/blaise-login-react/releases/tag/v1.1.0), you can now easily implement the user authentication in your React app by doing the following:

1) Add the following code to your node server file (server.ts) to route the login request from the React component to the restful API for authentication:

```ts
import { Auth, newLoginHandler } from 'blaise-login-react-server';

// login routing
const auth = new Auth(config);
const loginHandler = newLoginHandler(auth, blaiseApi.blaiseApiClient);
server.use('/', loginHandler);

```

2) On the React front end, you need to encapsulate your application page at the root level with the following:

```ts
import { Authenticate } from 'blaise-login-react-client';

function App(): ReactElement {
  return (
    <Authenticate title="Name of the service">
      {(user, loggedIn, logOutFunction) => (
      
        {/* YOUR ROOT LEVEL COMPONENT */}
      
      )}
    </Authenticate>
  );
}
```

By encapsulating your root component with the `<Authenticate>` component it ensures that the content won't get rendered until the user has logged in.
The authenticate component can also pass back objects that can be used in your component(s).

## Authenticate Parameters

| Parameter       | Type     | Description |
| --------------- | -------- | ----------- |
| User            | Object   | Contains user information. The `User` object has the following properties: `name` (string), `role` (string), `serverParks` (string array), `defaultServerPark` (string) |
| loggedIn        | Boolean  | Set to true if a user is currently logged in |
| logOutFunction  | Function | A function that you can assign to a button or link to sign out the logged in user |

Example implementation using `<Authenticate>`:
```ts 
import './App.css';
import { ReactElement } from 'react';
import { Authenticate } from 'blaise-login-react-client';
import AppRoutes from './Common/components/AppRoutes';
import LayoutTemplate from './Common/components/LayoutTemplate';

function App(): ReactElement {
  return (
    <Authenticate title="Blaise editing service">
      {(user, loggedIn, logOutFunction) => (
        <LayoutTemplate showSignOutButton={loggedIn} signOut={() => logOutFunction()}>
          <AppRoutes user={user} />
        </LayoutTemplate>
      )}
    </Authenticate>
  );
}
```

## Testing

The `<MockAuthenticate>` component allows you to simulate user interactions with the login component for testing purposes. It can mimic both logged-in and logged-out states.

To utilize this mock component in your tests, insert the following lines at the beginning of your test file:

```ts 
  // create mocks
  jest.mock('blaise-login-react-client');
  const { MockAuthenticate } = jest.requireActual('blaise-login-react-client');
  Authenticate.prototype.render = MockAuthenticate.prototype.render;
```

You can then override the values that you wish the component to return:
```ts 
    // arrange
    const userMockObject:User = {
      name: 'Jake Bullet',
      role: 'Manager',
      serverParks: ['gusty'],
      defaultServerPark: 'gusty',
    };

    const user = userMockObject;
```
**Note**: Depending on the React app, you may not need the user object.
```ts
    // Logged out user
    MockAuthenticate.OverrideReturnValues(user, false); 
```
```ts
    // Logged in user
    MockAuthenticate.OverrideReturnValues(user, true); 
```

Then when you render your app the mocks will be used instead of the real Authenticate component:
```ts 
    // act
    await act(async () => {
      view = render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
      );
    });
```