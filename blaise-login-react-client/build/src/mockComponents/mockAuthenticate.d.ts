import { ReactElement } from "react";
import Authenticate from "../components/Authenticate";
import { User } from "blaise-api-node-client";
export default class MockAuthenticate extends Authenticate {
    static user: User;
    static loggedIn: boolean;
    static logOutFunction: () => void;
    static OverrideReturnValues(user?: User, loggedIn?: boolean, logOutFunction?: () => void): void;
    render(): ReactElement;
}
