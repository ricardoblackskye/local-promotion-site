/**
 * #41 task 3 - the app s route table must actually serve the detail page.
 *
 * The page s own test renders the component through a router it builds itself, so it proves the
 * component works and says nothing about whether the APP reaches it. That is the wire this case
 * exists for: without the route entry, /features/:slug renders whatever the fallback is and the
 * detail page is unreachable from the site.
 *
 * Harness copied from src/test/App.test.tsx, including the client mock and the two environment mocks
 * the sections need, with initialEntries pointed at a feature slug.
 */
import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("framer-motion");
vi.mock("react-intersection-observer");
vi.mock("@/lib/wixClient", () => ({
  wixClient: {
    items: { query: vi.fn() },
    posts: { listPosts: vi.fn(), getPostBySlug: vi.fn() },
  },
}));

import { wixClient } from "@/lib/wixClient";
import App from "@/App";

const mockQuery = vi.mocked(wixClient.items.query) as unknown as Mock;
const mockListPosts = vi.mocked(wixClient.posts.listPosts) as unknown as Mock;

beforeEach(() => {
  mockQuery.mockReturnValue({
    limit: vi.fn().mockReturnThis(),
    find: vi.fn().mockResolvedValue({
      items: [
        {
          _id: "s1",
          title: "AI Strategy",
          description: "A short description of the service.",
          icon: "brain",
          slug: "ai-strategy",
          details: "The long-form copy.",
          image: "https://cdn.example.com/ai-strategy.jpg",
        },
      ],
    }),
  } as unknown as ReturnType<typeof mockQuery>);
  mockListPosts.mockResolvedValue({ posts: [] });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("the app serves the features detail route (#41)", () => {
  it("renders the detail page for /features/:slug", async () => {
    renderAt("/features/ai-strategy");

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("AI Strategy");
    expect(screen.getByText("A short description of the service.")).toBeTruthy();
  });

  // The control: the home page must still be the home page.
  it("still renders the home page at /", async () => {
    renderAt("/");

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.queryByText("A short description of the service.")).toBeNull();
  });
});
