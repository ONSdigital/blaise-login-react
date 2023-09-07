import React, { ReactElement, useState } from "react";
import { User } from "blaise-api-node-client";
import AuthenticationApi from "../client/AuthenticationApi";
import LayoutTemplate from "./LayoutTemplate";
import AuthenticationContent from "./AuthenticationContent";
import Login from "./Login";

interface AuthenticationProps {
  children: (user: User) => React.ReactNode;
}

export default function Authentication({ children }:AuthenticationProps): ReactElement {
  const [loggedIn, setLoggedIn] = useState(false);
  const authenticationApi = new AuthenticationApi();

  return (
    <LayoutTemplate showSignOutButton={loggedIn} signOut={() => authenticationApi.logOut(setLoggedIn)}>
      {
          loggedIn
            ? <AuthenticationContent authenticationApi={authenticationApi}>{children}</AuthenticationContent>
            : <Login />
      }
    </LayoutTemplate>
  );
}