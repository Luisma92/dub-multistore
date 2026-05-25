import { recordPlatformClick } from "@/lib/tinybird/record-platform-click";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("recordPlatformClick", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    process.env.TINYBIRD_API_URL = "https://api.tinybird.co";
    process.env.TINYBIRD_API_KEY = "test-token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls fetch with the platform_click_events endpoint", async () => {
    recordPlatformClick({
      productId: "prod_123",
      productSlug: "my-shop",
      platform: "shopify",
      country: "US",
      deviceType: "desktop",
      referrer: "https://example.com",
    });

    // fire-and-forget: wait a tick for the void promise to dispatch
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("platform_click_events");
  });

  it("includes Authorization header with Bearer token", async () => {
    recordPlatformClick({
      productId: "prod_123",
      productSlug: "my-shop",
      platform: "woocommerce",
      country: "AR",
      deviceType: "mobile",
      referrer: "",
    });

    await new Promise((r) => setTimeout(r, 0));

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-token");
  });

  it("does NOT throw even when fetch rejects (fire-and-forget)", async () => {
    fetchSpy.mockRejectedValue(new Error("network error"));

    expect(() =>
      recordPlatformClick({
        productId: "prod_456",
        productSlug: "another-shop",
        platform: "shopify",
        country: "BR",
        deviceType: "desktop",
        referrer: "",
      }),
    ).not.toThrow();

    // let the rejected promise settle — no unhandled rejection should surface
    await new Promise((r) => setTimeout(r, 10));
  });
});
