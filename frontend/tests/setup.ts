import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Clean up after each test
afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined") {
  if (!window.URL) {
    // @ts-expect-error mock URL in jsdom
    window.URL = {};
  }
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => "blob:mock-object-url";
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }
  if (typeof HTMLAnchorElement !== "undefined") {
    HTMLAnchorElement.prototype.click = () => {};
  }
}
