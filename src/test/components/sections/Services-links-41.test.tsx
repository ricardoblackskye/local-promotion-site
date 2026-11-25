/**
 * #41 task 4 - a card must actually go somewhere.
 *
 * The section already renders "Learn more ->" on every card, which promises navigation and delivers
 * none: the card is inert markup. So the change is not "add a link", it is "make an existing promise
 * true" - and the case that matters most is the one where it must NOT become a link:
 *
 *   the section falls back to six hard-coded entries when the collection is empty, and NONE of them
 *   carries a slug. Linking unconditionally would produce six links to nowhere exactly when the data
 *   source is unavailable.
 *
 * So: a card with a slug is a link to its detail route; a card without one stays as it is today.
 */
import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("framer-motion");
vi.mock("react-intersection-observer");
vi.mock("@/hooks/useWixServices", () => ({
  useWixServices: vi.fn(),
}));

import { useWixServices } from "@/hooks/useWixServices";
import Services from "@/components/sections/Services";
import type { Service } from "@/types";

const mockUseWixServices = vi.mocked(useWixServices) as unknown as Mock;

function withServices(items: Service[]) {
  mockUseWixServices.mockReturnValue({ data: items, isLoading: false, isError: false });
}

function renderSection() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Services />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("a card with a slug links to its detail page (#41)", () => {
  it("links the card to /features/<slug>", () => {
    withServices([
      {
        _id: "s1",
        title: "AI Strategy",
        description: "Desc",
        icon: "brain",
        slug: "ai-strategy",
      },
    ]);

    renderSection();

    const link = screen.getByRole("link", { name: /AI Strategy/ });
    expect(link.getAttribute("href")).toBe("/features/ai-strategy");
    // The affordance the card already showed, now doing what it says.
    expect(link.textContent).toMatch(/Learn more/);
  });

  // The control: a fallback entry has no slug, so it must not become a dead link.
  it("leaves a card without a slug unlinked", () => {
    withServices([{ _id: "s2", title: "Bare Entry", description: "Desc", icon: "brain" }]);

    renderSection();

    expect(screen.getByText("Bare Entry")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Bare Entry/ })).toBeNull();
  });

  it("links every card that has a slug, and only those", () => {
    withServices([
      { _id: "a", title: "Has Slug", description: "D", icon: "brain", slug: "has-slug" },
      { _id: "b", title: "No Slug", description: "D", icon: "brain" },
    ]);

    renderSection();

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/features/has-slug");
  });
});
