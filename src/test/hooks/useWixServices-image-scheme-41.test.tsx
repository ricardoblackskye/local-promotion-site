/**
 * #41 follow-up - a Wix image reference must leave the hook as a URL the page can actually load.
 *
 * Reported from the browser console:
 *
 *   Loading the image "wix:image://v1/77cdd2_...jpg/ProtectedSandbox.jpg#originWidth=600"
 *   violates the following Content Security Policy directive: "img-src 'self' data: https:"
 *
 * `wix:image://` is Wix s INTERNAL reference, not a URL. Rendering it as one puts a scheme the CSP
 * refuses into an <img src>, so the image is blocked and the reader sees nothing.
 *
 * The repo already answers this: its blog tests mock `getScaledToFillImageUrl` from `@wix/sdk/media`,
 * so image references are converted through that helper. This pins the same conversion for the
 * collection, at the boundary where a collection field becomes a Service.
 *
 * The controls: a value that is ALREADY an https URL must pass through untouched, and an absent image
 * must stay absent rather than becoming a broken source.
 */
import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/wixClient", () => ({
  wixClient: {
    items: {
      query: vi.fn(),
    },
  },
}));

vi.mock("@wix/sdk/media", () => ({
  // Mirrors the REAL signature - (identifier, width, height, options). The first version of this mock
  // took one argument, so it passed while the production call was wrong, and only `tsc` noticed.
  getScaledToFillImageUrl: vi.fn(
    (...args: unknown[]) => `https://static.wixstatic.com/media/${String(args[0])}`,
  ),
}));

import { wixClient } from "@/lib/wixClient";
import { useWixServices } from "@/hooks/useWixServices";

const mockedQuery = vi.mocked(wixClient.items.query) as unknown as Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

function respondWith(items: unknown[]) {
  mockedQuery.mockReturnValue({
    limit: vi.fn().mockReturnThis(),
    find: vi.fn().mockResolvedValue({ items }),
  } as unknown as ReturnType<typeof mockedQuery>);
}

beforeEach(() => {
  mockedQuery.mockReset();
});

describe("an image reference becomes a loadable URL (#41 follow-up)", () => {
  it("converts a wix:image:// reference to an https URL", async () => {
    respondWith([
      {
        _id: "s1",
        title: "AI Strategy",
        description: "Desc",
        icon: "brain",
        image: "wix:image://v1/77cdd2_bc4a299ab575431f87e3f705d4972bda~mv2.jpg/ProtectedSandbox.jpg#originWidth=600&originHeight=338",
      },
    ]);

    const { result } = renderHook(() => useWixServices(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const image = result.current.data![0].image;
    expect(image).toBeTruthy();
    // The whole point: whatever comes out must satisfy the CSP, i.e. be https.
    expect(image!.startsWith("https://")).toBe(true);
    expect(image).not.toMatch(/^wix:/);
  });

  it("passes an https image through unchanged", async () => {
    respondWith([{ _id: "s2", title: "T", description: "D", icon: "brain", image: "https://cdn.example.com/a.jpg" }]);

    const { result } = renderHook(() => useWixServices(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].image).toBe("https://cdn.example.com/a.jpg");
  });

  it("leaves an entry with no image without one", async () => {
    respondWith([{ _id: "s3", title: "T", description: "D", icon: "brain" }]);

    const { result } = renderHook(() => useWixServices(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].image).toBeUndefined();
  });
});
