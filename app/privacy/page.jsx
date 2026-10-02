export const metadata = {
  title: "Privacy Policy | SAMBHAV UPSC",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <a href="/" className="text-sm text-slate-400">
          ← Back to SAMBHAV UPSC
        </a>

        <h1 className="mt-10 text-4xl font-bold">
          Privacy Policy
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Last updated: October 2026
        </p>

        <div className="mt-10 space-y-8 leading-7 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white">
              1. Information We Collect
            </h2>
            <p className="mt-3">
              SAMBHAV UPSC may collect information required to
              create and operate your account, provide educational
              services, process subscriptions and provide customer
              support.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              2. Account Information
            </h2>
            <p className="mt-3">
              Depending on the authentication method used, account
              information may include your name, email address,
              Telegram account information and information required
              to maintain your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              3. Payment Information
            </h2>
            <p className="mt-3">
              Payments are processed through our payment service
              provider. SAMBHAV UPSC does not intentionally store
              complete card, UPI or banking credentials on its own
              servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              4. Use of Information
            </h2>
            <p className="mt-3">
              Information may be used to provide and maintain the
              service, authenticate users, manage subscriptions,
              process payments, provide support, improve the
              platform and maintain security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              5. Data Security
            </h2>
            <p className="mt-3">
              Reasonable technical and organizational measures are
              used to protect account and service information.
              However, no internet-based service can guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              6. Third-Party Services
            </h2>
            <p className="mt-3">
              SAMBHAV UPSC may use third-party services for
              authentication, hosting, analytics, AI functionality
              and payment processing. Such services may process
              information according to their respective policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              7. Contact
            </h2>
            <p className="mt-3">
              For privacy-related questions, please contact
              SAMBHAV UPSC through our support channel.
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
