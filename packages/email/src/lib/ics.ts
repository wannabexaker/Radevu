import { Buffer } from "node:buffer";

const CRLF = "\r\n";
const MAX_LINE_OCTETS = 75;
const CONTINUATION_PREFIX_OCTETS = 1;

export type GenerateICSInput = {
  attendee_email: string;
  attendee_name: string;
  description?: string;
  ends_at: Date;
  location?: string;
  organizer_email: string;
  starts_at: Date;
  summary: string;
  timezone: string;
  uid: string;
};

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function escapeParameter(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function utcTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function takeSegment(value: string, maxOctets: number): [string, string] {
  let octets = 0;
  let index = 0;

  for (const character of value) {
    const characterOctets = Buffer.byteLength(character, "utf8");

    if (octets + characterOctets > maxOctets) {
      break;
    }

    octets += characterOctets;
    index += character.length;
  }

  return [value.slice(0, index), value.slice(index)];
}

function foldLine(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= MAX_LINE_OCTETS) {
    return line;
  }

  const segments: string[] = [];
  let remaining = line;
  let maxOctets = MAX_LINE_OCTETS;

  while (Buffer.byteLength(remaining, "utf8") > maxOctets) {
    const [segment, nextRemaining] = takeSegment(remaining, maxOctets);
    segments.push(segment);
    remaining = nextRemaining;
    maxOctets = MAX_LINE_OCTETS - CONTINUATION_PREFIX_OCTETS;
  }

  segments.push(remaining);

  return segments
    .map((segment, index) => (index === 0 ? segment : ` ${segment}`))
    .join(CRLF);
}

/**
 * Generates an RFC 5545 calendar invite for a confirmed appointment.
 *
 * @param input - Appointment, attendee, organizer, and display fields for the invite.
 * @returns A VCALENDAR string with CRLF line endings, UTC timestamps, and folded lines.
 */
export function generateICS(input: GenerateICSInput): string {
  const description = input.description ?? "";
  const location = input.location ?? "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Radevu//Radevu//EL",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${escapeText(input.uid)}`,
    `DTSTAMP:${utcTimestamp(new Date())}`,
    `DTSTART:${utcTimestamp(input.starts_at)}`,
    `DTEND:${utcTimestamp(input.ends_at)}`,
    `SUMMARY:${escapeText(input.summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location)}`,
    `ORGANIZER:mailto:${input.organizer_email}`,
    `ATTENDEE;CN="${escapeParameter(input.attendee_name)}";RSVP=FALSE;PARTSTAT=ACCEPTED:mailto:${input.attendee_email}`,
    `X-WR-TIMEZONE:${escapeText(input.timezone)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return `${lines.map(foldLine).join(CRLF)}${CRLF}`;
}
