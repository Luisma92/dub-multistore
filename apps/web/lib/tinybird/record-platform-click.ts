export type ClickEventData = {
  productId: string;
  productSlug: string;
  platform: string;
  country: string;
  deviceType: string;
  referrer: string;
};

export function recordPlatformClick(data: ClickEventData): void {
  if (!process.env.TINYBIRD_API_URL || !process.env.TINYBIRD_API_KEY) {
    return;
  }

  void fetch(
    `${process.env.TINYBIRD_API_URL}/v0/events?name=platform_click_events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        product_id: data.productId,
        product_slug: data.productSlug,
        platform: data.platform,
        country: data.country,
        device_type: data.deviceType,
        referrer: data.referrer,
      }),
    },
  ).catch(() => {
    // fire-and-forget: silently swallow errors
  });
}
