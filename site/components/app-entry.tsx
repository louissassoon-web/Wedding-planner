"use client";
import { usePathname } from "next/navigation";
import Planner from "./planner";
import { JoinPage, RsvpPage } from "./invitation-pages";
export default function AppEntry() {
  const path = usePathname();
  return path === "/join" ? (
    <JoinPage />
  ) : path === "/rsvp" ? (
    <RsvpPage />
  ) : (
    <Planner />
  );
}
