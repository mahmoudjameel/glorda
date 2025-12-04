import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { 
  insertMerchantSchema, 
  insertProductSchema, 
  insertTransactionSchema,
  insertBannerSchema,
  insertCategorySchema,
  insertCitySchema,
  insertOrderMessageSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userType?: "merchant" | "admin";
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "glorada-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    }
  }));

  const requireMerchant = (req: any, res: any, next: any) => {
    if (!req.session.userId || req.session.userType !== "merchant") {
      return res.status(401).json({ error: "يجب تسجيل الدخول كتاجر" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.userId || req.session.userType !== "admin") {
      return res.status(401).json({ error: "يجب تسجيل الدخول كمسؤول" });
    }
    next();
  };

  // ========== AUTH ROUTES ==========
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertMerchantSchema.parse(req.body);
      
      const existing = await storage.getMerchantByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      }
      
      const merchant = await storage.createMerchant(data);
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
      console.error("Registration error:", error);
      res.status(500).json({ error: "فشل التسجيل" });
    }
  });

  app.post("/api/auth/login/merchant", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      const merchant = await storage.getMerchantByEmail(email);
      if (!merchant || merchant.password !== password) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      if (merchant.status !== "active") {
        if (merchant.status === "pending") {
          return res.status(403).json({ error: "حسابك قيد المراجعة. يرجى انتظار موافقة الإدارة." });
        }
        return res.status(403).json({ error: "حسابك موقوف. يرجى التواصل مع الإدارة." });
      }

      req.session.userId = merchant.id;
      req.session.userType = "merchant";

      const { password: _, ...merchantData } = merchant;
      res.json({ success: true, merchant: merchantData });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "فشل تسجيل الدخول" });
    }
  });

  app.post("/api/auth/login/admin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      const admin = await storage.getAdminByEmail(email);
      if (!admin || admin.password !== password) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      req.session.userId = admin.id;
      req.session.userType = "admin";

      const { password: _, ...adminData } = admin;
      res.json({ success: true, admin: adminData });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "فشل تسجيل الدخول" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "فشل تسجيل الخروج" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "غير مسجل الدخول" });
      }

      if (req.session.userType === "merchant") {
        const merchant = await storage.getMerchant(req.session.userId);
        if (!merchant) {
          return res.status(404).json({ error: "لم يتم العثور على التاجر" });
        }
        const { password: _, ...merchantData } = merchant;
        res.json({ user: merchantData, type: "merchant" });
      } else if (req.session.userType === "admin") {
        const admin = await storage.getAdmin(req.session.userId);
        if (!admin) {
          return res.status(404).json({ error: "لم يتم العثور على المسؤول" });
        }
        const { password: _, ...adminData } = admin;
        res.json({ user: adminData, type: "admin" });
      }
    } catch (error) {
      res.status(500).json({ error: "فشل جلب بيانات المستخدم" });
    }
  });

  // ========== MERCHANT STORE ROUTES ==========
  
  app.get("/api/merchant/profile", requireMerchant, async (req, res) => {
    try {
      const merchant = await storage.getMerchant(req.session.userId!);
      if (!merchant) {
        return res.status(404).json({ error: "لم يتم العثور على التاجر" });
      }
      const { password: _, ...merchantData } = merchant;
      res.json(merchantData);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب بيانات المتجر" });
    }
  });

  app.patch("/api/merchant/profile", requireMerchant, async (req, res) => {
    try {
      const { storeName, username, storeImage, socialLinks } = req.body;
      await storage.updateMerchant(req.session.userId!, { storeName, username, storeImage, socialLinks });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث بيانات المتجر" });
    }
  });

  // ========== MERCHANT PRODUCTS ROUTES ==========
  
  app.get("/api/merchant/products", requireMerchant, async (req, res) => {
    try {
      const products = await storage.getProductsByMerchant(req.session.userId!);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب المنتجات" });
    }
  });

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
      res.status(500).json({ error: "فشل إضافة المنتج" });
    }
  });

  app.patch("/api/merchant/products/:id", requireMerchant, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "لم يتم العثور على المنتج" });
      }

      await storage.updateProduct(productId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث المنتج" });
    }
  });

  app.delete("/api/merchant/products/:id", requireMerchant, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "لم يتم العثور على المنتج" });
      }

      await storage.deleteProduct(productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل حذف المنتج" });
    }
  });

  // ========== MERCHANT ORDERS ROUTES ==========
  
  app.get("/api/merchant/orders", requireMerchant, async (req, res) => {
    try {
      const orders = await storage.getOrdersByMerchant(req.session.userId!);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الطلبات" });
    }
  });

  app.patch("/api/merchant/orders/:id/status", requireMerchant, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      const order = await storage.getOrder(orderId);
      if (!order || order.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "لم يتم العثور على الطلب" });
      }

      await storage.updateOrderStatus(orderId, status);
      
      // If order is completed and paid, add to merchant balance
      if (status === "completed" && order.isPaid) {
        const merchant = await storage.getMerchant(req.session.userId!);
        if (merchant) {
          await storage.updateMerchantBalance(merchant.id, merchant.balance + order.totalAmount);
          await storage.createTransaction({
            merchantId: merchant.id,
            orderId: orderId,
            type: "sale",
            amount: order.totalAmount,
            status: "completed",
            description: `طلب #${order.orderNumber}`
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث حالة الطلب" });
    }
  });

  // Order messages
  app.get("/api/merchant/orders/:id/messages", requireMerchant, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order || order.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "لم يتم العثور على الطلب" });
      }

      const messages = await storage.getMessagesByOrder(orderId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الرسائل" });
    }
  });

  app.post("/api/merchant/orders/:id/messages", requireMerchant, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order || order.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "لم يتم العثور على الطلب" });
      }

      const message = await storage.createMessage({
        orderId,
        senderId: req.session.userId!,
        senderType: "merchant",
        message: req.body.message
      });
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "فشل إرسال الرسالة" });
    }
  });

  // Reviews for merchant products
  app.get("/api/merchant/reviews", requireMerchant, async (req, res) => {
    try {
      const reviews = await storage.getReviewsByMerchant(req.session.userId!);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب التقييمات" });
    }
  });

  // ========== MERCHANT WALLET ROUTES ==========
  
  app.get("/api/merchant/transactions", requireMerchant, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByMerchant(req.session.userId!);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب المعاملات" });
    }
  });

  app.post("/api/merchant/withdraw", requireMerchant, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "المبلغ غير صالح" });
      }

      const merchant = await storage.getMerchant(req.session.userId!);
      if (!merchant || merchant.balance < amount) {
        return res.status(400).json({ error: "الرصيد غير كافي" });
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
      res.status(500).json({ error: "فشل طلب السحب" });
    }
  });

  // ========== ADMIN MERCHANTS ROUTES ==========
  
  app.get("/api/admin/merchants", requireAdmin, async (req, res) => {
    try {
      const merchants = await storage.getAllMerchants();
      const merchantsWithoutPasswords = merchants.map(({ password, ...m }) => m);
      res.json(merchantsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب التجار" });
    }
  });

  app.patch("/api/admin/merchants/:id/status", requireAdmin, async (req, res) => {
    try {
      const merchantId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "active", "suspended", "review"].includes(status)) {
        return res.status(400).json({ error: "حالة غير صالحة" });
      }

      await storage.updateMerchantStatus(merchantId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث حالة التاجر" });
    }
  });

  // ========== ADMIN CUSTOMERS ROUTES ==========
  
  app.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب العملاء" });
    }
  });

  // ========== ADMIN ORDERS ROUTES ==========
  
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الطلبات" });
    }
  });

  // ========== ADMIN WITHDRAWALS ROUTES ==========
  
  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب طلبات السحب" });
    }
  });

  app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب المعاملات" });
    }
  });

  app.patch("/api/admin/withdrawals/:id", requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["completed", "rejected"].includes(status)) {
        return res.status(400).json({ error: "حالة غير صالحة" });
      }

      await storage.updateTransactionStatus(transactionId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث طلب السحب" });
    }
  });

  // ========== ADMIN BANNERS ROUTES ==========
  
  app.get("/api/admin/banners", requireAdmin, async (req, res) => {
    try {
      const banners = await storage.getAllBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب البانرات" });
    }
  });

  app.post("/api/admin/banners", requireAdmin, async (req, res) => {
    try {
      const data = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(data);
      res.json(banner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "فشل إضافة البانر" });
    }
  });

  app.patch("/api/admin/banners/:id", requireAdmin, async (req, res) => {
    try {
      const bannerId = parseInt(req.params.id);
      await storage.updateBanner(bannerId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث البانر" });
    }
  });

  app.delete("/api/admin/banners/:id", requireAdmin, async (req, res) => {
    try {
      const bannerId = parseInt(req.params.id);
      await storage.deleteBanner(bannerId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل حذف البانر" });
    }
  });

  // ========== ADMIN CATEGORIES ROUTES ==========
  
  app.get("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الأقسام" });
    }
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "فشل إضافة القسم" });
    }
  });

  app.patch("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      await storage.updateCategory(categoryId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث القسم" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      await storage.deleteCategory(categoryId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل حذف القسم" });
    }
  });

  // ========== ADMIN CITIES ROUTES ==========
  
  app.get("/api/admin/cities", requireAdmin, async (req, res) => {
    try {
      const cities = await storage.getAllCities();
      res.json(cities);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب المدن" });
    }
  });

  app.post("/api/admin/cities", requireAdmin, async (req, res) => {
    try {
      const data = insertCitySchema.parse(req.body);
      const city = await storage.createCity(data);
      res.json(city);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "فشل إضافة المدينة" });
    }
  });

  app.patch("/api/admin/cities/:id", requireAdmin, async (req, res) => {
    try {
      const cityId = parseInt(req.params.id);
      await storage.updateCity(cityId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث المدينة" });
    }
  });

  app.delete("/api/admin/cities/:id", requireAdmin, async (req, res) => {
    try {
      const cityId = parseInt(req.params.id);
      await storage.deleteCity(cityId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل حذف المدينة" });
    }
  });

  // ========== ADMIN SETTINGS ROUTES ==========
  
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الإعدادات" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { key, value, valueJson } = req.body;
      const setting = await storage.setSetting(key, value, valueJson);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "فشل حفظ الإعداد" });
    }
  });

  // ========== PUBLIC ROUTES (for mobile app) ==========
  
  app.get("/api/public/banners", async (req, res) => {
    try {
      const banners = await storage.getActiveBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب البانرات" });
    }
  });

  app.get("/api/public/categories", async (req, res) => {
    try {
      const categories = await storage.getActiveCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الأقسام" });
    }
  });

  app.get("/api/public/cities", async (req, res) => {
    try {
      const cities = await storage.getActiveCities();
      res.json(cities);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب المدن" });
    }
  });

  app.get("/api/public/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      res.json(setting || { key: req.params.key, value: null });
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الإعداد" });
    }
  });

  // ========== SEED DEFAULT ADMIN ==========
  const seedAdmin = async () => {
    try {
      const existingAdmin = await storage.getAdminByEmail("admin@glorda.com");
      if (!existingAdmin) {
        await storage.createAdmin({
          email: "admin@glorda.com",
          password: "admin123",
          name: "مدير النظام"
        });
        console.log("Default admin created: admin@glorda.com / admin123");
      }
    } catch (error) {
      console.error("Failed to seed admin:", error);
    }
  };
  
  seedAdmin();

  return httpServer;
}
