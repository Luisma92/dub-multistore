"use client";

import { PLATFORMS } from "@/lib/platforms";

interface PlatformButtonProps {
  productSlug: string;
  platform: string;
  label: string;
  url: string;
  logoUrl?: string | null;
}

export function PlatformButton({
  productSlug,
  platform,
  label,
  url,
  logoUrl,
}: PlatformButtonProps) {
  const platformConfig = PLATFORMS.find((p) => p.id === platform);
  const logoSrc =
    platform === "custom" && logoUrl
      ? logoUrl
      : platformConfig?.logo ?? null;
  const accentColor = platformConfig?.color ?? "#6b7280";

  const handleClick = async () => {
    // Fire-and-forget click tracking
    void fetch(`/api/products/${productSlug}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    }).catch(() => {
      // silently swallow errors
    });
    window.location.href = url;
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-left transition-all hover:border-neutral-300 hover:shadow-sm active:scale-[0.99]"
      style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={label}
          className="h-6 w-6 shrink-0 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className="h-6 w-6 shrink-0 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <span className="font-medium text-neutral-800">{label}</span>
      <svg
        className="ml-auto h-4 w-4 shrink-0 text-neutral-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}
