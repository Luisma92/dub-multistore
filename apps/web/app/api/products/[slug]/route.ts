import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/products/[slug] – public endpoint, fetch product by slug
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
      platforms: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          platform: true,
          label: true,
          url: true,
          logoUrl: true,
          order: true,
        },
      },
    },
  });

  if (!product || product.platforms.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PUT /api/products/[slug] – update product (authenticated)
export const PUT = withWorkspace(
  async ({ req, workspace, params }) => {
    const slug = params.slug;

    const existing = await prisma.product.findFirst({
      where: { slug, workspaceId: workspace.id },
    });

    if (!existing) {
      throw new DubApiError({
        code: "not_found",
        message: "Product not found.",
      });
    }

    const body = await parseRequestBody(req);
    const { name, description, imageUrl, platforms } = body as {
      name?: string;
      description?: string;
      imageUrl?: string;
      platforms?: Array<{
        platform: string;
        label: string;
        url: string;
        logoUrl?: string;
        order?: number;
        isActive?: boolean;
      }>;
    };

    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(platforms && {
          platforms: {
            deleteMany: {},
            create: platforms.map((p, i) => ({
              platform: p.platform,
              label: p.label,
              url: p.url,
              logoUrl: p.logoUrl,
              order: p.order ?? i,
              isActive: p.isActive ?? true,
            })),
          },
        }),
      },
      include: {
        platforms: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(product);
  },
);

// DELETE /api/products/[slug] – delete product (authenticated)
export const DELETE = withWorkspace(
  async ({ workspace, params }) => {
    const slug = params.slug;

    const existing = await prisma.product.findFirst({
      where: { slug, workspaceId: workspace.id },
    });

    if (!existing) {
      throw new DubApiError({
        code: "not_found",
        message: "Product not found.",
      });
    }

    await prisma.product.delete({ where: { id: existing.id } });

    return NextResponse.json({ deleted: true });
  },
);
