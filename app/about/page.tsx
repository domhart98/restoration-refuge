import SiteNavigation from "@/components/site_navigation";
import Footer from "@/components/footer";

export default function About() {
  return (
    <main className="min-h-screen bg-white pb-24 text-slate-800 md:pb-0">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-emerald-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-5 text-md font-semibold uppercase tracking-[0.25em] text-purple-700">
            About Restoration Refuge
          </p>

          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-purple-950 sm:text-5xl lg:text-6xl">
            A space to
            <span className="mt-2 block italic text-purple-700">
              restore and reconnect.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            At Restoration Refuge Massage Studio, we believe taking time for
            yourself is an important part of wellbeing. Our goal is to provide
            a welcoming space where you can relax, recharge, and focus on you.
          </p>

          <a
            href="/book"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-purple-700 px-7 py-3 font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Book Your Massage
          </a>
        </div>
      </section>

      {/* About introduction */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Our approach
            </p>

            <h2 className="mt-4 font-serif text-3xl leading-snug text-purple-950 md:text-4xl">
              Your wellbeing matters.
            </h2>

            <p className="mt-6 leading-7 text-slate-600">
              Everyday life can be demanding. Massage offers an opportunity to
              slow down, release tension, and make time for your physical and
              mental wellbeing.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              We offer a range of massage treatments to help you find an
              experience suited to your needs, preferences, and lifestyle.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-purple-200/40 blur-2xl" />

            <img
              src="/images/oil-massage.webp"
              alt="A peaceful massage treatment room"
              className="relative h-72 w-full rounded-[2rem] object-cover shadow-xl sm:h-96"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-purple-50/70 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-700">
              What matters to us
            </p>

            <h2 className="mt-3 font-serif text-3xl text-purple-950 md:text-4xl">
              Your time. Your comfort. Your wellbeing.
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              We want every visit to feel like an opportunity to step away
              from the everyday and focus on yourself.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <article className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <span className="text-3xl text-purple-700" aria-hidden="true">
                ✧
              </span>

              <h3 className="mt-4 text-xl font-semibold text-purple-950">
                Personalised Care
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Choose a massage treatment and duration that suits your
                preferences.
              </p>
            </article>

            <article className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <span className="text-3xl text-purple-700" aria-hidden="true">
                ♡
              </span>

              <h3 className="mt-4 text-xl font-semibold text-purple-950">
                Relax & Restore
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Make space in your routine for relaxation and recovery.
              </p>
            </article>

            <article className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <span className="text-3xl text-purple-700" aria-hidden="true">
                ◷
              </span>

              <h3 className="mt-4 text-xl font-semibold text-purple-950">
                Convenient Booking
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Browse treatments and request an appointment online.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 to-purple-600 px-8 py-12 text-center shadow-xl shadow-purple-200 md:px-16 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-200">
            Make time for yourself
          </p>

          <h2 className="mt-4 font-serif text-3xl text-white md:text-4xl">
            Your moment of restoration awaits.
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-purple-100">
            Explore our massage treatments and find a time that works for you.
          </p>

          <a
            href="/book"
            className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-semibold text-purple-800 transition hover:bg-purple-50"
          >
            Book an Appointment
          </a>
        </div>
      </section>
    </main>
  );
}