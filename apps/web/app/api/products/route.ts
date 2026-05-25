import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/products – list products for a workspace
export const GET = withWorkspace(async ({ workspace }) => {
  const products = await prisma.product.findMany({
    where: { workspaceId: workspace.id },
    include: {
      platforms: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
});

// POST /api/products – create a product
export const POST = withWorkspace(async ({ req, workspace }) => {
  const body = await parseRequestBody(req);
  const { slug, name, description, imageUrl, platforms } = body as {
    slug: string;
    name: string;
    description?: string;
    imageUrl?: string;
    platforms: Array<{
      platform: string;
      label: string;
      url: string;
      logoUrl?: string;
      order?: number;
      isActive?: boolean;
    }>;
  };

  if (!slug || !name) {
    throw new DubApiError({
      code: "unprocessable_entity",
      message: "slug and name are required.",
    });
  }

  if (!platforms || platforms.length === 0) {
    throw new DubApiError({
      code: "unprocessable_entity",
      message: "At least one platform is required.",
    });
  }

  // Validate platform URLs — only http/https allowed
  for (const p of platforms) {
    if (!/^https?:\/\//i.test(p.url)) {
      throw new DubApiError({
        code: "unprocessable_entity",
        message: `Platform URL must start with http:// or https://.`,
      });
    }
  }

  // Check for duplicate slug globally (slug is unique across all workspaces)
  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    throw new DubApiError({
      code: "conflict",
      message: `A product with slug "${slug}" already exists.`,
    });
  }

  const product = await prisma.product.create({
    data: {
      slug,
      name,
      description,
      imageUrl,
      workspaceId: workspace.id,
      platforms: {
        create: platforms.map((p, i) => ({
          platform: p.platform,
          label: p.label,
          url: p.url,
          logoUrl: p.logoUrl,
          order: p.order ?? i,
          isActive: p.isActive ?? true,
        })),
      },
    },
    include: {
      platforms: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(product, { status: 201 });
});
