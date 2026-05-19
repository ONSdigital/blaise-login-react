import { Panel } from "blaise-design-system-react-components";

import LayoutTemplate from "./LayoutTemplate";
import { LoginForm } from "./LoginForm";

interface AuthUserProps {
  title: string;
  onAuthenticated: (token: string) => Promise<void>;
}

export default function AuthUser({ title, onAuthenticated }: AuthUserProps) {
  return (
    <LayoutTemplate title={title}>
      <Panel status="info">Enter your Blaise username and password</Panel>
      <LoginForm onAuthenticated={onAuthenticated} />
    </LayoutTemplate>
  );
}
