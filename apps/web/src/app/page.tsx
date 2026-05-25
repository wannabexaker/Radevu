import { About } from "@/components/landing/About";
import { Contact } from "@/components/landing/Contact";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Showcase } from "@/components/landing/Showcase";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<JSX.Element> {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Features />
        {await Showcase()}
        <Contact />
      </main>
      <Footer />
    </>
  );
}
