import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CalendarOverview } from "./CalendarOverview";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));

vi.mock("@/components/calendar/StatCard", () => ({
  StatCard: ({ label, value, loading, hint }: any) => (
    <div data-testid={`stat-${label}`}>
      {loading ? "loading" : value}
      {hint ? ` | ${hint}` : ""}
    </div>
  ),
}));

describe("CalendarOverview", () => {
  const defaultProps = {
    count: 10,
    total: 100,
    due: 50,
    loading: false,
    budget: 150,
    overBudget: false,
  };

  it("renders with default props and no main currency", () => {
    render(<CalendarOverview {...defaultProps} />);

    expect(screen.getByTestId("stat-subscriptions")).toHaveTextContent("10");
    expect(screen.getByTestId("stat-total")).toHaveTextContent("100.00 $");
    expect(screen.getByTestId("stat-due")).toHaveTextContent("50.00 $");
    expect(screen.queryByText("over_budget_warning")).not.toBeInTheDocument();
  });

  it("renders with main currency and over budget warning", () => {
    render(
      <CalendarOverview
        {...defaultProps}
        due={60}
        total={200}
        overBudget={true}
        mainCurrency={{
          id: "eur",
          name: "Euro",
          symbol: "€",
          code: "EUR",
          rate: 1,
          is_main: true,
          user: "user-1",
        }}
      />,
    );

    expect(screen.getByTestId("stat-total")).toHaveTextContent("200.00 €");
    expect(screen.getByText("over_budget_warning")).toBeInTheDocument();
    expect(screen.getByText("50.00 €")).toBeInTheDocument(); // 200 - 150 = 50
  });

  it("renders loading state", () => {
    render(
      <CalendarOverview {...defaultProps} due={60} loading={true} />,
    );

    expect(screen.getByTestId("stat-subscriptions")).toHaveTextContent(
      "loading",
    );
    expect(screen.getByTestId("stat-total")).toHaveTextContent("loading");
    expect(screen.getByTestId("stat-due")).toHaveTextContent("loading");
  });

  it("adds member expiry and renewal cards when member stats are given", () => {
    render(
      <CalendarOverview
        count={1}
        total={10}
        due={5}
        loading={false}
        budget={0}
        overBudget={false}
        mainCurrency={{ id: "c", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "u" }}
        memberStats={{ count: 12, total: 4800, upcomingCount: 7, upcomingTotal: 2800 }}
      />,
    );

    expect(screen.getByTestId("stat-members_expiring_month")).toHaveTextContent(
      "members_count:12 | members_upcoming_hint:7",
    );
    expect(screen.getByTestId("stat-renewal_amount_month").textContent).toMatch(
      /4,800.* \| renewal_upcoming_hint:.*2,800/,
    );
  });

  it("hides the member cards without member stats", () => {
    render(
      <CalendarOverview count={0} total={0} due={0} loading={false} budget={0} overBudget={false} />,
    );
    expect(screen.queryByTestId("stat-members_expiring_month")).not.toBeInTheDocument();
  });
});
