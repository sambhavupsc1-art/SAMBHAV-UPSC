export const metadata = {
  title: "Contact Us | SAMBHAV UPSC",
  description: "Contact SAMBHAV UPSC for support and queries.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <a
          href="/"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to SAMBHAV UPSC
        </a>

        <h1 className="mt-10 text-4xl font-bold">
          Contact Us
        </h1>

        <p className="mt-5 leading-8 text-slate-300">
          If you have a question about SAMBHAV UPSC, your
          subscription, payment, account or any technical issue,
          you can contact our support team.
        </p>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">
            Customer Support
          </h2>

          <p className="mt-4 leading-7 text-slate-300">
            For support related to your SAMBHAV UPSC account,
            Premium subscription or payments, please contact us
            through the support channel provided on the platform.
          </p>

          <p className="mt-4 text-slate-300">
            We aim to respond to support requests as soon as
            reasonably possible.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">
            Payment Support
          </h2>

          <p className="mt-3 leading-7 text-slate-300">
            For a payment-related issue, please keep your order ID
            or payment reference available when contacting support.
            This helps us investigate the transaction.
          </p>
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
