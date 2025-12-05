import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import pg from "pg";
import { 
  merchants, 
  products, 
  transactions, 
  admins,
  customers,
  orders,
  orderMessages,
  reviews,
  banners,
  categories,
  cities,
  appSettings,
  type Merchant, 
  type InsertMerchant,
  type Product,
  type InsertProduct,
  type Transaction,
  type InsertTransaction,
  type Admin,
  type InsertAdmin,
  type Customer,
  type InsertCustomer,
  type Order,
  type InsertOrder,
  type OrderMessage,
  type InsertOrderMessage,
  type Review,
  type InsertReview,
  type Banner,
  type InsertBanner,
  type Category,
  type InsertCategory,
  type City,
  type InsertCity,
  type AppSetting,
  type InsertAppSetting
} from "@shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
  // Merchants
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantByEmail(email: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, data: Partial<Merchant>): Promise<void>;
  updateMerchantStatus(id: number, status: string): Promise<void>;
  updateMerchantBalance(id: number, amount: number): Promise<void>;
  getAllMerchants(): Promise<Merchant[]>;
  
  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByMerchant(merchantId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<void>;
  deleteProduct(id: number): Promise<void>;
  
  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByMerchant(merchantId: number): Promise<Order[]>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<void>;
  updateOrderPaid(id: number, isPaid: boolean): Promise<void>;
  
  // Order Messages
  getMessagesByOrder(orderId: number): Promise<OrderMessage[]>;
  createMessage(message: InsertOrderMessage): Promise<OrderMessage>;
  
  // Reviews
  getReviewsByProduct(productId: number): Promise<Review[]>;
  getReviewsByMerchant(merchantId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Transactions
  getTransactionsByMerchant(merchantId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<void>;
  getPendingWithdrawals(): Promise<Transaction[]>;
  
  // Admins
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  deleteAdmin(id: number): Promise<void>;
  updateAdminPassword(id: number, password: string): Promise<void>;
  
  // Banners
  getBanner(id: number): Promise<Banner | undefined>;
  getAllBanners(): Promise<Banner[]>;
  getActiveBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<InsertBanner>): Promise<void>;
  deleteBanner(id: number): Promise<void>;
  
  // Categories
  getCategory(id: number): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  getActiveCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<void>;
  deleteCategory(id: number): Promise<void>;
  
  // Cities
  getCity(id: number): Promise<City | undefined>;
  getAllCities(): Promise<City[]>;
  getActiveCities(): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: number, city: Partial<InsertCity>): Promise<void>;
  deleteCity(id: number): Promise<void>;
  
  // App Settings
  getSetting(key: string): Promise<AppSetting | undefined>;
  getAllSettings(): Promise<AppSetting[]>;
  setSetting(key: string, value?: string, valueJson?: any): Promise<AppSetting>;
}

export class DatabaseStorage implements IStorage {
  // ========== Merchants ==========
  async getMerchant(id: number): Promise<Merchant | undefined> {
    const result = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
    return result[0];
  }

  async getMerchantByEmail(email: string): Promise<Merchant | undefined> {
    const result = await db.select().from(merchants).where(eq(merchants.email, email)).limit(1);
    return result[0];
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const result = await db.insert(merchants).values(merchant as any).returning();
    return result[0];
  }

  async updateMerchant(id: number, data: Partial<Merchant>): Promise<void> {
    await db.update(merchants).set(data).where(eq(merchants.id, id));
  }

  async updateMerchantStatus(id: number, status: string): Promise<void> {
    await db.update(merchants).set({ status }).where(eq(merchants.id, id));
  }

  async updateMerchantBalance(id: number, amount: number): Promise<void> {
    await db.update(merchants).set({ balance: amount }).where(eq(merchants.id, id));
  }

