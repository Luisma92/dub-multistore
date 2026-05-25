"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { PLATFORMS, PlatformId } from "@/lib/platforms";
import { PageContent } from "@/ui/layout/page-content";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

interface StorePlatform {
  id: string;
  platform: string;
  label: string;
  url: string;
  logoUrl: string | null;
  order: number;
  isActive: boolean;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  platforms: StorePlatform[];
}

interface PlatformEntry extends Omit<StorePlatform, "id"> {
  _id?: string; // keep original id for updates
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function EditProductPageClient() {
  const { slug: workspaceSlug, id: workspaceId } = useWorkspace();
  const { productSlug } = useParams<{ productSlug: string }>();
  const router = useRouter();

  const { data: product, isLoading } = useSWR<Product>(
    productSlug ? `/api/products/${productSlug}` : null,
    fetcher,
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [platforms, setPlatforms] = useState<PlatformEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Populate form once data loads
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setImageUrl(product.imageUrl ?? "");
      setPlatforms(
        product.platforms.map((p) => ({
          _id: p.id,
          platform: p.platform,
          label: p.label,
          url: p.url,
          logoUrl: p.logoUrl,
          order: p.order,
          isActive: p.isActive,
        })),
      );
    }
  }, [product]);

  const updatePlatform = (
    idx: number,
    field: keyof PlatformEntry,
    value: string | boolean | number,
  ) => {
    setPlatforms((prev) =>
      prev.map((p, i) => {
        if (i !== idx) return p;
        const updated = { ...p, [field]: value };
        if (field === "platform" && typeof value === "string") {
          const config = PLATFORMS.find((pl) => pl.id === value);
          if (config && !p.label) {
            updated.label = config.label;
          }
        }
        return updated;
      }),
    );
  };

  const addPlatform = () => {
    setPlatforms((prev) => [
      ...prev,
      {
        platform: "",
        label: "",
        url: "",
        logoUrl: null,
        order: prev.length,
        isActive: true,
      },
    ]);
  };

  const removePlatform = (idx: number) => {
    setPlatforms((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, order: i })),
    );
  };

  const movePlatform = (idx: number, direction: "up" | "down") => {
    setPlatforms((prev) => {
      const next = [...prev];
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((p, i) => ({ ...p, order: i }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validPlatforms = platforms.filter((p) => p.platform && p.url);
    if (validPlatforms.length === 0) {
      setError("At least one platform with a URL is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productSlug}?workspaceId=${workspaceId}`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          platforms: validPlatforms.map((p, i) => ({
            platform: p.platform,
            label: p.label || p.platform,
            url: p.url,
            logoUrl: p.logoUrl || undefined,
            order: i,
            isActive: p.isActive,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to update product");
      }

      router.push(`/${workspaceSlug}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productSlug}?workspaceId=${workspaceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      router.push(`/${workspaceSlug}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContent title="Edit Product">
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
        </div>
      </PageContent>
    );
  }

  if (!product) {
    return (
      <PageContent title="Edit Product">
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-neutral-500">Product not found.</p>
        </div>
      </PageContent>
    );
  }

  return (
    <PageContent
      title="Edit Product"
      titleBackHref={`/${workspaceSlug}/products`}
    >
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">
              Product Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Slug
                </label>
                <div className="flex items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                  /p/{productSlug}
                  <span className="ml-2 text-xs text-neutral-400">
                    (cannot be changed)
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                />
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">
              Platforms <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-3">
              {platforms.map((p, idx) => {
                const config = PLATFORMS.find((pl) => pl.id === p.platform);
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    {/* Reorder buttons */}
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-xs font-medium text-neutral-500">
                        Platform {idx + 1}
                      </span>
                      <div className="ml-auto flex gap-1">
                        <button
                          type="button"
                          onClick={() => movePlatform(idx, "up")}
                          disabled={idx === 0}
                          className="rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => movePlatform(idx, "down")}
                          disabled={idx === platforms.length - 1}
                          className="rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">
                          Platform
                        </label>
                        <div className="flex items-center gap-2">
                          {config?.logo && (
                            <img
                              src={config.logo}
                              alt={config.label}
                              className="h-5 w-5 shrink-0 object-contain"
                            />
                          )}
                          <select
                            value={p.platform}
                            onChange={(e) =>
                              updatePlatform(idx, "platform", e.target.value)
                            }
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                          >
                            <option value="">Select platform…</option>
                            {PLATFORMS.map((pl) => (
                              <option key={pl.id} value={pl.id}>
                                {pl.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">
                          Label
                        </label>
                        <input
                          type="text"
                          value={p.label}
                          onChange={(e) =>
                            updatePlatform(idx, "label", e.target.value)
                          }
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-neutral-600">
                          URL
                        </label>
                        <input
                          type="url"
                          value={p.url}
                          onChange={(e) =>
                            updatePlatform(idx, "url", e.target.value)
                          }
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                        />
                      </div>

                      {p.platform === "custom" && (
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-neutral-600">
                            Custom Logo URL
                          </label>
                          <input
                            type="url"
                            value={p.logoUrl ?? ""}
                            onChange={(e) =>
                              updatePlatform(idx, "logoUrl", e.target.value)
                            }
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={p.isActive}
                          onChange={(e) =>
                            updatePlatform(idx, "isActive", e.target.checked)
                          }
                          className="rounded"
                        />
                        Active
                      </label>
                      {platforms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlatform(idx)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addPlatform}
                className="w-full rounded-lg border border-dashed border-neutral-300 py-2 text-sm text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-800"
              >
                + Add Platform
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Are you sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Delete Product
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(`/${workspaceSlug}/products`)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </PageContent>
  );
}
