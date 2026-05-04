import { Footer, Header, NotProductionWarning } from "blaise-design-system-react-components";
import { useMemo } from "react";

const CONTENT_MIN_HEIGHT = {
  minHeight: "67vh",
};

interface LayoutTemplateProps {
  title: string;
  children: React.ReactNode;
}

function isDevelopmentEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  return !window.location.hostname.endsWith(".blaise.gcp.onsdigital.uk");
}

export default function LayoutTemplate({ title, children }: LayoutTemplateProps) {
  const showWarning = useMemo(() => isDevelopmentEnvironment(), []);

  return (
    <div data-testid="login-page">
      <a
        className="ons-skip-to-content ons-u-fs-r--b"
        href="#main-content"
      >
        Skip to content
      </a>

      {showWarning && <NotProductionWarning />}

      <Header
        title={title}
        noSave
      />

      <div
        style={CONTENT_MIN_HEIGHT}
        className="ons-page__container ons-container"
        data-testid="login-page-content"
      >
        {children}
      </div>

      <Footer />
    </div>
  );
}
