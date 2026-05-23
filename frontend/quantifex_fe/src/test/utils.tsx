/**
 * Test helpers shared across component tests.
 *
 * `renderWithProviders` wraps a component in Chakra's provider (with its mock
 * color-mode setup) and a MemoryRouter for any react-router-dom hooks. Use this
 * instead of bare `render()` so components that use router/Chakra primitives
 * work without surprise.
 */
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

interface WrapperOptions {
  route?: string;
  routerEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  options: WrapperOptions & Omit<RenderOptions, "wrapper"> = {}
) {
  const { routerEntries, route, ...rest } = options;
  const entries = routerEntries ?? (route ? [route] : ["/"]);

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ChakraProvider value={defaultSystem}>
      <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>
    </ChakraProvider>
  );
  return render(ui, { wrapper: Wrapper, ...rest });
}

/** Build a JWT with a controllable `exp` claim for auth tests. */
export function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}
