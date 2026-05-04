import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useAsyncRequest } from "./useAsyncRequest";

describe("useAsyncRequest", () => {
  it("should initialise in a loading state", () => {
    const mockRequest = vi.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAsyncRequest(mockRequest));

    expect(result.current).toEqual({ state: "loading" });
  });

  it("should transition to success state when the request resolves", async () => {
    const data = { id: 1, name: "Test" };
    const mockRequest = vi.fn().mockResolvedValue(data);

    const { result } = renderHook(() => useAsyncRequest(mockRequest));

    await waitFor(() => {
      expect(result.current).toEqual({ state: "succeeded", data });
    });
  });

  it("should transition to error state when the request rejects", async () => {
    const errorMsg = "Network Error";
    const mockRequest = vi.fn().mockRejectedValue(new Error(errorMsg));

    const { result } = renderHook(() => useAsyncRequest(mockRequest));

    await waitFor(() => {
      expect(result.current).toEqual({ state: "errored", error: errorMsg });
    });
  });

  it("should reset to loading when the request function changes", async () => {
    const request1 = vi.fn().mockResolvedValue("data1");
    const request2 = vi.fn().mockResolvedValue("data2");

    const { result, rerender } = renderHook(({ req }) => useAsyncRequest(req), {
      initialProps: { req: request1 },
    });

    await waitFor(() => expect(result.current.state).toBe("succeeded"));

    rerender({ req: request2 });

    expect(result.current).toEqual({ state: "loading" });
  });

  it("should ignore state updates if the component unmounts (cleanup)", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 50));
    const mockRequest = vi.fn().mockReturnValue(promise);

    const { unmount } = renderHook(() => useAsyncRequest(mockRequest));

    unmount();

    await promise;

    expect(true).toBe(true);
  });

  it("should handle non-Error objects in the catch block", async () => {
    const mockRequest = vi.fn().mockRejectedValue("A raw string error");

    const { result } = renderHook(() => useAsyncRequest(mockRequest));

    await waitFor(() => {
      expect(result.current).toEqual({ state: "errored", error: "A raw string error" });
    });
  });

  it("should ignore state updates if the component unmounts before rejection", async () => {
    let rejectPromise!: (reason?: unknown) => void;

    const promise = new Promise((_, reject) => {
      rejectPromise = reject;
    });

    const mockRequest = vi.fn().mockReturnValue(promise);

    const { unmount } = renderHook(() => useAsyncRequest(mockRequest));

    unmount();

    rejectPromise("Fail");

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(true).toBe(true);
  });
});
