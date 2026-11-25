/**
 * #41 task 7 - a way back to the home page, at the top of the detail page.
 *
 * Why this is needed at all: the header navigates by SCROLLING to section ids that only exist on the
 * home page, so off it every one of its controls - including the logo - is inert. A reader landing on
 * a feature detail page from a search result has no working way back. The breadcrumb is that way back.
 *
 * It follows the ARIA breadcrumb pattern: a `nav` with an accessible name, links for every ancestor,
 * and the CURRENT entry as plain text marked `aria-current="page"` rather than as a link to itself.
 *
 * The middle segment points at `/#services` rather than `/features`: the collection is a section of the
 * home page carrying `id="services"`, not a route of its own, and that id is the one task 5
 * deliberately left in place. A link to `/features` would be a link to nothing.
 */
import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
  details: "The long-form copy.",
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

function breadcrumb() {
  return screen.getByRole("navigation", { name: /breadcrumb/i });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseWixService.mockReturnValue({ data: FULL, isLoading: false, isError: false });
});

describe("the detail page leads back home (#41)", () => {
  it("offers a breadcrumb whose ancestors are real links", () => {
    renderPage();

    const nav = breadcrumb();
    expect(within(nav).getByRole("link", { name: /home/i }).getAttribute("href")).toBe("/");
    expect(within(nav).getByRole("link", { name: /features/i }).getAttribute("href")).toBe("/#services");
  });

  it("names the current entry without linking to itself", () => {
    renderPage();

    const nav = breadcrumb();
    expect(within(nav).getByText("AI Strategy")).toBeTruthy();
    // The ARIA rule: the page you are ON is not a link.
    expect(within(nav).queryByRole("link", { name: "AI Strategy" })).toBeNull();
  });

  // The control: the breadcrumb belongs to a FOUND entry, not to every page state.
  it("is absent on the not-found state", () => {
    mockUseWixService.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    renderPage("no-such-feature");

    expect(screen.queryByRole("navigation", { name: /breadcrumb/i })).toBeNull();
    expect(screen.getByText(/not found/i)).toBeTruthy();
  });
});
