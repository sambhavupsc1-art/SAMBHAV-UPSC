export const metadata = {
  title: "Terms & Conditions | SAMBHAV UPSC",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <a href="/" className="text-sm text-slate-400">
          ← Back to SAMBHAV UPSC
        </a>

        <h1 className="mt-10 text-4xl font-bold">
          Terms & Conditions
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Last updated: October 2026
        </p>

        <div className="mt-10 space-y-8 leading-7 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white">
              1. Use of the Platform
            </h2>
            <p className="mt-3">
              SAMBHAV UPSC provides educational and examination
              preparation resources. Users must use the platform
              only for lawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              2. Account Access
            </h2>
            <p className="mt-3">
              Access to the platform may require authentication and,
              where applicable, administrative approval. Users must
              provide accurate information associated with their
              account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              3. Premium Subscription
            </h2>
            <p className="mt-3">
              Premium features are available according to the
              selected subscription plan and its applicable
              validity period. Subscription access may expire,
              become inactive or be cancelled according to these
              terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              4. Payments
            </h2>
            <p className="mt-3">
              Payments are processed through the payment gateway
              available on the platform. A subscription is activated
              only after successful payment verification by the
              system.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              5. Educational Content
            </h2>
            <p className="mt-3">
              Educational resources are provided to support
              examination preparation. SAMBHAV UPSC does not
              guarantee any examination result, rank, selection or
              employment outcome.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              6. Prohibited Use
            </h2>
            <p className="mt-3">
              Users must not attempt to bypass authentication,
              payment controls, security restrictions or access
              another user's account or information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              7. Changes
            </h2>
            <p className="mt-3">
              These terms may be updated when necessary. Continued
              use of the platform after an update may be subject to
              the revised terms.
            </p>
          </section>
        </div>

        <footer className="mt-16 border-t border-slate-800 pt-8 text-sm text-slate-400">
          <div className="flex flex-wrap gap-4">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/pricing">Pricing</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
            <a href="/refund">Refund & Cancellation</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
