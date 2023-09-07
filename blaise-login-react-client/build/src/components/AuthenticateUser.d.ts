import { ReactElement } from "react";
import AuthenticationApi from "../client/AuthenticationApi";
interface AuthenticateUserProps {
    authenticationApi: AuthenticationApi;
    setLoggedIn: (loggedIn: boolean) => void;
}
export default function AuthenticateUser({ authenticationApi, setLoggedIn }: AuthenticateUserProps): ReactElement;
export {};
