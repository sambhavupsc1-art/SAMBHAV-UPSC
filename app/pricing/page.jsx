export const metadata = {
  title: "Pricing | SAMBHAV UPSC",
  description: "SAMBHAV UPSC Premium plans and pricing.",
};

const plans = [
  {
    name: "2-Day Demo",
    price: "₹0",
    duration: "2 Days",
  },
  {
    name: "Monthly",
    price: "₹99",
    duration: "30 Days",
  },
  {
    name: "Quarterly",
    price: "₹399",
    duration: "90 Days",
  },
  {
    name: "Annual",
    price: "₹999",
    duration: "365 Days",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <a
          href="/"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to SAMBHAV UPSC
        </a>

        <div className="mt-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            SAMBHAV UPSC
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Premium Plans
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Choose a plan according to your UPSC preparation
            requirements.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <h2 className="text-xl font-semibold">
                {plan.name}
              </h2>

              <p className="mt-6 text-4xl font-bold">
                {plan.price}
              </p>

              <p className="mt-2 text-slate-400">
                {plan.duration}
              </p>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-sm text-slate-300">
                  Access to applicable SAMBHAV UPSC Premium
                  features.
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          Premium access is subject to the applicable subscription
          terms and successful payment verification.
        </p>

        <footer className="mt-16 border-t border-slate-800 pt-8 text-sm text-slate-400">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/pricing">Pricing</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
            <a href="/refund">Refund & Cancellation</a>
          </div>

          <p className="mt-5 text-center">
            © {new Date().getFullYear()} SAMBHAV UPSC. All rights
            reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
