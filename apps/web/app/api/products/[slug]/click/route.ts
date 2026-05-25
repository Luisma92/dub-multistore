import { PLATFORMS } from "@/lib/platforms";
import { recordPlatformClick } from "@/lib/tinybird/record-platform-click";
import { prisma } from "@dub/prisma";
import { NextRequest, NextResponse } from "next/server";

const VALID_PLATFORM_IDS = new Set(PLATFORMS.map((p) => p.id));

// POST /api/products/[slug]/click – record a platform click (public)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = (await req.json()) as { platform?: string };

  if (!body.platform || !VALID_PLATFORM_IDS.has(body.platform)) {
    return NextResponse.json(
      { error: "Invalid or missing platform." },
      { status: 400 },
    );
  }

  const platform = body.platform;

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
