import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Budgets from "./pages/Budgets";
import Vendors from "./pages/Vendors";
import Alerts from "./pages/Alerts";
import AuditLog from "./pages/AuditLog";
import Reports from "./pages/Reports";
import Policies from "./pages/Policies";

const PAGES = [
  ["Landing", Landing, "/"],
  ["Login", Login, "/login"],
  ["Register", Register, "/register"],
  ["Dashboard", Dashboard, "/dashboard"],
  ["Invoices", Invoices, "/invoices"],
  ["Budgets", Budgets, "/budgets"],
  ["Vendors", Vendors, "/vendors"],
  ["Alerts", Alerts, "/alerts"],
  ["AuditLog", AuditLog, "/audit-log"],
  ["Reports", Reports, "/reports"],
  ["Policies", Policies, "/policies"],
];

beforeAll(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;

  // jsdom has neither of these; Recharts and the shell rely on them.
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
      };
    };
});

describe("page smoke render", () => {
  test.each(PAGES)("%s mounts without a React error", async (name, Component, path) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const errors = [];
    const originalError = console.error;
    console.error = (...args) => {
      errors.push(args.map(String).join(" "));
      originalError(...args);
    };

    try {
      await act(async () => {
        root.render(
          <ThemeProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={[path]}>
                <Component />
              </MemoryRouter>
            </AuthProvider>
          </ThemeProvider>
        );
      });

      // Let pending promise rejections (offline API) settle.
      await act(async () => {
        await Promise.resolve();
      });

      expect(container.innerHTML.length).toBeGreaterThan(0);
      expect(document.body.textContent.length).toBeGreaterThan(0);

      const fatal = errors.filter(
        (message) =>
          message.includes("Element type is invalid") ||
          message.includes("The above error occurred") ||
          message.includes("is not a function") ||
          message.includes("Cannot read")
      );
      expect(fatal).toEqual([]);
    } finally {
      console.error = originalError;
      await act(async () => {
        root.unmount();
      });
      document.body.removeChild(container);
    }
  });
});
