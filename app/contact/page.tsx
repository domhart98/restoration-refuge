
import SiteNavigation from "@/components/site_navigation";
import ContactForm from "@/components/forms/contact_form";
import { Phone, Mail } from "lucide-react";


const phoneNumber = "+1 (246) 839-1078";
const phoneLink = "tel:+12468391078";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-emerald-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-5 text-md font-semibold uppercase tracking-[0.25em] text-purple-700">
            Restoration Refuge
          </p>

          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-purple-950 sm:text-5xl lg:text-6xl">
            Get In Touch
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Have a question about our treatments or need help with a booking?
            We would love to hear from you.
          </p>

          <a
            href="/book"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-purple-700 px-7 py-3 font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Book Your Massage
          </a>
        </div>
      </section>

      <section className="px-6 py-16 md:px-12 lg:px-20">
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Contact details */}
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm md:p-10">
              <h2 className="mb-6 font-serif text-2xl font-semibold text-purple-950">
                Let's Connect
              </h2>
              
              <p className="mb-10 text-md leading-6 text-slate-600">
                Your wellbeing matters. Reach out to us and let us help you
                find the right treatment for your needs. <span className="font-bold">Contact us via any 
                of the links below or send me a message using the form.</span>
              </p>

              
              <div className="space-y-5">
                {/* Phone */}
                <a
                  href="tel:+12468391078"
                  className="group flex items-center gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white transition group-hover:bg-purple-800">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Phone</p>
                    <p className="text-slate-700 transition group-hover:text-purple-700">
                      +1 (246) 839-1078
                    </p>
                  </div>
                </a>

                {/* Email */}
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="group flex items-center gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white transition group-hover:bg-purple-800">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Email</p>
                      <p className="break-all text-slate-700 transition group-hover:text-purple-700">
                        {contactEmail}
                      </p>
                    </div>
                  </a>
                )}

                {/* Instagram */}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white transition group-hover:bg-purple-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect width="20" height="20" x="2" y="2" rx="5" />
                        <circle cx="12" cy="12" r="4" />
                        <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Instagram</p>
                      <p className="text-slate-700 transition group-hover:text-purple-700">
                        Follow us on Instagram
                      </p>
                    </div>
                  </a>
                )}
              </div>

            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm md:p-10">
            <ContactForm/>
          </div>
        </div>

          
      </section>
    </main>
  );
}
