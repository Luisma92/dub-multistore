import { prisma } from "@dub/prisma";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformButton } from "@/ui/products/PlatformButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug },
    select: { name: true, description: true, imageUrl: true },
  });

  if (!product) return {};

  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      ...(product.imageUrl && { images: [product.imageUrl] }),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      platforms: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!product || product.platforms.length === 0) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {/* Product image */}
          {product.imageUrl && (
            <div className="aspect-video w-full overflow-hidden bg-neutral-100">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* Product info */}
            <h1 className="text-2xl font-bold text-neutral-900">
              {product.name}
            </h1>
            {product.description && (
              <p className="mt-2 text-sm text-neutral-500">
                {product.description}
              </p>
            )}

            {/* Platform buttons */}
            <div className="mt-6 flex flex-col gap-3">
              {product.platforms.map((platform) => (
                <PlatformButton
                  key={platform.id}
                  productSlug={product.slug}
                  platform={platform.platform}
                  label={platform.label}
                  url={platform.url}
                  logoUrl={platform.logoUrl}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