  async getAllMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants).orderBy(desc(merchants.createdAt));
  }

  // ========== Products ==========
  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductsByMerchant(merchantId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.merchantId, merchantId)).orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product as any).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<void> {
    await db.update(products).set(product as any).where(eq(products.id, id));
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // ========== Customers ==========
  async getCustomer(id: number): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0];
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  // ========== Orders ==========
  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrdersByMerchant(merchantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.merchantId, merchantId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
  }

  async updateOrderPaid(id: number, isPaid: boolean): Promise<void> {
    await db.update(orders).set({ isPaid, updatedAt: new Date() }).where(eq(orders.id, id));
  }

  // ========== Order Messages ==========
  async getMessagesByOrder(orderId: number): Promise<OrderMessage[]> {
    return await db.select().from(orderMessages).where(eq(orderMessages.orderId, orderId)).orderBy(asc(orderMessages.createdAt));
  }

  async createMessage(message: InsertOrderMessage): Promise<OrderMessage> {
    const result = await db.insert(orderMessages).values(message).returning();
    return result[0];
  }

  // ========== Reviews ==========
  async getReviewsByProduct(productId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt));
  }

  async getReviewsByMerchant(merchantId: number): Promise<Review[]> {
    const merchantProducts = await this.getProductsByMerchant(merchantId);
    const productIds = merchantProducts.map(p => p.id);
    if (productIds.length === 0) return [];
    
    const allReviews: Review[] = [];
    for (const productId of productIds) {
      const productReviews = await db.select().from(reviews).where(eq(reviews.productId, productId));
      allReviews.push(...productReviews);
    }
    return allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  // ========== Transactions ==========
  async getTransactionsByMerchant(merchantId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.merchantId, merchantId)).orderBy(desc(transactions.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransactionStatus(id: number, status: string): Promise<void> {
    await db.update(transactions).set({ status }).where(eq(transactions.id, id));
  }

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return await db.select().from(transactions).where(
      and(
        eq(transactions.type, "withdrawal"),
        eq(transactions.status, "pending")
      )
    ).orderBy(desc(transactions.createdAt));
  }

  // ========== Admins ==========
  async getAdmin(id: number): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    return result[0];
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    return result[0];
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins).values(admin).returning();
    return result[0];
  }

  async getAllAdmins(): Promise<Admin[]> {
    return await db.select().from(admins).orderBy(desc(admins.createdAt));
  }

  async deleteAdmin(id: number): Promise<void> {
    await db.delete(admins).where(eq(admins.id, id));
  }

  async updateAdminPassword(id: number, password: string): Promise<void> {
    await db.update(admins).set({ password }).where(eq(admins.id, id));
  }

  // ========== Banners ==========
  async getBanner(id: number): Promise<Banner | undefined> {
    const result = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
    return result[0];
  }

  async getAllBanners(): Promise<Banner[]> {
    return await db.select().from(banners).orderBy(asc(banners.sortOrder));
  }

  async getActiveBanners(): Promise<Banner[]> {
    return await db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.sortOrder));
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const result = await db.insert(banners).values(banner).returning();
    return result[0];
  }

  async updateBanner(id: number, banner: Partial<InsertBanner>): Promise<void> {
    await db.update(banners).set(banner).where(eq(banners.id, id));
  }

  async deleteBanner(id: number): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }

  // ========== Categories ==========
  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.sortOrder));
  }

  async getActiveCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<void> {
    await db.update(categories).set(category).where(eq(categories.id, id));
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // ========== Cities ==========
  async getCity(id: number): Promise<City | undefined> {
    const result = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
    return result[0];
  }

  async getAllCities(): Promise<City[]> {
    return await db.select().from(cities).orderBy(asc(cities.sortOrder));
  }

  async getActiveCities(): Promise<City[]> {
    return await db.select().from(cities).where(eq(cities.isActive, true)).orderBy(asc(cities.sortOrder));
  }

  async createCity(city: InsertCity): Promise<City> {
    const result = await db.insert(cities).values(city).returning();
    return result[0];
  }

  async updateCity(id: number, city: Partial<InsertCity>): Promise<void> {
    await db.update(cities).set(city).where(eq(cities.id, id));
  }

  async deleteCity(id: number): Promise<void> {
    await db.delete(cities).where(eq(cities.id, id));
  }

  // ========== App Settings ==========
  async getSetting(key: string): Promise<AppSetting | undefined> {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return result[0];
  }

  async getAllSettings(): Promise<AppSetting[]> {
    return await db.select().from(appSettings);
  }

  async setSetting(key: string, value?: string, valueJson?: any): Promise<AppSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      await db.update(appSettings).set({ value, valueJson, updatedAt: new Date() }).where(eq(appSettings.key, key));
      return (await this.getSetting(key))!;
    }
    const result = await db.insert(appSettings).values({ key, value, valueJson }).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
