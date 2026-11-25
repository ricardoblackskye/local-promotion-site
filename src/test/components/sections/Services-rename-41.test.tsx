/**
 * #41 task 5 - the section is renamed, and the rename must not break navigation.
 *
 * The heading becomes "SkyeForge Features". Two ids must NOT move with it, and they are the controls:
 *
 *  - the section element keeps `id="services"`, because `NAV_ITEMS` scrolls to it by that id and a
 *    renamed id would leave the nav pointing at nothing; and
 *  - the heading keeps `id="services-heading"`, because the section is labelled by it via
 *    `aria-labelledby`, and losing it makes the section unnamed for a screen reader.
 *
 * A rename that moves either of those is a regression wearing a cosmetic change s clothing.
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
import { NAV_ITEMS } from "@/lib/constants";

const mockUseWixServices = vi.mocked(useWixServices) as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseWixServices.mockReturnValue({ data: [], isLoading: false, isError: false });
});

function renderSection() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Services />
    </MemoryRouter>,
  );
}

describe("the section is renamed to SkyeForge Features (#41)", () => {
  it("reads SkyeForge Features in its heading", () => {
    renderSection();

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toMatch(/SkyeForge/);
    expect(heading.textContent).toMatch(/Features/);
    expect(heading.textContent).not.toMatch(/Expertise/);
  });

  it("offers Features in the navigation", () => {
    const labels = NAV_ITEMS.map((item) => item.label);

    expect(labels).toContain("Features");
    expect(labels).not.toContain("Services");
  });

  // The controls: the ids the navigation and the labelling depend on must not move.
  it("keeps the ids that the navigation and the labelling depend on", () => {
    renderSection();

    const section = document.getElementById("services");
    expect(section).toBeTruthy();
    expect(section?.getAttribute("aria-labelledby")).toBe("services-heading");
    expect(document.getElementById("services-heading")).toBeTruthy();
    expect(NAV_ITEMS.some((item) => item.sectionId === "services")).toBe(true);
  });
});
