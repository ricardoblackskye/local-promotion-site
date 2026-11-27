/**
 * #41 task 4 - a card must actually go somewhere.
 *
 * The section already renders "Learn more ->" on every card, promising navigation it does not deliver.
 * The change makes that promise true.
 *
 * RE-POINTED after the follow-up. This file first asserted that a card WITHOUT a slug stayed unlinked,
 * and the live browser proved that premise wrong: the collection supplies no slug at all, so every card
 * was inert. The key is now the record id, which every record has - so the guard is no longer "is there
 * a slug" but "does the link point at the record the data actually carries".
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

function renderSection(items: Service[]) {
  mockUseWixServices.mockReturnValue({ data: items, isLoading: false, isError: false });
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Services />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("a card with a record links to its detail page (#41)", () => {
  it("links the card, and the link carries the copy the card already showed", () => {
    renderSection([
      { _id: "s1", title: "AI Strategy", description: "Desc", icon: "brain", slug: "ai-strategy" },
    ]);

    const link = screen.getByRole("link", { name: /AI Strategy/ });
    expect(link.getAttribute("href")).toBe("/features/s1");
    expect(link.textContent).toMatch(/Learn more/);
  });

  // The re-pointed guard: the link must address the RECORD, whichever fields it happens to carry.
  it("addresses the record whether or not it carries a slug", () => {
    renderSection([{ _id: "s2", title: "Bare Entry", description: "Desc", icon: "brain" }]);

    expect(screen.getByRole("link", { name: /Bare Entry/ }).getAttribute("href")).toBe("/features/s2");
  });

  it("links every card, since every record has an id", () => {
    renderSection([
      { _id: "a", title: "Has Slug", description: "D", icon: "brain", slug: "has-slug" },
      { _id: "b", title: "No Slug", description: "D", icon: "brain" },
    ]);

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
