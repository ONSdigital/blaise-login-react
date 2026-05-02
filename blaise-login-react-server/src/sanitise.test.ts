import { describe, expect, it } from "vitest";
import { sanitise } from "./sanitise";

describe("sanitise", () => {
  it("returns fallback for non-string values", () => {
    expect(sanitise(undefined)).toBe("unknown");
    expect(sanitise(123, "custom-fallback")).toBe("custom-fallback");
  });

  it("returns fallback for empty string", () => {
    expect(sanitise("", "empty-fallback")).toBe("empty-fallback");
  });

  it("removes carriage returns and line feeds", () => {
    expect(sanitise("user\r\nname")).toBe("username");
  });

  it("returns unchanged string when no control characters are present", () => {
    expect(sanitise("normal-value")).toBe("normal-value");
  });
});
