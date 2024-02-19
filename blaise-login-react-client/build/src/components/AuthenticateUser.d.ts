import { ReactElement } from "react";
import AuthenticationApi from "../client/AuthenticationApi";
interface AuthenticateUserProps {
    title: string;
    authenticationApi: AuthenticationApi;
    setLoggedIn: (loggedIn: boolean) => void;
}
export default function AuthenticateUser({ title, authenticationApi, setLoggedIn }: AuthenticateUserProps): ReactElement;
export {};
