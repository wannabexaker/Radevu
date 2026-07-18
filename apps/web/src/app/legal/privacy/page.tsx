import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTROLLER_COUNTRY,
  LEGAL_CONTROLLER_NAME,
  LEGAL_RETENTION,
  LEGAL_SUPERVISORY_AUTHORITY,
  LEGAL_VERSIONS
} from "@radevu/shared";
import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalLayout,
  LegalList,
  LegalParagraph,
  LegalSection
} from "@/components/legal/LegalLayout";
import { formatLegalDate } from "@/lib/legal/format";

export const metadata: Metadata = {
  description:
    "Πώς το Radevu συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σου δεδομένα, και ποια δικαιώματα έχεις.",
  title: "Πολιτική Απορρήτου · Radevu"
};

type PurposeRow = {
  basis: string;
  data: string;
  purpose: string;
};

const purposes: PurposeRow[] = [
  {
    basis: "Εκτέλεση σύμβασης (άρθρο 6§1β ΓΚΠΔ)",
    data: "Όνομα, email, τηλέφωνο, κωδικός σε κρυπτογραφημένη μορφή",
    purpose: "Δημιουργία και λειτουργία του λογαριασμού σου"
  },
  {
    basis: "Εκτέλεση σύμβασης (άρθρο 6§1β ΓΚΠΔ)",
    data: "Όνομα, email ή τηλέφωνο, υπηρεσία, ημερομηνία και ώρα, μήνυμα προς την επιχείρηση",
    purpose: "Καταχώριση και διαχείριση του ραντεβού σου"
  },
  {
    basis: "Εκτέλεση σύμβασης (άρθρο 6§1β ΓΚΠΔ)",
    data: "Email, στοιχεία ραντεβού",
    purpose: "Email επιβεβαίωσης, υπενθύμισης και αλλαγών"
  },
  {
    basis: "Έννομο συμφέρον — ασφάλεια της υπηρεσίας (άρθρο 6§1στ ΓΚΠΔ)",
    data: "Διεύθυνση IP, user agent, ώρα, αποτέλεσμα προσπάθειας σύνδεσης",
    purpose: "Προστασία από κατάχρηση, spam και μη εξουσιοδοτημένη πρόσβαση"
  },
  {
    basis: "Νομική υποχρέωση & έννομο συμφέρον (άρθρα 6§1γ και 6§1στ ΓΚΠΔ)",
    data: "Ημερομηνία και ώρα αποδοχής, έκδοση κειμένων, IP, user agent",
    purpose: "Απόδειξη ότι αποδέχτηκες τους Όρους και την Πολιτική Απορρήτου"
  },
  {
    basis: "Έννομο συμφέρον — βελτίωση της υπηρεσίας (άρθρο 6§1στ ΓΚΠΔ)",
    data: "Ο όρος αναζήτησης, η κατηγορία, το πλήθος αποτελεσμάτων, IP",
    purpose:
      "Να βλέπουμε τι ψάχνει ο κόσμος στον κατάλογο και τι δεν βρίσκει"
  },
  {
    basis: "Συγκατάθεση (άρθρο 6§1α ΓΚΠΔ) — ανακαλείται ελεύθερα",
    data: "Email, όνομα",
    purpose: "Ενημερωτικά email για το Radevu, αν το έχεις επιλέξει"
  }
];

