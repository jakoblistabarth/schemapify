"use client";

import dynamic from "next/dynamic";

/**
 * Client-side-only wrapper for DcelViewer.
 * Uses ssr: false because DcelViewer renders a Canvas/WebGL component (deck.gl)
 * that relies on browser-only APIs unavailable in Node.js.
 */
const DynamicDcelViewer = dynamic(() => import("./DcelViewer"), { ssr: false });

export default DynamicDcelViewer;
