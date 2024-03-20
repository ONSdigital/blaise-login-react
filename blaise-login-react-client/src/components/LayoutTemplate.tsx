import { Footer, Header, NotProductionWarning } from "blaise-design-system-react-components";
import React from "react";

const divStyle = {
  minHeight: "calc(67vh)",
};

interface LayoutTemplateProps {
  title: string
  children: React.ReactNode;
}

function isProduction(hostname: string): boolean {
  return hostname.endsWith(".blaise.gcp.onsdigital.uk");
}

export default function LayoutTemplate({ title, children}: LayoutTemplateProps) {
  return (

    <>
      <div data-testid="login-page">
        <a className="ons-skip-link" href="#main-content">Skip to content</a>
            {
                isProduction(window.location.hostname) ? <></> : <NotProductionWarning />
            }        
        <Header title={title} noSave/>  
        <div style={divStyle} className="ons-page__container ons-container" data-testid="login-page-content">
          {children}
        </div>
        <Footer />
      </div>
    </>
  );
}
