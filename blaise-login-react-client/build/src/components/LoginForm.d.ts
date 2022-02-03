import { ReactElement } from "react";
import { FormFieldObject } from "blaise-design-system-react-components";
import { Component } from "react";
import { AuthManager } from "../client/token";
declare type LoginFormProps = {
    authManager: AuthManager;
    setLoggedIn: (loggedIn: boolean) => void;
};
declare type LoginFormState = {
    error: string;
};
export default class LoginForm extends Component<LoginFormProps, LoginFormState> {
    constructor(props: LoginFormProps);
    formFields(): FormFieldObject[];
    login(form: Record<string, string>, setSubmitting: (isSubmitting: boolean) => void): Promise<void>;
    error(): ReactElement | undefined;
    render(): ReactElement;
}
export {};
