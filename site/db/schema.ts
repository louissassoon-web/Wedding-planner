import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const plans = sqliteTable("wedding_plans", {
  userId: text("user_id").primaryKey(),
  data: text("data").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});
export const members = sqliteTable("wedding_members", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  joinedAt: text("joined_at").notNull(),
});
export const invites = sqliteTable("wedding_invites", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  kind: text("kind").notNull(),
  email: text("email").notNull().default(""),
  role: text("role").notNull().default(""),
  guestIds: text("guest_ids").notNull().default("[]"),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  revoked: integer("revoked").notNull().default(0),
  acceptedBy: text("accepted_by"),
  createdAt: text("created_at").notNull(),
  lastSubmitted: text("last_submitted"),
});
export const activity = sqliteTable("wedding_activity", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  createdAt: text("created_at").notNull(),
});
