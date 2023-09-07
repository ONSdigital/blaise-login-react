import { User } from "blaise-api-node-client";
import React, { Component, ReactElement, useState } from "react";
import LayoutTemplate from "./LayoutTemplate";

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
    <LayoutTemplate showSignOutButton={false} signOut={() => {}}>
     <p> yo bruv</p>
    </LayoutTemplate>
/*     
      {
          !loggedIn
            ? <AuthenticationContent authenticationApi={authenticationApi}>{this.props.children}</AuthenticationContent>
            : <Login authenticationApi={authenticationApi} setLoggedIn={setLoggedIn} />
      }
    */
  );
    }
}
