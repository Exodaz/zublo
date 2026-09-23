import { api } from "@/lib/api";

export interface BrandSearchResult {
  name: string;
  domain: string;
  verified: boolean;
}

export interface BrandSearchResponse {
  /** False when the server has no BRANDFETCH_CLIENT_ID. */
  configured: boolean;
  brands: BrandSearchResult[];
}

export const brandSearchService = {
  /** Brands matching a name, from the Brandfetch Brand Search API. */
  search: (query: string, signal?: AbortSignal) =>
    api.get<BrandSearchResponse>(`/api/brand-search?q=${encodeURIComponent(query)}`, { signal }),
};
