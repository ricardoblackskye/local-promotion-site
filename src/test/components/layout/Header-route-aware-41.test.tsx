/**
 * #41 task 8 - the header s controls must work off the home page.
 *
 * Header.tsx navigates by SCROLLING to a section id:
 *
 *     function scrollToSection(sectionId) {
 *       const el = document.getElementById(sectionId)
 *       if (el) el.scrollIntoView({ behavior: "smooth" })
 *     }
 *
 * Every nav control and the logo call it. On /features/:slug none of those ids exists, so every
 * control silently does nothing - a click that appears to work and does not, which reads as a broken
 * page. The breadcrumb (task 7) gives one way home; this makes the header itself honest.
 *
 * The second case is the control that keeps this from being a rewrite: ON the home page the controls
 * must stay buttons that scroll, exactly as they do today.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("framer-motion");
vi.mock("react-intersection-observer");

import Header from "@/components/layout/Header";
import { NAV_ITEMS, SITE_NAME } from "@/lib/constants";

const scrollIntoView = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = scrollIntoView;
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>,
  );
}

/** The section the nav scrolls to, so the home-page case is not vacuous. */
function mountHomeSection() {
  const section = document.createElement("div");
  section.id = NAV_ITEMS[1].sectionId;
  document.body.appendChild(section);
  return section;
}

describe("the header navigates off the home page (#41)", () => {
  it("offers the nav as links to the sections, not as controls that silently do nothing", () => {
    renderAt("/features/ai-strategy");

    const labels = NAV_ITEMS.map((item) => item.label);
    for (const label of labels) {
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("href")).toBe(`/#${NAV_ITEMS.find((i) => i.label === label)?.sectionId}`);
    }
  });

  it("makes the logo a link home", () => {
    renderAt("/features/ai-strategy");

    const logo = screen.getByRole("link", { name: new RegExp(SITE_NAME) });
    expect(logo.getAttribute("href")).toBe("/");
  });

  // The control: on the home page nothing changes - still buttons, still scrolling.
  it("keeps the home page controls scrolling, and does not turn them into links", () => {
    const section = mountHomeSection();
    try {
      renderAt("/");

      const button = screen.getByRole("button", { name: NAV_ITEMS[1].label });
      expect(screen.queryByRole("link", { name: NAV_ITEMS[1].label })).toBeNull();

      button.click();
      expect(scrollIntoView).toHaveBeenCalled();
    } finally {
      section.remove();
    }
  });
});
