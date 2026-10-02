export const metadata = {
  title: "Refund & Cancellation Policy | SAMBHAV UPSC",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <a href="/" className="text-sm text-slate-400">
          ← Back to SAMBHAV UPSC
        </a>

        <h1 className="mt-10 text-4xl font-bold">
          Refund & Cancellation Policy
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Last updated: October 2026
        </p>

        <div className="mt-10 space-y-8 leading-7 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white">
              1. Subscription Cancellation
            </h2>
            <p className="mt-3">
              Users may contact SAMBHAV UPSC support regarding
              subscription cancellation or payment-related issues.
              Cancellation does not automatically create an
              entitlement to a refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              2. Refund Requests
            </h2>
            <p className="mt-3">
              Refund requests are reviewed on a case-by-case basis
              based on the nature of the transaction, service
              delivery and applicable terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              3. Failed Payments
            </h2>
            <p className="mt-3">
              If a payment fails and no Premium subscription is
              activated, the transaction is handled according to
              the payment gateway's transaction status and
              applicable refund process.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              4. Duplicate Payments
            </h2>
            <p className="mt-3">
              If you believe you have been charged more than once
              for the same subscription, contact support with the
              relevant order or payment reference so the
              transaction can be reviewed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              5. Contact for Refund Requests
            </h2>
            <p className="mt-3">
              For refund or payment-related assistance, please
              contact SAMBHAV UPSC support and provide your order
              ID or payment reference.
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
