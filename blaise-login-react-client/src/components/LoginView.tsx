import { Panel } from "blaise-design-system-react-components";

import LayoutTemplate from "./LayoutTemplate";
import { LoginForm } from "./LoginForm";

interface LoginViewProps {
  title: string;
  onAuthenticated: (token: string) => Promise<void>;
}

export default function LoginView({ title, onAuthenticated }: LoginViewProps) {
  return (
    <LayoutTemplate title={title}>
      <Panel status="info">Enter your Blaise username and password</Panel>
      <LoginForm onAuthenticated={onAuthenticated} />
    </LayoutTemplate>
  );
}
