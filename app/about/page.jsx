export const metadata = {
  title: "About Us | SAMBHAV UPSC",
  description:
    "Learn about SAMBHAV UPSC, an educational platform for UPSC aspirants.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f3] text-[#111111]">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-12">

        {/* Back */}
        <a
          href="/"
          className="inline-flex items-center rounded-full border border-[#dedbd2] bg-white px-4 py-2 text-sm font-semibold text-[#66615a] shadow-sm transition hover:border-[#b9a56d] hover:text-[#111111]"
        >
          ← Back to SAMBHAV UPSC
        </a>

        {/* Header */}
        <div className="mt-8 rounded-[28px] border border-[#e3dfd5] bg-white p-6 shadow-[0_12px_35px_rgba(0,0,0,0.05)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7a24]">
            SAMBHAV UPSC
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#111111] sm:text-5xl">
            About Us
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-[#66615a] sm:text-lg sm:leading-8">
            SAMBHAV UPSC is an educational platform designed to
            support UPSC aspirants with structured study resources,
            current affairs, previous year questions, practice,
            revision and AI-assisted learning tools.
          </p>
        </div>

        {/* Main Content */}
        <section className="mt-6 space-y-5">

          <div className="rounded-[24px] border border-[#e3dfd5] bg-white p-6 shadow-[0_8px_25px_rgba(0,0,0,0.035)] sm:p-7">
            <h2 className="text-xl font-black text-[#111111]">
              Our Platform
            </h2>

            <p className="mt-3 leading-7 text-[#66615a]">
              SAMBHAV UPSC brings important preparation resources
              together in one platform so that aspirants can
              organize their preparation and track their learning
              progress.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#e3dfd5] bg-white p-6 shadow-[0_8px_25px_rgba(0,0,0,0.035)] sm:p-7">
            <h2 className="text-xl font-black text-[#111111]">
              What We Provide
            </h2>

            <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#66615a]">
              <li>UPSC current affairs resources</li>
              <li>Previous Year Questions and practice</li>
              <li>Prelims and CSAT preparation support</li>
              <li>Mains answer-writing and evaluation tools</li>
              <li>Study material and revision resources</li>
              <li>Performance and preparation tracking</li>
              <li>AI-assisted educational tools</li>
            </ul>
          </div>

          <div className="rounded-[24px] border border-[#e3dfd5] bg-white p-6 shadow-[0_8px_25px_rgba(0,0,0,0.035)] sm:p-7">
            <h2 className="text-xl font-black text-[#111111]">
              Educational Purpose
            </h2>

            <p className="mt-3 leading-7 text-[#66615a]">
              SAMBHAV UPSC is intended for educational and
              examination-preparation purposes. Users are
              responsible for their own preparation and use of
              educational resources.
            </p>
          </div>

          {/* Contact */}
          <div className="rounded-[24px] border border-[#e3dfd5] bg-white p-6 shadow-[0_8px_25px_rgba(0,0,0,0.035)] sm:p-7">
            <h2 className="text-xl font-black text-[#111111]">
              Contact
            </h2>

            <p className="mt-3 leading-7 text-[#66615a]">
              For questions regarding SAMBHAV UPSC, please visit
              our Contact Us page.
            </p>

            <a
              href="/contact"
              className="mt-4 inline-flex rounded-xl bg-[#111111] px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition hover:bg-[#242424]"
            >
              Contact Us →
            </a>
          </div>

          {/* Contact & Legal */}
          <section className="rounded-[26px] border border-[#d8ccb0] bg-gradient-to-br from-[#f1eadb] via-[#eee6d2] to-[#e3dac1] p-6 shadow-[0_12px_32px_rgba(90,70,25,0.08)] sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#806425]">
              Contact & Legal
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111111]">
              SAMBHAV UPSC
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6f685a]">
              Official platform information and customer support.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-[#d8ccb0] bg-white/65 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#888174]">
                  Legal Name
                </p>
                <p className="mt-1.5 break-words text-sm font-bold text-[#222222]">
                  AMAN SRIVASTAVA
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8ccb0] bg-white/65 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#888174]">
                  Customer Support
                </p>
                <p className="mt-1.5 break-words text-sm font-bold text-[#222222]">
                  amanshrivastava9140@gmail.com
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8ccb0] bg-white/65 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#888174]">
                  Phone
                </p>
                <p className="mt-1.5 text-sm font-bold text-[#222222]">
                  +91 9140302792
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8ccb0] bg-white/65 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#888174]">
                  Official Telegram
                </p>

                <p className="mt-1.5 text-sm font-bold text-[#222222]">
                  @SAMBHAVUPSC1
                </p>

                <a
                  href="https://t.me/SAMBHAVUPSC1"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-xs font-black text-[#111111] underline underline-offset-4"
                >
                  Join Official Channel →
                </a>
              </div>

            </div>

            <div className="mt-4 border-t border-[#d8ccb0] pt-4 text-xs leading-6 text-[#6f685a]">
              SAMBHAV UPSC is an online UPSC preparation platform providing
              Current Affairs, PYQ-based practice, Prelims practice, Mains answer
              writing and AI-assisted learning resources.
            </div>
          </section>

        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-[#dedbd2] pt-7 text-sm text-[#77716a]">
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <a
              href="/about"
              className="font-semibold hover:text-[#111111]"
            >
              About
            </a>

            <a
              href="/contact"
              className="font-semibold hover:text-[#111111]"
            >
              Contact
            </a>

            <a
              href="/pricing"
              className="font-semibold hover:text-[#111111]"
            >
              Pricing
            </a>

            <a
              href="/privacy"
              className="font-semibold hover:text-[#111111]"
            >
              Privacy Policy
            </a>

            <a
              href="/terms"
              className="font-semibold hover:text-[#111111]"
            >
              Terms & Conditions
            </a>

            <a
              href="/refund"
              className="font-semibold hover:text-[#111111]"
            >
              Refund & Cancellation
            </a>
          </div>

          <p className="mt-5 text-xs text-[#99938b]">
            © {new Date().getFullYear()} SAMBHAV UPSC. All rights
            reserved.
          </p>
        </footer>

      </div>
    </main>
  );
}
