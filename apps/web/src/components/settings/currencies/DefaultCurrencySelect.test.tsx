import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createQueryClientWrapper } from "@/test/query-client";
import type { Currency } from "@/types";

const mocks = vi.hoisted(() => ({
  user: { id: "u1", default_currency: "try" } as { id: string; default_currency?: string } | null,
  refreshUser: vi.fn(),
  update: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user, refreshUser: mocks.refreshUser }),
}));
vi.mock("@/services/users", () => ({ usersService: { update: mocks.update } }));
vi.mock("@/lib/toast", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));

import { DefaultCurrencySelect } from "./DefaultCurrencySelect";

const currencies: Currency[] = [
  { id: "thb", name: "Baht", code: "THB", symbol: "฿", rate: 1, is_main: true, user: "u1" },
  { id: "try", name: "Lira", code: "TRY", symbol: "₺", rate: 1.3, is_main: false, user: "u1" },
];

function renderSelect(list = currencies) {
  const { Wrapper } = createQueryClientWrapper();
  render(<DefaultCurrencySelect currencies={list} />, { wrapper: Wrapper });
  return screen.getByLabelText("default_new_currency");
}

describe("DefaultCurrencySelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: "u1", default_currency: "try" };
  });

  it("shows the saved default and saves a new one", async () => {
    mocks.update.mockResolvedValue({});
    const select = renderSelect();
    expect(select).toHaveValue("try");
    fireEvent.change(select, { target: { value: "" } });
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("saved"));
    expect(mocks.update).toHaveBeenCalledWith("u1", { default_currency: "" });
    expect(mocks.refreshUser).toHaveBeenCalled();
  });

  it("reads a deleted default as the main currency and reports failures", async () => {
    mocks.update.mockRejectedValue(new Error("nope"));
    const select = renderSelect([currencies[0]]);
    expect(select).toHaveValue("");
    fireEvent.change(select, { target: { value: "thb" } });
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("unknown_error"));
  });

  it("is disabled without a user", () => {
    mocks.user = null;
    expect(renderSelect()).toBeDisabled();
  });
});
