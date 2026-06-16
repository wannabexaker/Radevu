import { About } from "@/components/landing/About";
import { Contact } from "@/components/landing/Contact";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Showcase } from "@/components/landing/Showcase";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  return (
    <>
      <Header userType={user?.userType ?? null} />
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
