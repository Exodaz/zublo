import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));

import { SubscriptionsSelectionBar } from "./SubscriptionsSelectionBar";

function renderBar(props: Partial<Parameters<typeof SubscriptionsSelectionBar>[0]> = {}) {
  const handlers = {
    onSelectAll: vi.fn(),
    onClear: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  };
  render(
    <SubscriptionsSelectionBar
      selectedCount={2}
      visibleCount={5}
      deleting={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("SubscriptionsSelectionBar", () => {
  it("shows the count and forwards every action", () => {
    const handlers = renderBar();
    expect(screen.getByText("selected_count:2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "select_all" }));
    fireEvent.click(screen.getByRole("button", { name: "clear_selection" }));
    fireEvent.click(screen.getByRole("button", { name: /delete_selected/ }));
    fireEvent.click(screen.getByRole("button", { name: "close" }));

    expect(handlers.onSelectAll).toHaveBeenCalledTimes(1);
    expect(handlers.onClear).toHaveBeenCalledTimes(1);
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("disables actions that cannot apply", () => {
    renderBar({ selectedCount: 0, visibleCount: 0 });
    expect(screen.getByRole("button", { name: "select_all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "clear_selection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /delete_selected/ })).toBeDisabled();
  });

  it("disables select all when everything is selected and delete while deleting", () => {
    renderBar({ selectedCount: 5, visibleCount: 5, deleting: true });
    expect(screen.getByRole("button", { name: "select_all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /delete_selected/ })).toBeDisabled();
  });
});
