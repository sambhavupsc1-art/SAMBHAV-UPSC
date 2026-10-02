export const metadata = {
  title: "About Us | SAMBHAV UPSC",
  description:
    "Learn about SAMBHAV UPSC, an educational platform for UPSC aspirants.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <a
          href="/"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to SAMBHAV UPSC
        </a>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            SAMBHAV UPSC
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            About Us
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            SAMBHAV UPSC is an educational platform designed to
            support UPSC aspirants with structured study resources,
            current affairs, previous year questions, practice,
            revision and AI-assisted learning tools.
          </p>
        </div>

        <section className="mt-10 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold">
              Our Platform
            </h2>
            <p className="mt-3 leading-7 text-slate-300">
              SAMBHAV UPSC brings important preparation resources
              together in one platform so that aspirants can
              organize their preparation and track their learning
              progress.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">
              What We Provide
            </h2>

            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-300">
              <li>UPSC current affairs resources</li>
              <li>Previous Year Questions and practice</li>
              <li>Prelims and CSAT preparation support</li>
              <li>Mains answer-writing and evaluation tools</li>
              <li>Study material and revision resources</li>
              <li>Performance and preparation tracking</li>
              <li>AI-assisted educational tools</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">
              Educational Purpose
            </h2>
            <p className="mt-3 leading-7 text-slate-300">
              SAMBHAV UPSC is intended for educational and
              examination-preparation purposes. Users are
              responsible for their own preparation and use of
              educational resources.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">
              Contact
            </h2>
            <p className="mt-3 text-slate-300">
              For questions regarding SAMBHAV UPSC, please visit
              our Contact Us page.
            </p>

            <a
              href="/contact"
              className="mt-4 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
            >
              Contact Us
            </a>
          </div>
        </section>

        <footer className="mt-16 border-t border-slate-800 pt-8 text-sm text-slate-400">
          <div className="flex flex-wrap gap-4">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/pricing">Pricing</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
            <a href="/refund">Refund & Cancellation</a>
          </div>

          <p className="mt-5">
            © {new Date().getFullYear()} SAMBHAV UPSC. All rights
            reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
