import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const postTokenMock = vi.fn();
vi.mock("@/api/token", () => ({
  default: { postToken: (...args: unknown[]) => postTokenMock(...args) },
}));

import { LoginForm } from "../LoginForm";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

beforeEach(() => {
  postTokenMock.mockReset();
  navigateMock.mockReset();
});

describe("LoginForm", () => {
  it("renders email and password inputs", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    renderWithProviders(<LoginForm />);
    const input = screen.getByPlaceholderText("••••••••") as HTMLInputElement;
    expect(input.type).toBe("password");
    await userEvent.click(screen.getByText("Show"));
    expect(input.type).toBe("text");
    await userEvent.click(screen.getByText("Hide"));
    expect(input.type).toBe("password");
  });

  it("submits credentials, stores tokens, and navigates home", async () => {
    postTokenMock.mockResolvedValue({ data: { access: "AAA", refresh: "RRR" } });
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "alice@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "pw1234567");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(postTokenMock).toHaveBeenCalledWith("alice@example.com", "pw1234567");
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe("AAA");
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe("RRR");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("shows error and skips navigation on failed login", async () => {
    postTokenMock.mockRejectedValue(new Error("nope"));
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "x@y.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });
});
