/**
 * #41 follow-up - `Details` is markup, and must render as markup.
 *
 * Reported from the browser: the detail page showed raw tags. The Wix field holds HTML, and the page
 * was splitting it into paragraphs as if it were plain text - so a reader saw "<p>" and "</p>" instead
 * of the formatting they were written with.
 *
 * The content is authored in the site owner s own CMS, which is why rendering it as HTML is the
 * intended behaviour rather than a hole: there is no untrusted author in this path. If that ever
 * changes - user-submitted copy - the value needs sanitising before it reaches the DOM, and this file
 * is where that requirement should be recorded.
 *
 * The second case is the control: an entry whose copy is genuinely plain text must still render.
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

function renderWith(details: string) {
  const service: Service = {
    _id: "s1",
    title: "AI Strategy",
    description: "A short description.",
    icon: "brain",
    details,
  };
  mockUseWixService.mockReturnValue({ data: service, isLoading: false, isError: false });
  return render(
    <MemoryRouter initialEntries={["/features/s1"]}>
      <Routes>
        <Route path="/features/:id" element={<FeatureDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the details copy renders as markup (#41 follow-up)", () => {
  it("renders the HTML elements rather than showing their tags", () => {
    const { container } = renderWith("<p>First</p><p>Second with <strong>emphasis</strong></p>");

    const strong = container.querySelector("strong");
    expect(strong).toBeTruthy();
    expect(strong?.textContent).toBe("emphasis");

    const paragraphs = container.querySelectorAll("article p");
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);

    // The tell from the report: the tags must NOT be visible as text.
    expect(screen.queryByText(/<strong>/)).toBeNull();
    expect(screen.queryByText(/<\/p>/)).toBeNull();
  });

  // The control: plain copy, no markup, must still be readable.
  it("still renders copy that carries no markup at all", () => {
    renderWith("Just a sentence, written plainly.");

    expect(screen.getByText(/Just a sentence, written plainly/)).toBeTruthy();
  });
});
