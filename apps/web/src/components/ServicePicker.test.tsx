import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ search: vi.fn() }));

vi.mock("@/services/brandSearch", () => ({
  brandSearchService: { search: mocks.search },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));

import { ServicePicker } from "./ServicePicker";

function renderPicker(value = "") {
  const onSelect = vi.fn();
  const onClear = vi.fn();
  const utils = render(
    <div>
      <ServicePicker value={value} onSelect={onSelect} onClear={onClear} />
      <button type="button">outside</button>
    </div>,
  );
  return { ...utils, onSelect, onClear };
}

describe("ServicePicker", () => {
  beforeEach(() => {
    mocks.search.mockReset();
    mocks.search.mockResolvedValue({ configured: true, brands: [] });
  });

  it("lists every preset with its brand logo on focus and picks one", () => {
    const { onSelect } = renderPicker();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    fireEvent.focus(screen.getByLabelText("service"));

    const netflix = screen.getByRole("option", { name: /Netflix/ });
    expect(netflix.querySelector("img")).toHaveAttribute(
      "src",
      "/api/brand-logo?domain=netflix.com&size=64",
    );

    fireEvent.mouseDown(netflix);
    fireEvent.click(netflix);
    expect(onSelect).toHaveBeenCalledWith({
      name: "Netflix",
      domain: "netflix.com",
      url: "https://www.netflix.com",
    });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByLabelText("service")).toHaveValue("");
  });

  it("filters while typing and offers a typed domain that is not a preset", () => {
    const { onSelect } = renderPicker();
    const input = screen.getByLabelText("service");

    fireEvent.change(input, { target: { value: "netflix.com" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);

    fireEvent.change(input, { target: { value: "notion.com" } });
    const custom = screen.getByRole("option", { name: "use_domain:notion.com" });
    fireEvent.mouseDown(custom);
    fireEvent.click(custom);
    expect(onSelect).toHaveBeenCalledWith({
      name: "",
      domain: "notion.com",
      url: "https://notion.com",
    });
  });

  it("says when nothing matches once the search has finished", async () => {
    renderPicker();
    fireEvent.change(screen.getByLabelText("service"), { target: { value: "zzz nothing" } });
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("no_services_found")).toBeInTheDocument();
    expect(mocks.search).toHaveBeenCalledWith("zzz nothing", expect.any(AbortSignal));
  });

  it("adds Brandfetch results after the presets, skipping domains already listed", async () => {
    mocks.search.mockResolvedValue({
      configured: true,
      brands: [
        { name: "Netflix", domain: "netflix.com", verified: true },
        { name: "TrueID TV", domain: "trueidtv.com", verified: false },
      ],
    });
    const { onSelect } = renderPicker("trueidtv.com");
    fireEvent.change(screen.getByLabelText("service"), { target: { value: "netflix" } });

    const remote = await screen.findByRole("option", { name: /TrueID TV/ });
    expect(screen.getByText("Brandfetch")).toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: /Netflix/ })).toHaveLength(1);
    expect(remote).toHaveAttribute("aria-selected", "true");

    fireEvent.mouseDown(remote);
    fireEvent.click(remote);
    expect(onSelect).toHaveBeenCalledWith({
      name: "TrueID TV",
      domain: "trueidtv.com",
      url: "https://trueidtv.com",
    });
  });

  it("does not offer a typed domain that Brandfetch already returned", async () => {
    mocks.search.mockResolvedValue({
      configured: true,
      brands: [{ name: "Notion Labs", domain: "notion.com", verified: true }],
    });
    renderPicker();
    fireEvent.change(screen.getByLabelText("service"), { target: { value: "notion.com" } });

    await screen.findByRole("option", { name: /Notion Labs/ });
    expect(screen.queryByRole("option", { name: /use_domain/ })).not.toBeInTheDocument();
  });

  it("treats a failed search as no results", async () => {
    mocks.search.mockRejectedValue(new Error("offline"));
    renderPicker();
    fireEvent.change(screen.getByLabelText("service"), { target: { value: "zzz" } });
    expect(await screen.findByText("no_services_found")).toBeInTheDocument();
  });

  it("drops a superseded search and skips the request for short queries", async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    mocks.search
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue({ configured: true, brands: [] });
    renderPicker();
    const input = screen.getByLabelText("service");

    fireEvent.change(input, { target: { value: "abc" } });
    await waitFor(() => expect(mocks.search).toHaveBeenCalledTimes(1));
    fireEvent.change(input, { target: { value: "a" } });
    expect(screen.queryByText("loading")).not.toBeInTheDocument();

    await act(async () => resolveFirst({ configured: true, brands: [] }));
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
    expect(mocks.search).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking outside but not when clicking inside", () => {
    renderPicker();
    fireEvent.focus(screen.getByLabelText("service"));

    fireEvent.mouseDown(screen.getByRole("listbox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows the selected preset and lets it be cleared", () => {
    const { onClear } = renderPicker("spotify.com");

    expect(screen.getByText("Spotify")).toBeInTheDocument();
    expect(screen.getByText("spotify.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "clear_service" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("shows a custom domain by itself and hides a logo that fails to load", () => {
    const { container } = renderPicker("example.org");

    expect(screen.getAllByText("example.org")).toHaveLength(2);
    const img = container.querySelector("img") as HTMLImageElement;
    fireEvent.error(img);
    expect(img.style.visibility).toBe("hidden");

    fireEvent.focus(screen.getByLabelText("service"));
    const selected = screen.getAllByRole("option").filter((o) => o.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(0);
  });

  it("renders no logo source for a stored value that is not a valid domain", () => {
    const { container } = renderPicker("not a domain");
    expect(container.querySelector("img")?.getAttribute("src")).toBeFalsy();
  });
});
