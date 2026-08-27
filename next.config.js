const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    return '';
  }
})();

// Content Security Policy. Next.js ships inline bootstrap scripts and styles,
// so 'unsafe-inline' is required for those to run; the rest is locked to this
// origin plus the two services the app actually talks to.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHost} https://api.stripe.com wss://*.supabase.co`.trim(),
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "form-action 'self'",
  // Belt and braces with X-Frame-Options below: nothing may embed this site,
  // so a transparent overlay can't trick a shopper into clicking "Pay".
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Ask browsers to keep using HTTPS for two years, including subdomains.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stops a browser from re-interpreting an upload as, say, HTML and running it.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak the full URL (which can carry ids) to third-party sites.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework version to anyone fingerprinting the stack.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
