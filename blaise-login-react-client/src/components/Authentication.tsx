import { User } from "blaise-api-node-client";
import React, { Component, ReactElement } from "react";
import LayoutTemplate from "./LayoutTemplate";
import AuthenticationContent from "./AuthenticationContent";
import AuthenticationApi from "../client/AuthenticationApi";

interface AuthenticationProps {
  children: (user: User) => React.ReactNode;
}

export default class Authentication extends Component<AuthenticationProps> {
  constructor(props: AuthenticationProps) {
    super(props);

    console.debug("Authentication");
  }


  render(): ReactElement {
  const authenticationApi = new AuthenticationApi();
  console.debug("render");

  return (
    <LayoutTemplate showSignOutButton={false} signOut={() => {console.debug("logout");}}>
      <AuthenticationContent authenticationApi={authenticationApi}>{this.props.children}</AuthenticationContent>
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
