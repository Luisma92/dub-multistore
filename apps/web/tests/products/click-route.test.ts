/**
 * Integration test for POST /api/products/[slug]/click
 *
 * These tests verify route-level behaviour. Because Next.js App Router
 * route handlers import Prisma and other server-only modules, we mock the
 * heavy dependencies and call the handler function directly.
 *
 * TODO: Add full Playwright E2E test once test infra supports App Router
 *       request mocking end-to-end.
 */
import { describe, expect, it, vi } from "vitest";

// --- Mock Prisma -----------------------------------------------------------
vi.mock("@dub/prisma", () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
    },
  },
}));

// --- Mock recordPlatformClick (fire-and-forget side-effect) ---------------
vi.mock("@/lib/tinybird/record-platform-click", () => ({
  recordPlatformClick: vi.fn(),
}));

import { prisma } from "@dub/prisma";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/products/[slug]/click/route";
import { recordPlatformClick } from "@/lib/tinybird/record-platform-click";

const mockFindFirst = prisma.product.findFirst as ReturnType<typeof vi.fn>;

describe("POST /api/products/[slug]/click", () => {
  it("returns 404 when the slug is unknown", async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/products/ghost/click", {
      method: "POST",
      body: JSON.stringify({ platform: "shopify" }),
    });

    const res = await POST(req, { params: { slug: "ghost" } });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Product not found");
  });

  it("calls recordPlatformClick for a known slug", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "prod_1", slug: "my-shop" });

    const req = new NextRequest(
      "http://localhost/api/products/my-shop/click",
      {
        method: "POST",
        body: JSON.stringify({ platform: "woocommerce" }),
      },
    );

    const res = await POST(req, { params: { slug: "my-shop" } });

    expect(res.status).toBe(200);
    expect(recordPlatformClick).toHaveBeenCalledOnce();
    expect(recordPlatformClick).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod_1",
        productSlug: "my-shop",
        platform: "woocommerce",
      }),
    );
  });
});
