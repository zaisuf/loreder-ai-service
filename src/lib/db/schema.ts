import { pgTable, text, timestamp, boolean, integer, jsonb, primaryKey } from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").default("user"),
  bio: text("bio").default(""),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
})

export const accounts = pgTable("account", {
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] })
}))

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (verificationToken) => ({
  compoundKey: primaryKey({ columns: [verificationToken.identifier, verificationToken.token] })
}))

// Custom App Tables
export const apiKeys = pgTable("api_key", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  totalRequests: integer("totalRequests").default(0),
  totalTokens: integer("totalTokens").default(0),
  status: text("status").default("active"), // 'active' | 'revoked'
})

export const usageLogs = pgTable("usage_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  keyId: text("keyId").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  keyName: text("keyName"),
  model: text("model").notNull(),
  promptTokens: integer("promptTokens").default(0),
  completionTokens: integer("completionTokens").default(0),
  totalTokens: integer("totalTokens").default(0),
  latencyMs: integer("latencyMs").default(0),
  timestamp: timestamp("timestamp", { mode: "date" }).defaultNow(),
  status: text("status").notNull(), // 'success' | 'error'
})

export const providers = pgTable("provider", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'opencode' | 'openrouter' | 'custom'
  baseUrl: text("baseUrl").notNull(),
  apiKey: text("apiKey").notNull(),
  isEnabled: boolean("isEnabled").default(true),
})

export const models = pgTable("model", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  contextLength: integer("contextLength").default(8192),
  isFree: boolean("isFree").default(false),
  pricingPrompt: integer("pricingPrompt").default(0),
  pricingCompletion: integer("pricingCompletion").default(0),
  description: text("description").default(""),
})
