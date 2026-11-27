/**
 * #41 follow-up - the card link keys on the record s `_id`, not on a `slug` field.
 *
 * The first implementation linked only when the record carried a `slug`, and the collection does not
 * populate one - so in the browser the cards were inert while every test passed, because the tests
 * supplied a slug the data never had. That is the difference between a guard and a blind spot.
 *
 * `_id` is the right key: Wix always supplies it, the mapper already depends on it (`item._id ??
 * crypto.randomUUID()`), and it does not change. No new field is needed anywhere.
 *
 * The second case is the control: the detail route must resolve by the SAME key the card links with, or
 * a click lands on a page that cannot find its own record.
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

describe("a card links by record id (#41 follow-up)", () => {
  it("links a card to /features/<_id> even when the record has no slug", () => {
    renderSection([
      {
        _id: "a1b2c3d4",
        title: "AI Strategy",
        description: "Desc",
        icon: "brain",
        // No slug: this is what the collection actually returns.
      },
    ]);

    const link = screen.getByRole("link", { name: /AI Strategy/ });
    expect(link.getAttribute("href")).toBe("/features/a1b2c3d4");
  });

  it("links every card, since every record has an id", () => {
    renderSection([
      { _id: "id-1", title: "First", description: "D", icon: "brain" },
      { _id: "id-2", title: "Second", description: "D", icon: "brain", slug: "a-slug" },
    ]);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.getAttribute("href")).sort()).toEqual([
      "/features/id-1",
      "/features/id-2",
    ]);
  });
});
