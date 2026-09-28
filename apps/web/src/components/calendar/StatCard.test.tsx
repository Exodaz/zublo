import { render, screen } from "@testing-library/react";

import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the value when not loading", () => {
    render(
      <StatCard
        icon={<span>ICON</span>}
        iconClass="bg-primary/10 text-primary"
        label="Monthly Total"
        value="$120.00"
        loading={false}
      />,
    );

    expect(screen.getByText("ICON")).toBeInTheDocument();
    expect(screen.getByText("Monthly Total")).toBeInTheDocument();
    expect(screen.getByText("$120.00")).toBeInTheDocument();
  });

  it("renders a loading placeholder when loading", () => {
    const { container } = render(
      <StatCard
        icon={<span>ICON</span>}
        iconClass="bg-primary/10 text-primary"
        label="Monthly Total"
        value="$120.00"
        loading
      />,
    );

    expect(screen.queryByText("$120.00")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows a hint under the value, but not while loading", () => {
    const { rerender } = render(
      <StatCard icon={null} iconClass="" label="Members" value="3" hint="2 still to come" loading={false} />,
    );
    expect(screen.getByText("2 still to come")).toBeInTheDocument();

    rerender(<StatCard icon={null} iconClass="" label="Members" value="3" hint="2 still to come" loading />);
    expect(screen.queryByText("2 still to come")).not.toBeInTheDocument();
  });
});
