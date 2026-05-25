import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateICS } from "../src/lib/ics.ts";

const invite = generateICS({
  attendee_email: "customer@example.com",
  attendee_name: "Πελάτης Δοκιμής",
  description:
    "Σημείωση με κόμμα, άνω τελεία; και αρκετό κείμενο ώστε η γραμμή DESCRIPTION να διπλωθεί σε περισσότερες από μία γραμμές για τον έλεγχο του RFC 5545 folding.",
  ends_at: new Date("2026-05-25T07:30:00.000Z"),
  location: "https://maps.example.com/place?x=1,y=2",
  organizer_email: "owner@example.com",
  starts_at: new Date("2026-05-25T07:00:00.000Z"),
  summary: "Κούρεμα, Γενειάδα; Δοκιμή",
  timezone: "Europe/Athens",
  uid: "appointment-1@radevu"
});

describe("generateICS", () => {
  it("emits an RFC 5545 request calendar", () => {
    assert.match(invite, /^BEGIN:VCALENDAR\r\n/);
    assert.match(invite, /\r\nEND:VCALENDAR\r\n$/);
    assert.match(invite, /\r\nVERSION:2.0\r\n/);
    assert.match(invite, /\r\nMETHOD:REQUEST\r\n/);
    assert.match(invite, /\r\nBEGIN:VEVENT\r\n/);
    assert.match(invite, /\r\nEND:VEVENT\r\n/);
  });

  it("uses CRLF line endings only", () => {
    assert.equal(invite.includes("\n"), true);
    assert.equal(invite.includes("\r\n"), true);
    assert.equal(invite.replace(/\r\n/g, "").includes("\n"), false);
  });

  it("escapes reserved text characters", () => {
    assert.match(invite, /SUMMARY:Κούρεμα\\\, Γενειάδα\\; Δοκιμή/);
    assert.match(invite, /LOCATION:https:\/\/maps\.example\.com\/place\?x=1\\\,y=2/);
  });

  it("formats start and end timestamps in UTC Zulu form", () => {
    assert.match(invite, /\r\nDTSTART:20260525T070000Z\r\n/);
    assert.match(invite, /\r\nDTEND:20260525T073000Z\r\n/);
  });

  it("folds long lines at 75 octets", () => {
    const physicalLines = invite.split("\r\n").filter(Boolean);
    const descriptionIndex = physicalLines.findIndex((line) =>
      line.startsWith("DESCRIPTION:")
    );

    assert.notEqual(descriptionIndex, -1);
    assert.equal(physicalLines[descriptionIndex + 1]?.startsWith(" "), true);

    for (const line of physicalLines) {
      assert.equal(
        Buffer.byteLength(line, "utf8") <= 75,
        true,
        `line exceeded 75 octets: ${line}`
      );
    }
  });
});
