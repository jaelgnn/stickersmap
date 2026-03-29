"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const HomePageClient = dynamic(() => import("@/components/HomePageClient"), {
  ssr: false,
});

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <HomePageClient />;
}