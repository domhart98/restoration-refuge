"use client";

import { useState } from "react";
import { House, Sparkles, Heart, Mail, Menu, X, ChevronLeft, ChevronRight, Plus} from "lucide-react";

const navigationLinks = [
  { label: "Home", href: "/", icon: House },
  { label: "Services", href: "/services", icon: Sparkles },
  { label: "About", href: "/about", icon: Heart },
  { label: "Contact", href: "/contact", icon: Mail },
];

export default function SiteNavigation({
  expanded,
  onExpandedChange,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-purple-100 bg-white shadow-sm transition-[width] duration-300 ease-in-out md:flex ${
          expanded ? "w-60" : "w-20"
        }`}
      >
        <div
          className={`flex min-h-36 flex-col items-center border-b border-purple-100 ${
            expanded ? "justify-between gap-2 px-3 py-4" : "justify-center px-2"
          }`}
        >
          {expanded && (
          <a
            href="/"
            aria-label="Restoration Refuge home"
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <img
              src="/icons/rr_logo_transparent.webp"
              alt="Restoration Refuge Logo"
              className="h-10 w-full object-contain"
            />
            <span className="min-w-0 text-center">
              <span className="block text-sm font-semibold leading-tight text-purple-950">
                Restoration Refuge
              </span>
              <span className="mt-1 block text-[9px] tracking-[0.15em] text-slate-500">
                MASSAGE STUDIO
              </span>
            </span>
          </a>
          )}

          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expanded}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-purple-800 transition hover">
        
           {expanded ? <ChevronLeft size={20} /> : <Menu size={20} />}

          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {navigationLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              title={expanded ? undefined : link.label}
              className={`flex h-12 items-center overflow-hidden rounded-xl text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-purple-50 hover:text-purple-800 ${
                expanded ? "gap-3 px-3" : "justify-center"
              }`}
            >
              <span className="flex w-7 shrink-0 items-center justify-center text-purple-700">
                <link.icon size={20} strokeWidth={1.8} />
              </span>

              <span
                className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200 ease-in-out ${
                  expanded
                    ? "max-w-40 opacity-100 delay-100"
                    : "pointer-events-none max-w-0 opacity-0"
                }`}
              >
                {link.label}
              </span>
            </a>

        ))}

        </nav>

        <div className="border-t border-purple-100 p-3">
          <a
            href="/book"
            title={expanded ? undefined : "Book an appointment"}
            className={`flex min-h-12 items-center justify-center overflow-hidden rounded-xl bg-purple-700 text-sm font-semibold text-white transition-colors hover:bg-purple-800 ${
                expanded ? "gap-2 px-3" : "mx-auto w-12"
            }`}
          >
            <span className="text-lg">
              <Plus size={20} />
            </span>
            {expanded && <span>Book Appointment</span>}
          </a>

          {expanded && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Relax. Restore. Refocus.
            </p>
          )}
        </div>
      </aside>

      {/* Mobile navigation */}
      <header className="sticky top-0 z-50 border-b border-purple-100 bg-white/95 backdrop-blur md:hidden">
        <div className="flex min-h-24 items-center justify-between gap-3 px-4">
          <a
            href="/"
            aria-label="Restoration Refuge Home"
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <img
              src="/icons/rr_logo_transparent.webp"
              alt="Restoration Refuge Logo"
              className="h-9 w-full max-w-44 object-contain"
            />

            <span className="text-center">
              <span className="block text-sm font-semibold leading-tight text-purple-950">
                Restoration Refuge
              </span>
              <span className="mt-0.5 block text-[9px] tracking-[0.15em] text-slate-500">
                MASSAGE STUDIO
              </span>
            </span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100 text-xl text-purple-900 transition hover:bg-purple-50"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="space-y-1 border-t border-purple-100 bg-white px-4 py-3">
            {navigationLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-800"
              >
                <span className="flex w-6 shrink-0 items-center justify-center text-purple-700">
                  <link.icon size={19} strokeWidth={1.8} />
                </span>
                {link.label}
              </a>
            ))}

            <a
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white transition hover:bg-purple-800"
            >
              Book an Appointment
            </a>
          </nav>
        )}
      </header>
    </>
  );
}