import { ErrorPanel, type FormField, StyledForm } from "blaise-design-system-react-components";
import { type ReactElement, useState } from "react";

import { authenticateUser } from "../services/user";

interface LoginFormProps {
  onAuthenticated: (token: string) => Promise<void>;
}

export function LoginForm({ onAuthenticated }: LoginFormProps): ReactElement {
  const [error, setError] = useState<string>("");

  const fields: FormField[] = [
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
  ];

  async function login(
    form: Record<string, string>,
    setSubmitting: (isSubmitting: boolean) => void,
  ): Promise<void> {
    setError("");

    const loginResult = await authenticateUser(form.Username, form.Password);

    if (!loginResult.authenticated) {
      if (loginResult.reason === "not-authorized") {
        setError("You do not have the correct permissions");
      } else if (loginResult.reason === "request-failed") {
        setError("Unable to sign in. Please try again.");
      } else {
        setError("Incorrect username or password");
      }

      setSubmitting(false);

      return;
    }

    await onAuthenticated(loginResult.token);
  }

  return (
    <>
      <h1 className="ons-u-mt-m">Sign in</h1>

      {error && <ErrorPanel text={error} />}

      <StyledForm
        fields={fields}
        onSubmitFunction={login}
        submitLabel="Sign in"
      />
    </>
  );
}
