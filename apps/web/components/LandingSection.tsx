import { CardSpotlightSection } from "@/src/components/ui/CardSpotlightSection";
import { GlowingEffectDemoSecond } from "@/src/components/ui/GlowingEffect";
import Highlight from "@/src/components/ui/Highlight";
import PriceCards from "@/src/components/ui/PriceCards";


export default function LandingSection() {
    return (
        <section>
            <Highlight />
            <section className="relative isolate bg-black py-32">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-black to-transparent" />

                <div className="relative z-20 mx-auto max-w-7xl px-6">
                    <GlowingEffectDemoSecond />
                </div>
            </section>

            <section className="mt-10">
                <CardSpotlightSection />
            </section>

            <PriceCards />

        </section>
    )
}