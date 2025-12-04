import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { insertMerchantSchema, insertProductSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Extend session data types
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userType?: "merchant" | "admin";
  }
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  // For now, just a simple hash - in production use bcrypt
  return password; // TODO: Implement proper hashing
}

function comparePassword(plain: string, hashed: string): boolean {
  return plain === hashed; // TODO: Implement proper comparison
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup session
  app.use(session({
    secret: process.env.SESSION_SECRET || "glorada-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  }));

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  const requireMerchant = (req: any, res: any, next: any) => {
    if (!req.session.userId || req.session.userType !== "merchant") {
      return res.status(401).json({ error: "Merchant access required" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.userId || req.session.userType !== "admin") {
      return res.status(401).json({ error: "Admin access required" });
    }
    next();
  };

  // ========== AUTH ROUTES ==========
  
  // Merchant Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertMerchantSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getMerchantByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      }

      // Hash password
      const hashedPassword = hashPassword(data.password);
      
      const merchant = await storage.createMerchant({
        ...data,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...merchantData } = merchant;
      
      res.json({ 
        success: true, 
        message: "تم استلام طلبك بنجاح. سيتم إشعارك عند التفعيل.",
        merchant: merchantData 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "فشل التسجيل" });
    }
  });

  // Merchant Login
  app.post("/api/auth/login/merchant", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      const merchant = await storage.getMerchantByEmail(email);
      if (!merchant) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      if (!comparePassword(password, merchant.password)) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      if (merchant.status !== "active") {
        return res.status(403).json({ error: "حسابك قيد المراجعة أو موقوف" });
      }

      // Set session
      req.session.userId = merchant.id;
      req.session.userType = "merchant";

      const { password: _, ...merchantData } = merchant;
      res.json({ success: true, merchant: merchantData });
    } catch (error) {
      res.status(500).json({ error: "فشل تسجيل الدخول" });
    }
  });

  // Admin Login
  app.post("/api/auth/login/admin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      const admin = await storage.getAdminByEmail(email);
      if (!admin || !comparePassword(password, admin.password)) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      // Set session
      req.session.userId = admin.id;
      req.session.userType = "admin";

      const { password: _, ...adminData } = admin;
      res.json({ success: true, admin: adminData });
    } catch (error) {
      res.status(500).json({ error: "فشل تسجيل الدخول" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "فشل تسجيل الخروج" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      if (req.session.userType === "merchant") {
        const merchant = await storage.getMerchant(req.session.userId!);
        if (!merchant) {
          return res.status(404).json({ error: "Merchant not found" });
        }
        const { password: _, ...merchantData } = merchant;
        res.json({ user: merchantData, type: "merchant" });
      } else {
        const admin = await storage.getAdminByEmail(""); // We'd need to store admin id properly
        if (!admin) {
          return res.status(404).json({ error: "Admin not found" });
        }
        const { password: _, ...adminData } = admin;
        res.json({ user: adminData, type: "admin" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get user data" });
    }
  });

  // ========== MERCHANT ROUTES (requires merchant auth) ==========
  
  // Get merchant products
  app.get("/api/merchant/products", requireMerchant, async (req, res) => {
    try {
      const products = await storage.getProductsByMerchant(req.session.userId!);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Create product
  app.post("/api/merchant/products", requireMerchant, async (req, res) => {
    try {
      const data = insertProductSchema.parse({
        ...req.body,
        merchantId: req.session.userId,
      });
      
      const product = await storage.createProduct(data);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product
  app.patch("/api/merchant/products/:id", requireMerchant, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "Product not found" });
      }

      await storage.updateProduct(productId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/merchant/products/:id", requireMerchant, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "Product not found" });
      }

      await storage.deleteProduct(productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Get transactions
  app.get("/api/merchant/transactions", requireMerchant, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByMerchant(req.session.userId!);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Request withdrawal
  app.post("/api/merchant/withdraw", requireMerchant, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const merchant = await storage.getMerchant(req.session.userId!);
      if (!merchant || merchant.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const transaction = await storage.createTransaction({
        merchantId: req.session.userId!,
        type: "withdrawal",
        amount: -amount,
        status: "pending",
        description: "طلب سحب رصيد",
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to request withdrawal" });
    }
  });

  // Update social links
  app.patch("/api/merchant/socials", requireMerchant, async (req, res) => {
    try {
      await storage.updateMerchantSocials(req.session.userId!, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update social links" });
    }
  });

  // ========== ADMIN ROUTES (requires admin auth) ==========
  
  // Get all merchants
  app.get("/api/admin/merchants", requireAdmin, async (req, res) => {
    try {
      const merchants = await storage.getAllMerchants();
      const merchantsWithoutPasswords = merchants.map(({ password, ...m }) => m);
      res.json(merchantsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch merchants" });
    }
  });

  // Update merchant status
  app.patch("/api/admin/merchants/:id/status", requireAdmin, async (req, res) => {
    try {
      const merchantId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "active", "suspended"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateMerchantStatus(merchantId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update merchant status" });
    }
  });

  // Get pending withdrawals
  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  return httpServer;
}
