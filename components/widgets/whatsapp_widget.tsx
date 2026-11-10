
"use client";

import { useState } from "react";

const whatsappNumber = "12468391078";
const whatsappMessage =
  "Hi, I'd like to enquire about booking a massage at Restoration Refuge.";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className="flex flex-col items-end gap-3">
      {isOpen && (
        <div
          id="whatsapp-popup"
          className="w-[min(320px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl shadow-slate-900/15"
        >
          <div className="bg-purple-800 px-5 py-4 text-white">
            <p className="font-semibold">Restoration Refuge</p>
            <p className="mt-1 text-sm text-purple-100">
              Need help booking?
            </p>
          </div>

          <div className="p-5">
            <p className="text-sm leading-6 text-slate-600">
              Have a question about our massage services or appointment
              availability? Send us a message on WhatsApp.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <span aria-hidden="true">☏</span>
              Message us on WhatsApp
            </a>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close WhatsApp contact" : "Contact us on WhatsApp"}
        aria-expanded={isOpen}
        aria-controls="whatsapp-popup"
        title="Contact us on WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-900/20 transition hover:-translate-y-1 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        {/* Existing WhatsApp SVG */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
        >
          <path d="M20.52 3.48A11.78 11.78 0 0 0 12.13 0C5.56 0 .22 5.34.22 11.91c0 2.1.55 4.16 1.6 5.98L.12 24l6.26-1.64a11.9 11.9 0 0 0 5.74 1.46h.01c6.56 0 11.9-5.34 11.9-11.91 0-3.18-1.24-6.17-3.51-8.43ZM12.13 21.8a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.72.97.99-3.63-.24-.37a9.87 9.87 0 0 1-1.52-5.26c0-5.47 4.45-9.92 9.91-9.92a9.85 9.85 0 0 1 7.02 2.91 9.85 9.85 0 0 1 2.9 7.02c0 5.47-4.45 9.92-9.92 9.92Zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.28.3-1.05 1.02-1.05 2.49s1.08 2.89 1.23 3.09c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
        </svg>
      </button>
    </div>
  );
}
