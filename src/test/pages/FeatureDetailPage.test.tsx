/**
 * #41 task 2 - the detail page for one SkyeForge Features entry.
 *
 * The page must show the entry s title, its description, its image when there is one, and its
 * long-form `details`. Two cases matter as much as the happy path:
 *
 *  - an UNKNOWN slug must render the not-found branch rather than crash or render an empty shell,
 *    which is also task 3 s control; and
 *  - an entry with NO image and NO details must still render, because the collection allows both to
 *    be absent and a missing hero is not an error.
 *
 * The harness is copied from `src/test/pages/BlogPostPage.test.tsx`: the data hook is mocked, the
 * page is rendered through a real router, and the two environment mocks the repo needs are applied.
 */
import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("framer-motion");
vi.mock("react-intersection-observer");

vi.mock("@/hooks/useWixService", () => ({
  useWixService: vi.fn(),
}));

import { useWixService } from "@/hooks/useWixService";
import FeatureDetailPage from "@/pages/FeatureDetailPage";
import type { Service } from "@/types";

const mockUseWixService = vi.mocked(useWixService) as unknown as Mock;

const FULL: Service = {
  _id: "s1",
  title: "AI Strategy",
  description: "A short description of the service.",
  icon: "brain",
  slug: "ai-strategy",
  details: "The long-form copy for this feature.\nSecond paragraph.",
  image: "https://cdn.example.com/ai-strategy.jpg",
};

function renderPage(slug = "ai-strategy") {
  return render(
    <MemoryRouter initialEntries={[`/features/${slug}`]}>
      <Routes>
        <Route path="/features/:slug" element={<FeatureDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function loaded(service: Service | undefined) {
  mockUseWixService.mockReturnValue({ data: service, isLoading: false, isError: !service });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("a SkyeForge Features detail page (#41)", () => {
  it("shows the entry title, its description and its long-form details", async () => {
    loaded(FULL);

    renderPage();

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("AI Strategy");
    expect(screen.getByText("A short description of the service.")).toBeTruthy();
    expect(screen.getByText(/Second paragraph/)).toBeTruthy();
  });

  it("shows the entry image when the entry has one", async () => {
    loaded(FULL);

    renderPage();

    const img = await screen.findByRole("img");
    expect(img.getAttribute("src")).toBe("https://cdn.example.com/ai-strategy.jpg");
  });

  // The control for task 3: an unknown slug is a page state, not a crash.
  it("renders a not-found state for an unknown slug", async () => {
    loaded(undefined);

    renderPage("no-such-feature");

    expect(screen.queryByRole("img")).toBeNull();
    expect(await screen.findByText(/not found/i)).toBeTruthy();
  });

  // The control the collection requires: both fields are optional.
  it("still renders when the entry has neither an image nor details", async () => {
    loaded({ _id: "s2", title: "Bare Entry", description: "Just a description.", icon: "brain", slug: "bare" });

    renderPage("bare");

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Bare Entry");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Just a description.")).toBeTruthy();
  });
});
