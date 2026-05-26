/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL('https://kunalbhatia.dev/**'),
      new URL('http://localhost:4444/**'),
      new URL('https://crm-api.kunalbhatia.dev/**'),
      new URL('https://crm-api.kunalbhatia.dev/public/**'),
      new URL('https://crm.kunalbhatia.dev/**'),
      new URL('https://crm.kunalbhatia.dev/public/**'),
      new URL('https://crm.totemservices.org/**'),
      new URL('https://crm.totemservices.org/public/**'),
    ],
  },
};

export default nextConfig;
