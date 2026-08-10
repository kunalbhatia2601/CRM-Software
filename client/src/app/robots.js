const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crm.totemservices.org";

/**
 * Only the marketing page and the public careers pages should be indexed.
 * Everything behind a login is noise at best and a privacy leak at worst.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/careers", "/careers/"],
        disallow: [
          "/owner/", "/admin/", "/sales/", "/accounts/",
          "/finance/", "/hr/", "/employee/", "/client/",
          "/login", "/maintenance", "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
