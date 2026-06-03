import { ErrorPanel, type FormField, StyledForm } from "blaise-design-system-react-components";
import { type ReactElement, useState } from "react";

import { authenticateUser } from "../services/user";

interface LoginFormProps {
  onAuthenticated: (token: string) => Promise<void>;
}

const LOGIN_FIELDS = [
  {
    name: "Username",
    id: "username",
    description: "Your Blaise username",
    type: "text",
    initialValue: "",
  },
  {
    name: "Password",
    description: "Your Blaise password",
    type: "password",
    initialValue: "",
  },
] satisfies FormField[];

export function LoginForm({ onAuthenticated }: LoginFormProps): ReactElement {
  const [errorMessage, setErrorMessage] = useState("");

  async function login(
    form: Record<string, string>,
    setSubmitting: (isSubmitting: boolean) => void,
  ): Promise<void> {
    setErrorMessage("");

    const loginResult = await authenticateUser(form.Username, form.Password);

    if (!loginResult.authenticated) {
      switch (loginResult.reason) {
        case "not-authorized":
          setErrorMessage("You do not have the correct permissions");
          break;
        case "rate-limited":
          setErrorMessage("Too many login attempts, please try again later");
          break;
        case "request-failed":
          setErrorMessage("Unable to sign in. Please try again.");
          break;
        default:
          setErrorMessage("Incorrect username or password");
      }

      setSubmitting(false);

      return;
    }

    await onAuthenticated(loginResult.token);
  }

  return (
    <>
      <h1 className="ons-u-mt-m">Sign in</h1>

      {errorMessage && <ErrorPanel text={errorMessage} />}

      <StyledForm
        fields={LOGIN_FIELDS}
        onSubmitFunction={login}
        submitLabel="Sign in"
      />
    </>
  );
}
