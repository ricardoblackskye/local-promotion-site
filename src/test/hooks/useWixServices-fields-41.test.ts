/**
 * #41 task 1 - the two fields the detail page needs must come through the hook.
 *
 * The collection already yields `title` and `description`; the detail page also needs `Details` and
 * `Image`. The hook is where a collection field becomes a `Service`, so if the mapping does not carry
 * them the page has nothing to render and the failure appears far from its cause.
 *
 * The second case is the control: an entry with neither field must still be a usable `Service`,
 * because a missing image is not an error worth breaking a collection over.
 *
 * The mock shape is copied from `useWixServices.test.ts` rather than invented.
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

import { wixClient } from "@/lib/wixClient";
import { useWixServices } from "@/hooks/useWixServices";

const mockedQuery = vi.mocked(wixClient.items.query) as unknown as Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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

describe("the Services collection carries details and image (#41)", () => {
  it("maps details and image onto the Service it returns", async () => {
    respondWith([
      {
        _id: "s1",
        title: "AI Strategy",
        description: "Desc",
        icon: "brain",
        slug: "ai-strategy",
        details: "The long-form copy for the detail page.",
        image: "https://static.wixstatic.com/media/example.png",
      },
    ]);

    const { result } = renderHook(() => useWixServices(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const svc = result.current.data![0];
    expect(svc.slug).toBe("ai-strategy");
    // The wire: a field the page renders must survive the mapping.
    expect(svc.details).toBe("The long-form copy for the detail page.");
    expect(svc.image).toBe("https://static.wixstatic.com/media/example.png");
  });

  // The control: an entry missing both is still usable, and the page falls back rather than breaking.
  it("returns a usable Service when an entry has neither field", async () => {
    respondWith([{ _id: "s2", title: "No Extras", description: "Desc", icon: "brain", slug: "no-extras" }]);

    const { result } = renderHook(() => useWixServices(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const svc = result.current.data![0];
    expect(svc.title).toBe("No Extras");
    expect(svc.details).toBeUndefined();
    expect(svc.image).toBeUndefined();
  });

  it("treats an explicitly null image as absent rather than as a broken source", async () => {
    respondWith([
      { _id: "s3", title: "Null Extras", description: "D", icon: "brain", slug: "null", details: null, image: null },
    ]);

    const { result } = renderHook(() => useWixServices(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const svc = result.current.data![0];
    expect(svc.image).toBeUndefined();
  });
});
