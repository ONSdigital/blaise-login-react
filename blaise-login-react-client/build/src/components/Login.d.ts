import { ReactElement } from "react";
import AuthenticationApi from "../client/AuthenticationApi";
interface LoginProps {
    authenticationApi: AuthenticationApi;
    setLoggedIn: (loggedIn: boolean) => void;
}
export default function Login({ authenticationApi, setLoggedIn }: LoginProps): ReactElement;
export {};
