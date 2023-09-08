import {
  RenderResult, act, render,
} from "@testing-library/react";
import Authenticate from "./Authenticate";
import  AuthenticationApi from "../client/AuthenticationApi";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import userMockObject from "../mockObjects/mockUserObject";

let view:RenderResult;

// create mocks
jest.mock("../client/AuthenticationApi");
const mockLoggedIn = jest.fn();
const mockLoggedInUser = jest.fn();
AuthenticationApi.prototype.loggedIn = mockLoggedIn;
AuthenticationApi.prototype.getLoggedInUser = mockLoggedInUser;

describe("Renders the correct screen depending if the user has recently logged in", () => {
  
    it("Should display a message asking the user to enter their Blaise user credentials if they are not logged in", async () => {
      // arrange
      mockLoggedIn.mockImplementation(() => Promise.resolve(false));
  
      // act
      await act(async () => {
        view = render(
        <BrowserRouter>
        <Authenticate>
        {() => (
          <></>
        )}
        </Authenticate>
        </BrowserRouter>
        );
      });
  
      // assert
      const contentView = view.getByTestId("login-page-content");
      expect(contentView).toHaveTextContent("Enter your Blaise username and password");
    });

    it("Should display a default title if one is not supplied and they are not logged in", async () => {
      // arrange
      mockLoggedIn.mockImplementation(() => Promise.resolve(false));
  
      // act
      await act(async () => {
        view = render(
        <BrowserRouter>
        <Authenticate>
        {() => (
          <></>
        )}
        </Authenticate>
        </BrowserRouter>
        );
      });
  
      // assert
      const headerView = view.getByTestId("login-page");
      expect(headerView).toHaveTextContent("Blaise login");
    });    

    it("Should display the title if one  not supplied and they are not logged in", async () => {
      // arrange
      mockLoggedIn.mockImplementation(() => Promise.resolve(false));
  
      // act
      await act(async () => {
        view = render(
        <BrowserRouter>
        <Authenticate title="This is the title of your application">
        {() => (
          <></>
        )}
        </Authenticate>
        </BrowserRouter>
        );
      });
  
      // assert
      const headerView = view.getByTestId("login-page");
      expect(headerView).toHaveTextContent("This is the title of your application");
    });       

    it("Should render the login page correctly", async () => {
      // arrange
      mockLoggedIn.mockImplementation(() => Promise.resolve(false));
  
      // act
      await act(async () => {
        view = render(
        <BrowserRouter>
        <Authenticate>
        {() => (
           <></>
        )}
        </Authenticate>
        </BrowserRouter>
        );
      });
  
      // assert
      expect(view).toMatchSnapshot();
    });

    it("Should display the authenticated content if the user is already logged in",  async () => {
      // arrange
      const user = userMockObject;
      mockLoggedIn.mockImplementation(() => Promise.resolve(true));
      mockLoggedInUser.mockImplementation(() => Promise.resolve(user));
  
      // act
      await act(async () => {
        view = render(
        <BrowserRouter>
        <Authenticate>
        {(user) => (
           <div data-testid="authenticated">
            Authenticated content for user {user.name}</div>
        )}
        </Authenticate>
        </BrowserRouter>
        );
      });
  
      // assert
      const appView = view.getByTestId("authenticated");
      expect(appView).toHaveTextContent(`Authenticated content for user ${user.name}`);
    });    
});