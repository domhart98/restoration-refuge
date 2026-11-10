
"use client";

import { useState } from "react";
import SiteNavigation from "@/components/site_navigation";
import FloatingActions from "@/components/floating_actions";
import AppToaster from "@/components/toaster";
import Footer from "@/components/footer";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <SiteNavigation
        expanded={expanded}
        onExpandedChange={setExpanded}
      />

      <div
        className={`min-h-screen transition-[margin-left] duration-300 ease-in-out ${
          expanded ? "md:ml-60" : "md:ml-20"
        }`}
      >
        {children}
        <Footer />
      </div>

      <FloatingActions className="sm:hidden" />
      <AppToaster />
    </>
  );
}
