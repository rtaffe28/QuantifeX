import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const registerMock = vi.fn();
vi.mock("@/api/user", () => ({
  default: { registerUser: (...args: unknown[]) => registerMock(...args) },
}));

import { RegisterForm } from "../RegisterForm";

beforeEach(() => {
  registerMock.mockReset();
  navigateMock.mockReset();
});

async function fill(email: string, password: string, confirm: string) {
  // Sequential typing — `userEvent` interleaves keystrokes if these run in parallel.
  await userEvent.type(screen.getByPlaceholderText("you@example.com"), email);
  const inputs = screen.getAllByPlaceholderText("••••••••");
  await userEvent.type(inputs[0], password);
  await userEvent.type(inputs[1], confirm);
}

describe("RegisterForm", () => {
  it("rejects mismatched passwords without calling API", async () => {
    renderWithProviders(<RegisterForm />);
    await fill("alice@example.com", "longenough12", "different12");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("rejects short passwords without calling API", async () => {
    renderWithProviders(<RegisterForm />);
    await fill("alice@example.com", "short", "short");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Either the HTML5 minLength constraint or the explicit guard catches it.
    await waitFor(() => {
      expect(registerMock).not.toHaveBeenCalled();
    });
  });

  it("calls register API and navigates to /login on success", async () => {
    registerMock.mockResolvedValue({ data: {} });
    renderWithProviders(<RegisterForm />);
    await fill("alice@example.com", "longenough12", "longenough12");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith("alice@example.com", "longenough12");
    });
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("surfaces server error when registration fails", async () => {
    registerMock.mockRejectedValue(new Error("dup"));
    renderWithProviders(<RegisterForm />);
    await fill("alice@example.com", "longenough12", "longenough12");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/registration failed/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
