# Portfolio Integration Guide

Sections in Greek; commands in English. Treat both as canonical.

## 1. Αρχιτεκτονική

Το portfolio στο `wannabexaker.github.io` μένει static. Το Radevu μένει live app στο δικό του domain. Η σύνδεση είναι μόνο ένα link.

```text
wannabexaker.github.io
  └─ Featured Project card
       └─ https://radevu.gr

radevu.gr
  ├─ Landing page
  ├─ /despoina
  ├─ /ioannis
  └─ /dashboard
```

Στη Phase 0 το τοπικό URL είναι `http://radevu.local:3000`, αλλά είναι LAN-only. Στο portfolio βάζεις live link μόνο όταν υπάρχει `https://radevu.gr`.

## 2. Featured Project card

Plain CSS variant:

```html
<article class="featured-project">
  <p class="featured-project__eyebrow">SaaS · Next.js · Docker</p>
  <h3>Radevu</h3>
  <p>
    Mobile-first σύστημα κρατήσεων και μικρό CRM για επαγγελματίες υπηρεσιών στην Ελλάδα.
  </p>
  <div class="featured-project__links">
    <a href="https://radevu.gr" rel="noopener noreferrer" target="_blank">Live demo →</a>
    <a href="https://github.com/wannabexaker/Radevu" rel="noopener noreferrer" target="_blank">Code →</a>
  </div>
</article>
```

```css
.featured-project {
  border: 1px solid #d9e2ff;
  border-radius: 14px;
  padding: 24px;
  background: #ffffff;
  color: #0f172a;
}

.featured-project__eyebrow {
  margin: 0 0 8px;
  color: #4f46e5;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.featured-project h3 {
  margin: 0 0 12px;
  font-size: 1.5rem;
}

.featured-project p {
  margin: 0;
  line-height: 1.6;
}

.featured-project__links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.featured-project__links a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: 10px;
  padding: 0 16px;
  background: #4f46e5;
  color: #ffffff;
  font-weight: 700;
  text-decoration: none;
}
```

Tailwind variant:

```html
<article class="rounded-xl border border-indigo-100 bg-white p-6 text-slate-900">
  <p class="mb-2 text-sm font-bold uppercase text-indigo-600">SaaS · Next.js · Docker</p>
  <h3 class="mb-3 text-2xl font-bold">Radevu</h3>
  <p class="leading-relaxed">
    Mobile-first σύστημα κρατήσεων και μικρό CRM για επαγγελματίες υπηρεσιών στην Ελλάδα.
  </p>
  <div class="mt-5 flex flex-wrap gap-3">
    <a class="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 font-bold text-white" href="https://radevu.gr" rel="noopener noreferrer" target="_blank">Live demo →</a>
    <a class="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 font-bold text-slate-900" href="https://github.com/wannabexaker/Radevu" rel="noopener noreferrer" target="_blank">Code →</a>
  </div>
</article>
```

## 3. Προτεινόμενο copy

Greek:

```text
Radevu είναι ένα mobile-first σύστημα κρατήσεων για μικρές επιχειρήσεις υπηρεσιών στην Ελλάδα. Περιλαμβάνει public booking page, dashboard, πελάτες, οφειλές και email reminders.
```

English:

```text
Radevu is a mobile-first booking SaaS for small service businesses in Greece. It includes public booking pages, an owner dashboard, customer history, unpaid booking tracking, and email reminders.
```

Short card line:

```text
Booking SaaS for Greek service businesses, built with Next.js, PostgreSQL, Redis and Docker.
```

## 4. Screenshot capture

Χρησιμοποίησε Chrome DevTools:

```text
Device: 360 x 800
Page: https://radevu.gr
Command menu: Capture full size screenshot
```

Πάρε τρία screenshots:

1. Landing page με showcase.
2. `/despoina` public profile.
3. Dashboard Today tab με demo data.

Μην τραβήξεις screenshots με προσωπικά emails ή πραγματικά τηλέφωνα πελατών.

## 5. README badge

Στο README μπορεί να μπει:

```md
[![Live demo](https://img.shields.io/badge/Live%20demo-radevu.gr-4f46e5)](https://radevu.gr)
```

## 6. Πότε ενημερώνεις screenshots

Ενημέρωσε portfolio screenshots μόνο μετά από μεγάλο UI change ή κάθε τρίμηνο. Μην τα αλλάζεις για μικρές διορθώσεις copy.
