/**
 * Renders the short product story section on the landing page.
 *
 * @returns The about section.
 */
export function About(): JSX.Element {
  return (
    <section className="bg-slate-50 px-4 py-12 md:px-8 md:py-20" id="about">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-indigo-500">
            Σχετικά
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            Ψηφιακή γραμματεία τσέπης.
          </h2>
        </div>
        <div className="grid gap-6 text-base leading-relaxed text-slate-700 md:grid-cols-2">
          <p>
            Το Radevu φτιάχτηκε για επαγγελματίες που δεν θέλουν να μάθουν
            λογισμικό. Κουρείς, οδοντίατροι, δασκάλες, λογιστές, τεχνικοί -
            άνθρωποι που έχουν κουραστεί να χάνουν χρόνο σε τηλέφωνα και
            χαρτάκια. Σου δίνει μια απλή ψηφιακή γραμματεία τσέπης, χωρίς
            εκπτώσεις στο ποιοτικό αποτέλεσμα.
          </p>
          <p>
            Είναι φτιαγμένο τοπικά, στην Ελλάδα. Δεν είσαι νούμερο σε ένα
            εταιρικό σύστημα - αν χρειαστείς βοήθεια, μιλάς με τον άνθρωπο
            που το έφτιαξε. Στη δοκιμαστική περίοδο είναι δωρεάν για όλους,
            γιατί ο στόχος είναι να αποδειχθεί ότι λειτουργεί στην πράξη, όχι
            να εισπράξει.
          </p>
        </div>
      </div>
    </section>
  );
}
