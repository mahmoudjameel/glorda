import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc } from "drizzle-orm";
import pg from "pg";
import { 
  merchants, 
  products, 
  transactions, 
  admins,
  type Merchant, 
  type InsertMerchant,
  type Product,
  type InsertProduct,
  type Transaction,
  type InsertTransaction,
  type Admin,
  type InsertAdmin
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
  updateMerchantStatus(id: number, status: string): Promise<void>;
  updateMerchantBalance(id: number, amount: number): Promise<void>;
  updateMerchantSocials(id: number, socialLinks: Merchant['socialLinks']): Promise<void>;
  getAllMerchants(): Promise<Merchant[]>;
  
  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByMerchant(merchantId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<void>;
  deleteProduct(id: number): Promise<void>;
  
  // Transactions
  getTransactionsByMerchant(merchantId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getPendingWithdrawals(): Promise<Transaction[]>;
  
  // Admins
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
}

export class DatabaseStorage implements IStorage {
  // Merchants
  async getMerchant(id: number): Promise<Merchant | undefined> {
    const result = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
    return result[0];
  }

  async getMerchantByEmail(email: string): Promise<Merchant | undefined> {
    const result = await db.select().from(merchants).where(eq(merchants.email, email)).limit(1);
    return result[0];
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const result = await db.insert(merchants).values(merchant).returning();
    return result[0];
  }

  async updateMerchantStatus(id: number, status: string): Promise<void> {
    await db.update(merchants).set({ status }).where(eq(merchants.id, id));
  }

  async updateMerchantBalance(id: number, amount: number): Promise<void> {
    await db.update(merchants).set({ balance: amount }).where(eq(merchants.id, id));
  }

  async updateMerchantSocials(id: number, socialLinks: Merchant['socialLinks']): Promise<void> {
    await db.update(merchants).set({ socialLinks }).where(eq(merchants.id, id));
  }

  async getAllMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants).orderBy(desc(merchants.createdAt));
  }

  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductsByMerchant(merchantId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.merchantId, merchantId)).orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<void> {
    await db.update(products).set(product).where(eq(products.id, id));
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Transactions
  async getTransactionsByMerchant(merchantId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.merchantId, merchantId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return await db.select().from(transactions).where(
      and(
        eq(transactions.type, "withdrawal"),
        eq(transactions.status, "pending")
      )
    ).orderBy(desc(transactions.createdAt));
  }

  // Admins
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    return result[0];
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins).values(admin).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
