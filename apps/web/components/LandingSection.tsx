import { CardSpotlightSection } from "@/src/components/ui/CardSpotlightSection";
import FaqSection from "@/src/components/ui/FaqSection";
import { GlowingEffectDemoSecond } from "@/src/components/ui/GlowingEffect";
import PriceCards from "@/src/components/ui/PriceCards";


export default function LandingSection() {
    return (
        <section>
            <section className="relative isolate bg-black py-32">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-black to-transparent" />

                <div className="relative z-20 mx-auto max-w-7xl px-6">
                    <GlowingEffectDemoSecond />
                </div>
            </section>

            <section className="mt-10 mb-16 md:mb-24">
                <CardSpotlightSection />
            </section>

            <FaqSection />

            <PriceCards />

        </section>
    )
}