"use client";
import { usePathname } from "next/navigation";
import Planner from "./planner";
import { JoinPage } from "./invitation-pages";
import GuestWebsite from "./guest-website";
export default function AppEntry() {
  const path = usePathname();
  return path === "/join" ? (
    <JoinPage />
  ) : path === "/rsvp" || path.startsWith("/wedding") ? (
    <GuestWebsite />
  ) : (
    <Planner />
  );
}
