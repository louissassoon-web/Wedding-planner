import { z } from "zod";
const short = z.string().trim().max(200);
const paragraph = z.string().trim().max(4000);
const link = z
  .union([z.literal(""), z.string().url().max(1000)])
  .refine((v) => !v || /^https?:\/\//i.test(v), "Use an http or https link");
export const guestSiteSchema = z.object({
  welcome: paragraph.default(
    "We can’t wait to celebrate with our favourite people. All the little details for our day will be gathered here.",
  ),
  arrivalTime: short.default(""),
  ceremonyTime: short.default(""),
  receptionTime: short.default(""),
  finishTime: short.default(""),
  venueAddress: paragraph.default(""),
  mapUrl: link.default(""),
  travel: paragraph.default(""),
  parking: paragraph.default(""),
  accommodation: paragraph.default(""),
  dressCode: paragraph.default(""),
  children: paragraph.default(""),
  gifts: paragraph.default(""),
  contactEmail: z
    .union([z.literal(""), z.string().trim().email().max(200)])
    .default(""),
  faqs: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        question: short.min(1),
        answer: paragraph.min(1),
      }),
    )
    .max(20)
    .default([]),
  mealOptions: z.array(short.min(1)).max(20).default([]),
  askTransport: z.boolean().default(false),
  askSong: z.boolean().default(true),
});
export type GuestSite = z.infer<typeof guestSiteSchema>;
