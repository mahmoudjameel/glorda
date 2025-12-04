import { sql } from "drizzle-orm";
import { pgTable, text, integer, serial, timestamp, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Merchants Table
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  storeName: text("store_name").notNull(),
  email: text("email").notNull().unique(),
  mobile: text("mobile").notNull(),
  password: text("password").notNull(),
  storeType: text("store_type").notNull(), // 'company', 'institution', 'individual'
  category: text("category").notNull(), // 'gifts', 'flowers', 'all'
  city: text("city").notNull(),
  registrationNumber: text("registration_number").notNull(),
  deliveryMethod: text("delivery_method").notNull(), // 'representative', 'pickup', 'all'
  branches: jsonb("branches").$type<{ name: string; mapLink: string }[]>(),
  status: text("status").notNull().default("pending"), // 'pending', 'active', 'suspended'
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
    tiktok?: string;
  }>(),
  balance: integer("balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMerchantSchema = createInsertSchema(merchants, {
  email: z.string().email(),
  mobile: z.string().min(9),
  password: z.string().min(6),
}).omit({
  id: true,
  balance: true,
  createdAt: true,
  status: true,
});

export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: integer("price").notNull(), // stored in cents/halalas
  stock: integer("stock").notNull().default(0),
  category: text("category").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'out_of_stock', 'low_stock'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Transactions Table (for wallet)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'sale', 'withdrawal'
  amount: integer("amount").notNull(), // stored in cents/halalas (can be negative for withdrawals)
  status: text("status").notNull().default("completed"), // 'completed', 'pending'
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Admin Users Table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;
