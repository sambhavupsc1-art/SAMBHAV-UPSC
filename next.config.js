/** @type {import('next').NextConfig} */

const nextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "@napi-rs/canvas",
    "pdfjs-dist",
  ],
};

module.exports = nextConfig;
