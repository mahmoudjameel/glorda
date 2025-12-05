import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
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

// Configure multer for product image uploads
const uploadsDir = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const productImageUpload = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG, PNG, GIF أو WebP"));
    }
  }
});

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
  
  const isProduction = process.env.NODE_ENV === "production";
  const isReplit = !!process.env.REPL_SLUG;
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "glorada-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction || isReplit,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: isProduction || isReplit ? "none" : "lax",
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
      
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const merchant = await storage.createMerchant({
        ...data,
        password: hashedPassword
      });
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
      if (!merchant) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }
      
      const isValidPassword = await bcrypt.compare(password, merchant.password);
      if (!isValidPassword) {
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

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "خطأ في حفظ الجلسة" });
        }
        const { password: _, ...merchantData } = merchant;
        res.json({ success: true, merchant: merchantData });
      });
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
      if (!admin) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }
      
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      req.session.userId = admin.id;
      req.session.userType = "admin";

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "خطأ في حفظ الجلسة" });
        }
        const { password: _, ...adminData } = admin;
        res.json({ success: true, admin: adminData });
      });
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

  // Password Reset - OTP Storage (in-memory for simplicity)
  const otpStore = new Map<string, { otp: string; expires: number; token?: string }>();

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
      }

      const merchant = await storage.getMerchantByEmail(email);
      if (!merchant) {
        // Don't reveal if email exists or not for security
        return res.json({ success: true, message: "إذا كان البريد مسجلاً، سيتم إرسال رمز التحقق" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpStore.set(email, { otp, expires });

      // Log OTP for testing (in production, send via email)
      console.log(`[OTP] Password reset code for ${email}: ${otp}`);

      res.json({ success: true, message: "تم إرسال رمز التحقق" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "حدث خطأ" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: "البريد الإلكتروني ورمز التحقق مطلوبان" });
      }

      const stored = otpStore.get(email);
      
      if (!stored) {
        return res.status(400).json({ error: "رمز التحقق غير صالح أو منتهي" });
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: "رمز التحقق منتهي الصلاحية" });
      }

      if (stored.otp !== otp) {
        return res.status(400).json({ error: "رمز التحقق غير صحيح" });
      }

      // Generate reset token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      stored.token = token;
      stored.expires = Date.now() + 15 * 60 * 1000; // 15 minutes for password reset
      otpStore.set(email, stored);

      res.json({ success: true, token });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "حدث خطأ" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, token, password } = req.body;
      
      if (!email || !token || !password) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      const stored = otpStore.get(email);
      
      if (!stored || stored.token !== token) {
        return res.status(400).json({ error: "رابط غير صالح" });
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: "انتهت صلاحية الرابط" });
      }

      const merchant = await storage.getMerchantByEmail(email);
      if (!merchant) {
        return res.status(400).json({ error: "الحساب غير موجود" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateMerchant(merchant.id, { password: hashedPassword });

      otpStore.delete(email);

      res.json({ success: true, message: "تم إعادة تعيين كلمة المرور بنجاح" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "فشل إعادة تعيين كلمة المرور" });
    }
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
      const { storeName, username, bio, storeImage, socialLinks, city } = req.body;
      await storage.updateMerchant(req.session.userId!, { storeName, username, bio, storeImage, socialLinks, city });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث بيانات المتجر" });
    }
  });

  app.get("/api/merchant/stats", requireMerchant, async (req, res) => {
    try {
      const merchantId = req.session.userId!;
      const [products, orders, transactions] = await Promise.all([
        storage.getProductsByMerchant(merchantId),
        storage.getOrdersByMerchant(merchantId),
        storage.getTransactionsByMerchant(merchantId)
      ]);

      const merchant = await storage.getMerchant(merchantId);
      const totalSales = transactions
        .filter(t => t.type === "sale" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const pendingOrders = orders.filter(o => o.status === "pending").length;
      const completedOrders = orders.filter(o => o.status === "completed").length;

      res.json({
        productsCount: products.length,
        ordersCount: orders.length,
        pendingOrders,
        completedOrders,
        totalSales,
        balance: merchant?.balance || 0,
        recentOrders: orders.slice(0, 5),
        recentTransactions: transactions.slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الإحصائيات" });
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

  // ========== PRODUCT IMAGE UPLOAD ==========
  
  app.post("/api/merchant/products/upload-images", requireMerchant, productImageUpload.array("images", 5), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "لم يتم رفع أي صور" });
      }

      const imageUrls = files.map(file => `/uploads/products/${file.filename}`);
      res.json({ success: true, images: imageUrls });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "فشل رفع الصور" });
    }
  });

  // Serve uploaded files
  const express = await import("express");
  app.use("/uploads", express.default.static(path.join(process.cwd(), "uploads")));

  // ========== MERCHANT ORDERS ROUTES ==========
  
  app.get("/api/merchant/orders", requireMerchant, async (req, res) => {
    try {
      const orders = await storage.getOrdersByMerchant(req.session.userId!);
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const customer = await storage.getCustomer(order.customerId);
          const product = await storage.getProduct(order.productId);
          return {
            ...order,
            customer: customer ? { id: customer.id, name: customer.name, mobile: customer.mobile, city: customer.city } : null,
            product: product ? { id: product.id, name: product.name, price: product.price, images: product.images } : null,
          };
        })
      );
      res.json(ordersWithDetails);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الطلبات" });
    }
  });

  // Get merchant conversations (orders with messages)
  app.get("/api/merchant/conversations", requireMerchant, async (req, res) => {
    try {
      const orders = await storage.getOrdersByMerchant(req.session.userId!);
      const conversationsWithDetails = await Promise.all(
        orders.map(async (order) => {
          const customer = await storage.getCustomer(order.customerId);
          const product = await storage.getProduct(order.productId);
          const messages = await storage.getMessagesByOrder(order.id);
          return {
            ...order,
            customer: customer ? { id: customer.id, name: customer.name, mobile: customer.mobile } : null,
            product: product ? { id: product.id, name: product.name } : null,
            messagesCount: messages.length,
            lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
          };
        })
      );
      res.json(conversationsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب المحادثات" });
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
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const customer = await storage.getCustomer(order.customerId);
          const merchant = await storage.getMerchant(order.merchantId);
          const product = await storage.getProduct(order.productId);
          return {
            ...order,
            customer: customer ? { id: customer.id, name: customer.name, mobile: customer.mobile, city: customer.city } : null,
            merchant: merchant ? { id: merchant.id, storeName: merchant.storeName, ownerName: merchant.ownerName } : null,
            product: product ? { id: product.id, name: product.name, price: product.price, images: product.images } : null,
          };
        })
      );
      res.json(ordersWithDetails);
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

  // ========== ADMIN MANAGEMENT ROUTES ==========
  
  app.get("/api/admin/admins", requireAdmin, async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      const sanitizedAdmins = admins.map(({ password, ...admin }) => admin);
      res.json(sanitizedAdmins);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب المسؤولين" });
    }
  });

  app.post("/api/admin/admins", requireAdmin, async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      }

      const existing = await storage.getAdminByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await storage.createAdmin({
        email,
        password: hashedPassword,
        name
      });

      const { password: _, ...adminData } = admin;
      res.json(adminData);
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ error: "فشل إضافة المسؤول" });
    }
  });

  app.delete("/api/admin/admins/:id", requireAdmin, async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      
      if (adminId === req.session.userId) {
        return res.status(400).json({ error: "لا يمكنك حذف حسابك الحالي" });
      }

      await storage.deleteAdmin(adminId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل حذف المسؤول" });
    }
  });

  app.patch("/api/admin/password", requireAdmin, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      }

      const admin = await storage.getAdmin(req.session.userId!);
      if (!admin) {
        return res.status(404).json({ error: "لم يتم العثور على المسؤول" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateAdminPassword(req.session.userId!, hashedPassword);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "فشل تغيير كلمة المرور" });
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
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createAdmin({
          email: "admin@glorda.com",
          password: hashedPassword,
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
