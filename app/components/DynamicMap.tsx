"use client";

import dynamic from "next/dynamic";

/**
 * Client-side-only wrapper for the Map component.
 * Uses dynamic import with ssr: false, which requires a Client Component in Next.js 16+.
 */
const DynamicMap = dynamic(() => import("./Map/Map"), { ssr: false });

export default DynamicMap;
