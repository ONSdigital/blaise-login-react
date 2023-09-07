import { User } from "blaise-api-node-client";
import React, { Component, ReactElement, useState } from "react";

interface AuthenticationProps {
  children: (user: User) => React.ReactNode;
}

export default class Authentication extends Component<AuthenticationProps> {
  constructor(props: AuthenticationProps) {
    super(props);
    console.debug("Authentication");
  }

  render(): ReactElement {
  console.debug("render");

  return (
    <div>
    yo
    </div>
/*     <LayoutTemplate showSignOutButton={loggedIn} signOut={() => authenticationApi.logOut(setLoggedIn)}>
      {
          !loggedIn
            ? <AuthenticationContent authenticationApi={authenticationApi}>{this.props.children}</AuthenticationContent>
            : <Login authenticationApi={authenticationApi} setLoggedIn={setLoggedIn} />
      }
    </LayoutTemplate> */
  );
    }
}
