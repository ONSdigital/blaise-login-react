import { Footer, Header } from "blaise-design-system-react-components";
import React from "react";

const divStyle = {
  minHeight: "calc(67vh)",
};

interface LayoutTemplateProps {
  title: string
  children: React.ReactNode;
}

export default function LayoutTemplate({ title, children}: LayoutTemplateProps) {
  return (

    <>
      <Header title={title} noSave />
      <div style={divStyle} className="ons-page__container ons-container" data-testid="login-page">
        {children}
      </div>
      <Footer />
    </>
  );
}
