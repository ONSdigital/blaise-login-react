import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AsyncContent from "./AsyncContent";
import type { AsyncState } from "../hooks/useAsyncRequest";

vi.mock("blaise-design-system-react-components", () => ({
  ONSLoadingPanel: () => <div data-testid="ons-loading-panel">Loading...</div>,
  ONSPanel: ({ status, children }: { status: string; children: React.ReactNode }) => (
    <div data-testid={`ons-panel-${status}`}>{children}</div>
  ),
}));

describe("AsyncContent", () => {
  it("renders the loading panel when the state is loading", () => {
    const loadingState: AsyncState<string> = { state: "loading" };

    render(
      <AsyncContent content={loadingState}>{(data: string) => <div>{data}</div>}</AsyncContent>,
    );

    expect(screen.getByTestId("ons-loading-panel")).toBeInTheDocument();
  });

  it("renders the error panel with a string error", () => {
    const errorState: AsyncState<string> = { state: "errored", error: "A string error" };

    render(<AsyncContent content={errorState}>{(data: string) => <div>{data}</div>}</AsyncContent>);

    expect(screen.getByTestId("ons-panel-error")).toBeInTheDocument();
    expect(screen.getByText("A string error")).toBeInTheDocument();
  });

  it("renders the children function with the resolved data when the state has succeeded", () => {
    const successState: AsyncState<string> = { state: "succeeded", data: "Target Data" };

    render(
      <AsyncContent content={successState}>
        {(data: string) => <div data-testid="resolved-content">{data}</div>}
      </AsyncContent>,
    );

    expect(screen.getByTestId("resolved-content")).toBeInTheDocument();
    expect(screen.getByText("Target Data")).toBeInTheDocument();
  });
});
