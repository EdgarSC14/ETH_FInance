"use client";

import dynamic from "next/dynamic";
import { PageShell } from "@/components/ui/PageShell";

const HomePageClient = dynamic(() => import("./HomePageClient"), {
  ssr: false,
  loading: () => <PageShell />,
});

export default function HomePageLoader() {
  return <HomePageClient />;
}
