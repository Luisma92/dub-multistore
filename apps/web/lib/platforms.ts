export const PLATFORMS = [
  {
    id: "amazon",
    label: "Amazon",
    logo: "https://cdn.simpleicons.org/amazon",
    color: "#FF9900",
  },
  {
    id: "etsy",
    label: "Etsy",
    logo: "https://cdn.simpleicons.org/etsy",
    color: "#F16521",
  },
  {
    id: "shopify",
    label: "Shopify",
    logo: "https://cdn.simpleicons.org/shopify",
    color: "#7AB55C",
  },
  {
    id: "ebay",
    label: "eBay",
    logo: "https://cdn.simpleicons.org/ebay",
    color: "#E53238",
  },
  {
    id: "wallapop",
    label: "Wallapop",
    logo: "https://cdn.simpleicons.org/wallapop",
    color: "#13C1AC",
  },
  {
    id: "vinted",
    label: "Vinted",
    logo: "https://cdn.simpleicons.org/vinted",
    color: "#007782",
  },
  {
    id: "milanuncios",
    label: "Milanuncios",
    logo: "/icons/milanuncios.svg",
    color: "#E2001A",
  },
  {
    id: "custom",
    label: "Personalizado",
    logo: null,
    color: null,
  },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];
