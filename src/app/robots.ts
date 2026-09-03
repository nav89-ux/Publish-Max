import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/tracks/public-track";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/profile/", "/embed/", "/share/"],
      disallow: ["/dashboard", "/settings/", "/api/", "/auth/"],
    },
    host: getPublicAppUrl(),
  };
}
