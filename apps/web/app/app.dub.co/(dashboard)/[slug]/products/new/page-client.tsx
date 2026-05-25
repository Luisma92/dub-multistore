"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { PLATFORMS, PlatformId } from "@/lib/platforms";
import { PageContent } from "@/ui/layout/page-content";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PlatformEntry {
  platform: PlatformId | "";
  label: string;
  url: string;
  logoUrl: string;
  isActive: boolean;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewProductPageClient() {
  const { slug: workspaceSlug } = useWorkspace();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [platforms, setPlatforms] = useState<PlatformEntry[]>([
    { platform: "", label: "", url: "", logoUrl: "", isActive: true },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugTouched) {
      setSlug(slugify(val));
    }
  };

  const updatePlatform = (
    idx: number,
    field: keyof PlatformEntry,
    value: string | boolean,
  ) => {
    setPlatforms((prev) =>
      prev.map((p, i) => {
        if (i !== idx) return p;
        const updated = { ...p, [field]: value };
        // Auto-fill label from platform config
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
      { platform: "", label: "", url: "", logoUrl: "", isActive: true },
    ]);
  };

  const removePlatform = (idx: number) => {
    setPlatforms((prev) => prev.filter((_, i) => i !== idx));
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
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          platforms: validPlatforms.map((p, i) => ({
            platform: p.platform,
            label: p.label || p.platform,
            url: p.url,
            logoUrl: p.logoUrl || undefined,
            order: i,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to create product");
      }

      router.push(`/${workspaceSlug}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContent title="New Product" titleBackHref={`/${workspaceSlug}/products`}>
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
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="My Store"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center overflow-hidden rounded-lg border border-neutral-300 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500">
                  <span className="border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                    /p/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    required
                    placeholder="my-store"
                    className="flex-1 px-3 py-2 text-sm outline-none"
                  />
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
                  placeholder="A short description of your product"
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
                  placeholder="https://example.com/image.jpg"
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
                          placeholder="Buy on Amazon"
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
                          placeholder="https://amazon.com/dp/..."
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
                            value={p.logoUrl}
                            onChange={(e) =>
                              updatePlatform(idx, "logoUrl", e.target.value)
                            }
                            placeholder="https://example.com/logo.svg"
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

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
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
              {saving ? "Creating…" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </PageContent>
  );
}
