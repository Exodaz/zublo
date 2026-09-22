import { act, renderHook, waitFor } from "@testing-library/react";

import { useLogoSearch } from "./useLogoSearch";

describe("useLogoSearch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("discards images smaller than 512 bytes without decoding them", async () => {
    const tinyBlob = new Blob(["x".repeat(100)], { type: "image/png" });
    const fetchMock = vi.fn().mockImplementation((url: string) =>
      Promise.resolve(
        url.includes("clearbit.com/v1/companies")
          ? { ok: false }
          : {
              ok: true,
              headers: { get: () => "image/png" },
              blob: () => Promise.resolve(tinyBlob),
            },
      ),
    );
    const createImageBitmapMock = vi.fn();
    const createObjectURL = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("createImageBitmap", createImageBitmapMock);
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL: vi.fn() });

    const { result } = renderHook(() => useLogoSearch());

    act(() => result.current.setLogoSearch("tiny"));
    // The search runs after a 350 ms debounce and finishes almost instantly.
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(result.current.searching).toBe(false);
      expect(result.current.showLogoResults).toBe(true);
    });
    expect(result.current.logoResults).toEqual([]);
    expect(createImageBitmapMock).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
