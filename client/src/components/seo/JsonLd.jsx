/**
 * Structured data for the public pages.
 *
 * Server component on purpose — the JSON must be present in the initial HTML
 * for crawlers that do not execute scripts.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crm.totemservices.org";

/** The author entity, referenced by every other block via @id. */
export const AUTHOR = {
  "@type": "Person",
  "@id": "https://kunalbhatia.in/#person",
  name: "Kunal Bhatia",
  url: "https://kunalbhatia.in",
  jobTitle: "Software Engineer & Backend Developer",
  description:
    "Backend developer and API architect based in India, building AI-powered products and cloud-native systems.",
  address: { "@type": "PostalPlace", addressCountry: "IN" },
  worksFor: { "@type": "Organization", name: "CodeFlixLabs" },
  knowsAbout: [
    "Backend Development", "API Architecture", "Cloud & DevOps",
    "AI & ML Products", "Full-Stack Applications",
  ],
  sameAs: [
    "https://kunalbhatia.in",
    "https://www.linkedin.com/in/kunalbhatia2601/",
    "https://github.com/kunalbhatia2601",
  ],
};

function Script({ data }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is generated here, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Landing page graph: the product, the organisation behind it, and its author.
 *
 * @param {string} siteName
 * @param {string} logo
 * @param {string} description
 */
export function SiteJsonLd({ siteName, logo, description }) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      AUTHOR,
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: siteName,
        url: SITE_URL,
        ...(logo ? { logo: { "@type": "ImageObject", url: logo } } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: siteName,
        description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        creator: { "@id": AUTHOR["@id"] },
      },
      {
        "@type": "SoftwareApplication",
        name: siteName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description,
        author: { "@id": AUTHOR["@id"] },
        creator: { "@id": AUTHOR["@id"] },
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
    ],
  };
  return <Script data={graph} />;
}

/**
 * A single open role. JobPosting is one of the few schema types Google surfaces
 * as a dedicated result, so it is worth filling in properly.
 *
 * @param {object} job
 * @param {string} siteName
 * @param {string} logo
 */
export function JobPostingJsonLd({ job, siteName, logo }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    datePosted: job.createdAt,
    // Prisma JobType values already match schema.org's employmentType tokens.
    employmentType: job.type || "FULL_TIME",
    // REMOTE roles must say so explicitly or Google filters them out of the
    // remote-jobs surface.
    ...(job.workMode === "REMOTE" ? { jobLocationType: "TELECOMMUTE" } : {}),
    ...(job.salaryRange ? { baseSalary: { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", value: job.salaryRange } } } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: siteName,
      sameAs: SITE_URL,
      ...(logo ? { logo } : {}),
    },
    ...(job.workMode === "REMOTE"
      ? { applicantLocationRequirements: { "@type": "Country", name: "India" } }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location || "India",
              addressCountry: "IN",
            },
          },
        }),
    ...(job.department ? { occupationalCategory: job.department } : {}),
    directApply: true,
    url: `${SITE_URL}/careers/${job.slug}`,
  };
  return <Script data={data} />;
}
