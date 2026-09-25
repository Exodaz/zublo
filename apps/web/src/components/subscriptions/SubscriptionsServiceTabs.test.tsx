import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import type { ServiceGroup } from "@/lib/serviceGroups";

import { ServiceIcon, SubscriptionsServiceTabs } from "./SubscriptionsServiceTabs";

const groups: ServiceGroup[] = [
  { key: "microsoft.com", label: "Microsoft 365", subscriptions: [{}, {}] as never, yearlyTotal: 0, memberCount: 0 },
  { key: "", label: "", subscriptions: [{}] as never, yearlyTotal: 0, memberCount: 0 },
];

function renderTabs(selected: string | null = null, grouped = false) {
  const onSelect = vi.fn();
  const onToggleGrouped = vi.fn();
  render(
    <SubscriptionsServiceTabs
      groups={groups}
      total={3}
      selected={selected}
      grouped={grouped}
      onSelect={onSelect}
      onToggleGrouped={onToggleGrouped}
    />,
  );
  return { onSelect, onToggleGrouped };
}

describe("SubscriptionsServiceTabs", () => {
  it("shows an All tab and one tab per service with counts and logos", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["all3", "Microsoft 3652", "other_services1"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1].querySelector("img")).toHaveAttribute(
      "src",
      "/api/brand-logo?domain=microsoft.com&size=64",
    );
    expect(tabs[2].querySelector("img")).toBeNull();
  });

  it("selects a service or all", () => {
    const { onSelect } = renderTabs("microsoft.com");
    expect(screen.getByRole("tab", { name: /Microsoft 365/ })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: /other_services/ }));
    expect(onSelect).toHaveBeenLastCalledWith("");
    fireEvent.click(screen.getByRole("tab", { name: /all/ }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("toggles grouping", () => {
    const { onToggleGrouped } = renderTabs(null, true);
    const toggle = screen.getByRole("button", { name: "group_by_service" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(onToggleGrouped).toHaveBeenCalledTimes(1);
  });
});

describe("ServiceIcon", () => {
  it("hides a logo that fails to load", () => {
    const { container } = render(<ServiceIcon serviceKey="netflix.com" />);
    const img = container.querySelector("img") as HTMLImageElement;
    fireEvent.error(img);
    expect(img.style.display).toBe("none");
  });

  it("renders nothing for an invalid key", () => {
    const { container } = render(<ServiceIcon serviceKey="not a domain" />);
    expect(container).toBeEmptyDOMElement();
  });
});
