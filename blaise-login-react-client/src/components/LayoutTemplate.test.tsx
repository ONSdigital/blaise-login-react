import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import LayoutTemplate from "./LayoutTemplate";

vi.mock("blaise-design-system-react-components", () => ({
  Footer: () => <footer data-testid="ons-footer" />,
  Header: ({ title }: { title: string }) => <header data-testid="ons-header">{title}</header>,
  NotProductionWarning: () => <div data-testid="ons-not-production-warning">Warning</div>,
}));

describe("LayoutTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the development warning when not on the production domain", () => {
    vi.stubGlobal("window", { location: { hostname: "localhost" } });

    render(
      <LayoutTemplate title="Test Title">
        <div data-testid="child-content">Child</div>
      </LayoutTemplate>,
    );

    expect(screen.getByTestId("ons-not-production-warning")).toBeInTheDocument();
    expect(screen.getByTestId("ons-header")).toHaveTextContent("Test Title");
    expect(screen.getByTestId("ons-footer")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("does not render the development warning on the production domain", () => {
    vi.stubGlobal("window", {
      location: { hostname: "survey.blaise.gcp.onsdigital.uk" },
    });

    render(
      <LayoutTemplate title="Prod Title">
        <div>Child</div>
      </LayoutTemplate>,
    );

    expect(screen.queryByTestId("ons-not-production-warning")).not.toBeInTheDocument();
  });

  it("does not render the warning during Server-Side Rendering (window is undefined)", () => {
    vi.stubGlobal("window", undefined);

    const html = renderToString(
      <LayoutTemplate title="SSR Title">
        <div>Child</div>
      </LayoutTemplate>,
    );

    expect(html).not.toContain('data-testid="ons-not-production-warning"');
    expect(html).toContain("SSR Title");
  });
});
