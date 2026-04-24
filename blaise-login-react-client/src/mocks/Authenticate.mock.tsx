import { ReactElement, ReactNode } from "react";
import type { User } from "blaise-api-node-client";
import mockUser from "./user.mock";

let currentMockUser: User = mockUser;
let isMockLoggedIn: boolean = true;
let mockLogOutFunction: () => void = () => {
  console.debug("Logged out");
};

interface MockAuthenticateProps {
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => ReactNode;
}

const MockAuthenticate = ({ children }: MockAuthenticateProps): ReactElement => {
  return (
    <div>
      {isMockLoggedIn ? (
        <div data-testid="content-page">
          {children(currentMockUser, isMockLoggedIn, mockLogOutFunction)}
        </div>
      ) : (
        <div data-testid="login-page">Enter your Blaise username and password</div>
      )}
    </div>
  );
};

MockAuthenticate.OverrideReturnValues = (
  user?: User,
  loggedIn?: boolean,
  logOutFunction?: () => void,
): void => {
  currentMockUser = user ?? currentMockUser;
  isMockLoggedIn = loggedIn ?? isMockLoggedIn;
  mockLogOutFunction = logOutFunction ?? mockLogOutFunction;
};

MockAuthenticate.Reset = (): void => {
  currentMockUser = mockUser;
  isMockLoggedIn = true;
  mockLogOutFunction = () => {
    console.debug("Logged out");
  };
};

export default MockAuthenticate;
