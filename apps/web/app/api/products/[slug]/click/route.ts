import { recordPlatformClick } from "@/lib/tinybird/record-platform-click";
import { prisma } from "@dub/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/products/[slug]/click – record a platform click (public)
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const product = await prisma.product.findFirst({
    where: { slug: params.slug },
    select: { id: true, slug: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = (await req.json()) as { platform?: string };
  const platform = body.platform || "unknown";

  const country = req.headers.get("cf-ipcountry") ?? "unknown";

  const ua = req.headers.get("user-agent") ?? "";
  const deviceType = /mobile/i.test(ua) ? "mobile" : "desktop";

  const referrer = req.headers.get("referer") ?? "";

  recordPlatformClick({
    productId: product.id,
    productSlug: product.slug,
    platform,
    country,
    deviceType,
    referrer,
  });

  return NextResponse.json({ ok: true });
}
