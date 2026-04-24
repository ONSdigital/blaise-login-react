import { Footer, Header, NotProductionWarning } from "blaise-design-system-react-components";
import { useMemo } from "react";

// CHANGED: Moved styles outside the component.
// Defining objects inside the component function causes them to be
// re-created on every render, which is inefficient.
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
        className="ons-skip-link"
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
