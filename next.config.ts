import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita confusión si hay otro package-lock en una carpeta padre (p. ej. el usuario home).
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,
};

export default nextConfig;
