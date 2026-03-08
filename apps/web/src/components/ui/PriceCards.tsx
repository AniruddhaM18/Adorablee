import { CardSpotlight } from "./card-spotlight";

export default function PriceCards() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-8 py-24">
      <h2 className="text-5xl font-bold text-gray-100 text-center mb-16">
        Choose your plan
      </h2>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* For Developers */}
        <CardSpotlight
          color="#404040" // neutral-500 spotlight
          className="bg-neutral-950 border-2 border-neutral-900 rounded-lg p-10 hover:border-gray-950 transition-colors"
        >
          <div className="inline-block bg-neutral-800 text-neutral-300 px-4 py-1.5 rounded-md text-sm font-medium mb-6">
            Available at no charge
          </div>

          <h3 className="text-3xl font-bold text-gray-100 mb-4">
            For developers
          </h3>

          <p className="text-gray-400 text-lg mb-8">
            Everything you need to build amazing applications with AI assistance.
          </p>

          <ul className="space-y-4 mb-8">
            {[
              "Unlimited AI completions",
              "Built-in AI chat",
              "All language support",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-neutral-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>

          <button className="relative z-10 w-full bg-neutral-300 text-black py-4 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Get started
          </button>
        </CardSpotlight>

        {/* For Organizations */}
        <CardSpotlight
          color="#525252" // neutral-600 spotlight (slightly stronger)
          className="bg-neutral-950 border-2 border-neutral-900 rounded-lg p-10 hover:border-gray-950 transition-colors"
        >
          <div className="inline-block bg-neutral-800 text-neutral-300 px-4 py-1.5 rounded-md text-sm font-medium mb-6">
            Coming soon
          </div>

          <h3 className="text-3xl font-bold text-gray-100 mb-4">
            For organizations
          </h3>

          <p className="text-gray-400 text-lg mb-8">
            Advanced features and controls for teams and enterprises.
          </p>

          <ul className="space-y-4 mb-8">
            {["Team collaboration", "Admin controls", "Priority support"].map(
              (item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-neutral-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{item}</span>
                </li>
              )
            )}
          </ul>

          <button className=" w-full bg-neutral-900 border border-neutral-800 text-gray-100 py-4 rounded-lg font-medium hover:bg-gray-700 transition-colors">
            Join waitlist
          </button>
        </CardSpotlight>
      </div>
    </section>
  );
}
