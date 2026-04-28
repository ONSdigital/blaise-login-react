import { useState, useCallback, ReactElement } from "react";
import { type FormField, ErrorPanel, StyledForm } from "blaise-design-system-react-components";
import { validatePassword, validateUserPermissions } from "../services/user";
import type { AuthManager } from "../services/AuthManager";

interface LoginFormProps {
  authManager: AuthManager;
  setLoggedIn: (loggedIn: boolean) => void;
}

export default function LoginForm({ authManager, setLoggedIn }: LoginFormProps): ReactElement {
  const [error, setError] = useState<string>("");

  const fields: FormField[] = [
    {
      name: "Username",
      id: "username",
      description: "Your Blaise username",
      type: "text",
      initial_value: "",
    },
    {
      name: "Password",
      description: "Your Blaise password",
      type: "password",
      initial_value: "",
    },
  ];

  const login = useCallback(
    async (
      form: Record<string, string>,
      setSubmitting: (isSubmitting: boolean) => void,
    ): Promise<void> => {
      setError("");

      const valid = await validatePassword(form.Username, form.Password);

      if (!valid) {
        setError("Incorrect username or password");
        setSubmitting(false);

        return;
      }

      const [authorized, token] = await validateUserPermissions(form.Username);

      if (!authorized) {
        setError("You do not have the correct permissions");
        setSubmitting(false);

        return;
      }

      authManager.setToken(token);
      setLoggedIn(authorized);
    },
    [authManager, setLoggedIn],
  );

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
