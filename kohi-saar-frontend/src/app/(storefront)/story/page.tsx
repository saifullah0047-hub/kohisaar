import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";

export default function StoryPage() {
  return <><Navbar /><main className="story-page"><section className="story-page__intro page-shell"><p className="eyebrow">THE KOHISAAR WAY</p><h1>Purity, presented with purpose.</h1><p>Kohisaar is built around a simple idea: authentic Himalayan Shilajit should be presented with care, clarity, and respect for its origin.</p></section><section className="story-page__closing page-shell"><p className="eyebrow">THE ORIGIN</p><h2>From the heart of the Himalayas.</h2><p>From sourcing to presentation, every detail is considered to keep the experience honest, refined, and rooted in the character of the mountains.</p><Link className="text-link" href="/shop">EXPLORE THE COLLECTION <span aria-hidden="true">→</span></Link></section></main><Footer /></>;
}