export default function PrivacyPage(): JSX.Element {
  return (
    <LegalLayout
      otherDocumentHref="/legal/terms"
      otherDocumentLabel="Διάβασε και τους Όρους Χρήσης →"
      title="Πολιτική Απορρήτου"
      updatedAt={formatLegalDate(LEGAL_VERSIONS.privacy)}
    >
      <LegalSection id="summary" title="Με δυο λόγια">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <LegalList
            items={[
              <>
                <strong>Δεν πουλάμε τα δεδομένα σου.</strong> Ποτέ, σε κανέναν.
              </>,
              <>
                Δεν τα δίνουμε σε τρίτους για διαφήμιση και δεν κάνουμε προφίλ
                συμπεριφοράς.
              </>,
              <>
                Τα χρησιμοποιούμε μόνο για να λειτουργεί η υπηρεσία: να κλείνεις
                ραντεβού και να ενημερώνεσαι γι&apos; αυτά.
              </>,
              <>
                Δεν χρησιμοποιούμε cookies παρακολούθησης ούτε εργαλεία
                στατιστικών τρίτων.
              </>,
              <>
                Κρατάμε τι αναζητείται στον κατάλογο, για να βλέπουμε τι λείπει
                — <strong>συγκεντρωτικά, όχι ανά άτομο</strong>.
              </>
            ]}
          />
        </div>
      </LegalSection>

      <LegalSection id="controller" title="1. Υπεύθυνος επεξεργασίας">
        <LegalParagraph>
          Υπεύθυνος επεξεργασίας για τα δεδομένα του λογαριασμού σου είναι ο{" "}
          {LEGAL_CONTROLLER_NAME}, ως φυσικό πρόσωπο, στην{" "}
          {LEGAL_CONTROLLER_COUNTRY}, που δημιούργησε και λειτουργεί το Radevu.
        </LegalParagraph>
        <LegalParagraph>
          Για κάθε θέμα σχετικό με τα δεδομένα σου ή για την άσκηση των
          δικαιωμάτων σου:{" "}
          <a
            className="font-medium text-indigo-700 underline"
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Δεν έχουμε υποχρέωση ορισμού Υπευθύνου Προστασίας Δεδομένων (DPO).
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="roles" title="2. Οι δύο ρόλοι μας — σημαντικό">
        <LegalParagraph>
          Ανάλογα με το ποια δεδομένα αφορά, το Radevu έχει διαφορετικό ρόλο:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Για τον λογαριασμό σου</strong> (το email και το όνομα με
              το οποίο γράφτηκες) είμαστε <strong>εμείς</strong> ο υπεύθυνος
              επεξεργασίας. Ισχύει όλη η παρούσα πολιτική.
            </>,
            <>
              <strong>Για το πελατολόγιο μιας επιχείρησης</strong> (τα στοιχεία
              και τις σημειώσεις που κρατά ο επαγγελματίας για τους πελάτες του)
              υπεύθυνη είναι <strong>η ίδια η επιχείρηση</strong>. Εμείς απλώς
              φιλοξενούμε τα δεδομένα για λογαριασμό της, με βάση τις οδηγίες
              της.
            </>
          ]}
        />
        <LegalParagraph>
          Πρακτικά: αν έκλεισες ραντεβού σε έναν επαγγελματία και θέλεις να
          διαγραφούν οι σημειώσεις που κρατά για σένα, απευθύνσου πρώτα σε
          εκείνον. Αν δεν τα καταφέρεις, γράψε μας και θα βοηθήσουμε τεχνικά.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="what" title="3. Τι δεδομένα συλλέγουμε">
        <LegalList
          items={[
            <>
              <strong>Στοιχεία λογαριασμού:</strong> όνομα, email, προαιρετικά
              τηλέφωνο, κωδικός αποθηκευμένος πάντα σε κρυπτογραφημένη μορφή
              (ποτέ σε απλό κείμενο).
            </>,
            <>
              <strong>Στοιχεία επιχείρησης:</strong> επωνυμία, κατηγορία,
              περιγραφή, ωράριο, υπηρεσίες και τιμές, φωτογραφία, στοιχεία
              επικοινωνίας.
            </>,
            <>
              <strong>Στοιχεία ραντεβού:</strong> όνομα, email ή τηλέφωνο,
              υπηρεσία, ημερομηνία και ώρα, και το μήνυμα που γράφεις προς την
              επιχείρηση.
            </>,
            <>
              <strong>Τεχνικά δεδομένα ασφαλείας:</strong> διεύθυνση IP, τύπος
              προγράμματος περιήγησης (user agent) και χρονοσήμανση, όταν
              συνδέεσαι, εγγράφεσαι ή κλείνεις ραντεβού.
            </>,
            <>
              <strong>Απόδειξη αποδοχής όρων:</strong> ημερομηνία και ώρα, η
              έκδοση των κειμένων που σου εμφανίστηκε, ο τρόπος αποδοχής, IP και
              user agent.
            </>,
            <>
              <strong>Αναζητήσεις στον κατάλογο:</strong> ο όρος που έγραψες, η
              κατηγορία που διάλεξες, πόσα αποτελέσματα βρέθηκαν και η IP. Τα
              βλέπουμε <strong>μόνο συγκεντρωτικά</strong> — μας ενδιαφέρει τι
              ψάχνει ο κόσμος και τι δεν βρίσκει, όχι ποιος έψαξε τι.
            </>,
            <>
              <strong>Μηνύματα επικοινωνίας:</strong> ό,τι μας στέλνεις μέσω της
              φόρμας επικοινωνίας ή με email.
            </>
          ]}
        />
        <LegalParagraph>
          Δεν ζητάμε και δεν θέλουμε δεδομένα ειδικών κατηγοριών (υγεία,
          πεποιθήσεις κ.λπ.). Μην γράφεις τέτοια στα ελεύθερα πεδία κειμένου.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="why" title="4. Γιατί τα επεξεργαζόμαστε και με ποια νομική βάση">
        <div className="flex flex-col gap-3">
          {purposes.map((row) => (
            <div
              className="rounded-xl border border-slate-200 p-4"
              key={row.purpose}
            >
              <p className="text-base font-semibold leading-6 text-slate-900">
                {row.purpose}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                <span className="font-medium text-slate-700">Δεδομένα:</span>{" "}
                {row.data}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                <span className="font-medium text-slate-700">
                  Νομική βάση:
                </span>{" "}
                {row.basis}
              </p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="no-selling" title="5. Δεν πουλάμε τα δεδομένα σου">
        <LegalParagraph>
          Δεν πουλάμε, δεν ενοικιάζουμε και δεν ανταλλάσσουμε προσωπικά δεδομένα
          με τρίτους για εμπορικούς ή διαφημιστικούς σκοπούς. Δεν τα
          χρησιμοποιούμε για αυτοματοποιημένη λήψη αποφάσεων ή για κατάρτιση
          προφίλ.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="recipients" title="6. Ποιοι έχουν πρόσβαση">
        <LegalList
          items={[
            <>
              <strong>Η επιχείρηση στην οποία κλείνεις ραντεβού</strong> — βλέπει
              τα στοιχεία που χρειάζεται για να σε εξυπηρετήσει, καθώς και όσους
              έχει ορίσει η ίδια ως διαχειριστές του λογαριασμού της.
            </>,
            <>
              <strong>Resend</strong> — υπηρεσία αποστολής email, για τα email
              επιβεβαίωσης, υπενθύμισης και επαλήθευσης.
            </>,
            <>
              <strong>Cloudflare</strong> — δίκτυο διανομής και προστασίας, μέσω
              του οποίου περνά η κίνηση προς τη σελίδα, καθώς και ο έλεγχος
              προστασίας από αυτόματες εγγραφές.
            </>
          ]}
        />
        <LegalParagraph>
          Οι πάροχοι αυτοί ενεργούν ως εκτελούντες την επεξεργασία, δεσμεύονται
          συμβατικά και δεν επιτρέπεται να χρησιμοποιούν τα δεδομένα για δικούς
          τους σκοπούς. Πέρα από αυτούς, μπορεί να αποκαλύψουμε δεδομένα μόνο αν
          το επιβάλλει ο νόμος ή αρμόδια αρχή.
        </LegalParagraph>
        <LegalParagraph>
          Η βάση δεδομένων της υπηρεσίας φιλοξενείται σε υποδομή που ελέγχουμε
          εμείς, στην Ελλάδα.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="transfers" title="7. Διαβιβάσεις εκτός Ευρωπαϊκού Οικονομικού Χώρου">
        <LegalParagraph>
          Ορισμένοι από τους παραπάνω παρόχους εδρεύουν στις Ηνωμένες Πολιτείες.
          Όπου γίνεται διαβίβαση δεδομένων εκτός ΕΟΧ, αυτή στηρίζεται στις
          Τυποποιημένες Συμβατικές Ρήτρες της Ευρωπαϊκής Επιτροπής ή σε απόφαση
          επάρκειας, ώστε τα δεδομένα να απολαμβάνουν αντίστοιχο επίπεδο
          προστασίας.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="retention" title="8. Πόσο καιρό τα κρατάμε">
        <LegalList
          items={[
            "Στοιχεία λογαριασμού: όσο διατηρείς τον λογαριασμό σου. Μετά τη διαγραφή, αφαιρούνται χωρίς αδικαιολόγητη καθυστέρηση.",
            `Ραντεβού και σχετικό ιστορικό: έως ${LEGAL_RETENTION.appointmentsMonths} μήνες μετά την ημερομηνία του ραντεβού.`,
            `Αρχεία προσπαθειών σύνδεσης: έως ${LEGAL_RETENTION.loginAttemptsMonths} μήνες, για λόγους ασφαλείας.`,
            `Αποδείξεις αποδοχής των όρων: έως ${LEGAL_RETENTION.termsAcceptanceYears} χρόνια μετά τη λήξη της σχέσης, για τη θεμελίωση ή υπεράσπιση νομικών αξιώσεων.`,
            `Αναζητήσεις στον κατάλογο: έως ${LEGAL_RETENTION.searchEventsMonths} μήνες.`,
            `Μηνύματα επικοινωνίας: έως ${LEGAL_RETENTION.contactRequestsMonths} μήνες από την τελευταία επικοινωνία.`
          ]}
        />
      </LegalSection>

      <LegalSection id="rights" title="9. Τα δικαιώματά σου">
        <LegalParagraph>Έχεις δικαίωμα:</LegalParagraph>
        <LegalList
          items={[
            "πρόσβασης — να μάθεις ποια δεδομένα σου τηρούμε και να λάβεις αντίγραφο",
            "διόρθωσης — να διορθώσεις ανακριβή ή ελλιπή στοιχεία",
            "διαγραφής — να ζητήσεις να διαγραφούν, όταν δεν υπάρχει λόγος να τα κρατάμε",
            "περιορισμού της επεξεργασίας σε συγκεκριμένες περιπτώσεις",
            "εναντίωσης στην επεξεργασία που στηρίζεται σε έννομο συμφέρον",
            "φορητότητας — να λάβεις τα δεδομένα σου σε δομημένο, κοινώς χρησιμοποιούμενο μορφότυπο",
            "ανάκλησης της συγκατάθεσής σου ανά πάσα στιγμή, χωρίς να θίγεται η νομιμότητα όσων προηγήθηκαν"
          ]}
        />
        <LegalParagraph>
          Στείλε το αίτημά σου στο{" "}
          <a
            className="font-medium text-indigo-700 underline"
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Απαντάμε το αργότερο εντός ενός μήνα. Η άσκηση των δικαιωμάτων σου
          είναι δωρεάν.
        </LegalParagraph>
        <LegalParagraph>
          Αν θεωρείς ότι παραβιάζουμε τη νομοθεσία, έχεις δικαίωμα καταγγελίας
          στην {LEGAL_SUPERVISORY_AUTHORITY.name},{" "}
          {LEGAL_SUPERVISORY_AUTHORITY.address}, τηλ.{" "}
          {LEGAL_SUPERVISORY_AUTHORITY.phone} —{" "}
          <a
            className="font-medium text-indigo-700 underline"
            href={LEGAL_SUPERVISORY_AUTHORITY.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {LEGAL_SUPERVISORY_AUTHORITY.url}
          </a>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="security" title="10. Ασφάλεια">
        <LegalParagraph>
          Εφαρμόζουμε μέτρα κατάλληλα για το μέγεθος και τη φύση της υπηρεσίας:
          κρυπτογραφημένη σύνδεση (HTTPS), αποθήκευση κωδικών με σύγχρονο
          αλγόριθμο κατακερματισμού, περιορισμό πρόσβασης στα δεδομένα, όρια
          στις προσπάθειες σύνδεσης και καταγραφή περιστατικών ασφαλείας. Καμία
          υπηρεσία δεν είναι απολύτως ασφαλής· αν συμβεί παραβίαση που ενέχει
          υψηλό κίνδυνο για σένα, θα ενημερωθείς όπως προβλέπει ο νόμος.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies" title="11. Cookies">
        <LegalParagraph>
          Χρησιμοποιούμε <strong>μόνο απολύτως απαραίτητα cookies</strong>: αυτά
          που κρατούν τη σύνδεσή σου ενεργή και αυτά που χρειάζεται ο έλεγχος
          προστασίας από αυτόματες εγγραφές. Χωρίς αυτά η υπηρεσία δεν
          λειτουργεί, γι&apos; αυτό και δεν απαιτούν τη συγκατάθεσή σου.
        </LegalParagraph>
        <LegalParagraph>
          Δεν χρησιμοποιούμε cookies διαφήμισης, παρακολούθησης ή στατιστικών
          τρίτων. Αν αυτό αλλάξει στο μέλλον, θα ζητήσουμε πρώτα τη συγκατάθεσή
          σου.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="children" title="12. Ανήλικοι">
        <LegalParagraph>
          Η υπηρεσία απευθύνεται σε ενήλικες. Δεν συλλέγουμε εν γνώσει μας
          δεδομένα παιδιών κάτω των 15 ετών χωρίς τη συγκατάθεση όσων ασκούν τη
          γονική μέριμνα. Αν διαπιστώσουμε κάτι τέτοιο, τα διαγράφουμε.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="changes" title="13. Αλλαγές στην πολιτική">
        <LegalParagraph>
          Μπορεί να επικαιροποιήσουμε την παρούσα πολιτική. Η ισχύουσα έκδοση
          βρίσκεται πάντα σε αυτή τη σελίδα, με την ημερομηνία τελευταίας
          ενημέρωσης στην κορυφή. Σε ουσιώδεις αλλαγές θα σε ενημερώσουμε μέσα
          από την πλατφόρμα ή με email πριν τεθούν σε ισχύ.
        </LegalParagraph>
        <LegalParagraph>
          Δες επίσης τους{" "}
          <Link
            className="font-medium text-indigo-700 underline"
            href="/legal/terms"
          >
            Όρους Χρήσης
          </Link>
          .
        </LegalParagraph>
      </LegalSection>
    </LegalLayout>
  );
}
