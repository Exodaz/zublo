const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/api", () => ({ api: { get: mocks.get } }));

import { brandSearchService } from "./brandSearch";

describe("brandSearchService", () => {
  it("queries the brand search route with an encoded name", async () => {
    const signal = new AbortController().signal;
    mocks.get.mockResolvedValue({ configured: true, brands: [] });

    await expect(brandSearchService.search("true id", signal)).resolves.toEqual({
      configured: true,
      brands: [],
    });
    expect(mocks.get).toHaveBeenCalledWith("/api/brand-search?q=true%20id", { signal });
  });
});
