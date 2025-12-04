import { sql } from "drizzle-orm";
import { pgTable, text, integer, serial, timestamp, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========== Merchants Table ==========
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  storeName: text("store_name").notNull(),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  mobile: text("mobile").notNull(),
  password: text("password").notNull(),
  storeType: text("store_type").notNull(),
  category: text("category").notNull(),
  city: text("city").notNull(),
  registrationNumber: text("registration_number").notNull(),
  deliveryMethod: text("delivery_method").notNull(),
  branches: jsonb("branches").$type<{ name: string; mapLink: string }[]>(),
  status: text("status").notNull().default("pending"),
  storeImage: text("store_image"),
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
    tiktok?: string;
    snapchat?: string;
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

// ========== Products Table ==========
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  category: text("category").notNull(),
  images: jsonb("images").$type<string[]>(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ========== Customers Table ==========
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  mobile: text("mobile").notNull().unique(),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// ========== Orders Table ==========
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending"),
  customerNote: text("customer_note"),
  deliveryAddress: text("delivery_address"),
  deliveryMethod: text("delivery_method").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// ========== Order Messages Table ==========
export const orderMessages = pgTable("order_messages", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull(),
  senderType: text("sender_type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderMessageSchema = createInsertSchema(orderMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderMessage = z.infer<typeof insertOrderMessageSchema>;
export type OrderMessage = typeof orderMessages.$inferSelect;

// ========== Reviews Table ==========
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  productId: integer("product_id").notNull().references(() => products.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// ========== Transactions Table (Wallet) ==========
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("completed"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// ========== Admins Table ==========
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

// ========== Banners Table ==========
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  image: text("image").notNull(),
  link: text("link"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
});

export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof banners.$inferSelect;

// ========== Categories Table (App Categories) ==========
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  icon: text("icon"),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// ========== Cities Table ==========
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
});

export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof cities.$inferSelect;

// ========== App Settings Table ==========
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  valueJson: jsonb("value_json"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
