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

  // Check for duplicate slug within workspace
  const existing = await prisma.product.findFirst({
    where: { slug, workspaceId: workspace.id },
    select: { id: true },
  });

  if (existing) {
    throw new DubApiError({
      code: "conflict",
      message: `A product with slug "${slug}" already exists in this workspace.`,
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
        })),
      },
    },
    include: {
      platforms: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(product, { status: 201 });
});
