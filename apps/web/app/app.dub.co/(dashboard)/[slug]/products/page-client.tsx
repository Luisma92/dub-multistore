"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { PLATFORMS } from "@/lib/platforms";
import { PageContent } from "@/ui/layout/page-content";
import Link from "next/link";
import useSWR from "swr";

interface StorePlatform {
  id: string;
  platform: string;
  label: string;
  url: string;
  isActive: boolean;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  platforms: StorePlatform[];
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function ProductsPageClient() {
  const { slug: workspaceSlug } = useWorkspace();
  const { data: products, isLoading } = useSWR<Product[]>(
    workspaceSlug ? `/api/products` : null,
    fetcher,
  );

  return (
    <PageContent
      title="Products"
      controls={
        <Link
          href={`/${workspaceSlug}/products/new`}
          className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          New Product
        </Link>
      }
    >
      <div className="px-3 py-4 sm:px-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-center">
            <p className="text-sm font-medium text-neutral-700">
              No products yet
            </p>
            <p className="text-sm text-neutral-500">
              Create your first product to get started
            </p>
            <Link
              href={`/${workspaceSlug}/products/new`}
              className="mt-1 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              New Product
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">
                    Name
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-neutral-600 sm:table-cell">
                    URL
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">
                    Platforms
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => {
                  const activePlatforms = product.platforms.filter(
                    (p) => p.isActive,
                  );
                  return (
                    <tr
                      key={product.id}
                      className="bg-white transition-colors hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-900">
                            {product.name}
                          </span>
                          <span className="text-xs text-neutral-500">
                            /{product.slug}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <a
                          href={`/p/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          /p/{product.slug}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {activePlatforms.slice(0, 3).map((p) => {
                            const config = PLATFORMS.find(
                              (pl) => pl.id === p.platform,
                            );
                            return (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                              >
                                {config?.logo && (
                                  <img
                                    src={config.logo}
                                    alt={p.label}
                                    className="h-3 w-3 object-contain"
                                  />
                                )}
                                {p.label}
                              </span>
                            );
                          })}
                          {activePlatforms.length > 3 && (
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                              +{activePlatforms.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/${workspaceSlug}/products/${product.slug}/edit`}
                          className="rounded-lg px-2 py-1 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContent>
  );
}
