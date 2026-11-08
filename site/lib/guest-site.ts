import type { PlannerState, Guest } from "./planner.ts";
export function publicWedding(state: PlannerState) {
  return {
    name: state.settings.name,
    partner1: state.settings.partner1,
    partner2: state.settings.partner2,
    date: state.settings.date,
    venue: state.settings.venue,
    deadline: state.settings.rsvpDeadline,
    details: state.guestSite,
  };
}
export type PublicWedding = ReturnType<typeof publicWedding>;
export function publicGuest(guest: Guest) {
  return {
    id: guest.id,
    name: guest.name,
    rsvp: guest.rsvp,
    meal: guest.meal,
    dietary: guest.dietary,
    accessibility: guest.accessibility,
    transport: guest.transport,
    songRequest: guest.songRequest,
    message: guest.message,
    replyEmail: guest.replyEmail,
    replyPhone: guest.replyPhone,
  };
}
export type GuestReply = ReturnType<typeof publicGuest>;
export function normaliseInviteCode(code: string) {
  return code.toUpperCase().replace(/[\s-]/g, "");
}
export function formatInviteCode(code: string) {
  return (
    normaliseInviteCode(code)
      .match(/.{1,4}/g)
      ?.join("-") || ""
  );
}
export function weddingCalendar(wedding: PublicWedding) {
  const clean = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/[,;]/g, (c) => "\\" + c);
  const next = new Date(wedding.date + "T12:00:00Z");
  next.setUTCDate(next.getUTCDate() + 1);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Marigold//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:wedding-${wedding.date}-${encodeURIComponent(wedding.name)}@marigold`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${wedding.date.replaceAll("-", "")}`,
    `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replaceAll("-", "")}`,
    `SUMMARY:${clean(wedding.name)}`,
    `LOCATION:${clean([wedding.venue, wedding.details.venueAddress].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${clean("Save the date. Please check your invitation for confirmed timings.")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];
  return lines
    .map((line) => {
      const rows: string[] = [];
      let row = "";
      for (const char of line) {
        if (new TextEncoder().encode(row + char).length > 74) {
          rows.push(row);
          row = " ";
        }
        row += char;
      }
      rows.push(row);
      return rows.join("\r\n");
    })
    .join("\r\n");
}
