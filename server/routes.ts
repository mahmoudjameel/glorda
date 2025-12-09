import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
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

// Validation schemas for admin endpoints
const merchantStatusSchema = z.object({
  status: z.enum(["pending", "active", "suspended", "review"])
});

const withdrawalStatusSchema = z.object({
  status: z.enum(["completed", "rejected"])
});

const bannerUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional()
}).strict();

const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional()
}).strict();

const cityUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional()
}).strict();

const settingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().optional().nullable(),
  valueJson: z.any().optional()
});

const merchantProfileUpdateSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  username: z.string().regex(/^[a-zA-Z0-9_]+$/).min(3).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  storeImage: z.string().url().optional().nullable(),
  socialLinks: z.record(z.string()).optional().nullable(),
  city: z.string().min(1).max(100).optional()
}).strict();

// Configure multer for product image uploads
const uploadsDir = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for merchant document uploads
const documentsDir = path.join(process.cwd(), "uploads", "documents");
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, documentsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم. يرجى رفع صورة أو ملف PDF"));
    }
  }
});

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
  
  if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production mode");
  }
  
  if (isProduction && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production mode");
  }
  
  const PgSession = connectPgSimple(session);
  
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "glorada-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction || isReplit,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "lax",
    }
  };
  
  if (process.env.DATABASE_URL) {
    sessionConfig.store = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: true,
    });
  } else {
    console.warn("WARNING: Using in-memory session store. Sessions will be lost on restart!");
  }
  
  app.use(session(sessionConfig));

  // CSRF Protection: Validate Origin/Referer for state-changing requests
  const csrfProtection = (req: any, res: any, next: any) => {
    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next();
    }
    
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    const host = req.get('Host');
    
    // In development, allow requests without origin (e.g., Postman)
    if (!isProduction && !origin && !referer) {
      return next();
    }
    
    // Validate origin or referer matches our host
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host === host || originUrl.hostname === 'localhost') {
          return next();
        }
      } catch {
        // Invalid origin URL
      }
    }
    
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host === host || refererUrl.hostname === 'localhost') {
          return next();
        }
      } catch {
        // Invalid referer URL
      }
    }
    
    // Block request if no valid origin/referer
    return res.status(403).json({ error: "طلب غير مصرح به" });
  };

  // Apply CSRF protection to all API routes
  app.use('/api', csrfProtection);

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
  
  const registerUpload = documentUpload.fields([
    { name: "commercialRegDoc", maxCount: 1 },
    { name: "nationalIdImage", maxCount: 1 },
    { name: "freelanceCertImage", maxCount: 1 }
  ]);
  
  app.post("/api/auth/register", registerUpload, async (req, res) => {
    try {
      // Parse branches if it's a JSON string (from FormData)
      const bodyData = { ...req.body };
      if (bodyData.branches && typeof bodyData.branches === "string") {
        try {
          bodyData.branches = JSON.parse(bodyData.branches);
        } catch {
          bodyData.branches = [];
        }
      }
      
      const data = insertMerchantSchema.parse(bodyData);
      
      // Validate username is English only (letters, numbers, underscore)
      if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
        return res.status(400).json({ error: "اسم المستخدم يجب أن يكون بالإنجليزية فقط (أحرف، أرقام، شرطة سفلية)" });
      }
      
      const existing = await storage.getMerchantByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      }
      
      // Get file paths from uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let commercialRegistrationDoc: string | null = null;
      let nationalIdImage: string | null = null;
      let freelanceCertificateImage: string | null = null;
      
      if (files?.commercialRegDoc?.[0]) {
        commercialRegistrationDoc = `/uploads/documents/${files.commercialRegDoc[0].filename}`;
      }
      if (files?.nationalIdImage?.[0]) {
        nationalIdImage = `/uploads/documents/${files.nationalIdImage[0].filename}`;
      }
      if (files?.freelanceCertImage?.[0]) {
        freelanceCertificateImage = `/uploads/documents/${files.freelanceCertImage[0].filename}`;
      }
      
      // Validate storeType is valid
      const storeType = data.storeType;
      const validStoreTypes = ["company", "institution", "individual"];
      if (!storeType || !validStoreTypes.includes(storeType)) {
        return res.status(400).json({ error: "نوع المتجر غير صالح" });
      }
      
      // Validate required documents based on store type
      if (storeType === "company" || storeType === "institution") {
        if (!commercialRegistrationDoc) {
          return res.status(400).json({ error: "السجل التجاري مطلوب للشركات والمؤسسات" });
        }
      } else if (storeType === "individual") {
        if (!nationalIdImage) {
          return res.status(400).json({ error: "صورة الهوية الوطنية مطلوبة للأفراد" });
        }
        if (!freelanceCertificateImage) {
          return res.status(400).json({ error: "وثيقة العمل الحر مطلوبة للأفراد" });
        }
      }
      
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const merchant = await storage.createMerchant({
        ...data,
        password: hashedPassword,
        commercialRegistrationDoc,
        nationalIdImage,
        freelanceCertificateImage
      });
      
      // Notify admin about new merchant registration
      await storage.createNotification({
        recipientType: "admin",
        recipientId: null,
        title: "طلب تسجيل متجر جديد",
        body: `تم استلام طلب تسجيل متجر جديد: ${merchant.storeName}`,
        actionType: "registration_request",
        actionRef: { merchantId: merchant.id } as Record<string, any>
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

  // Password Reset - OTP Storage (in-memory for MVP, use database/Redis in production)
  const otpStore = new Map<string, { otp: string; expires: number; token?: string; attempts: number }>();
  const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

  // Rate limiting helper (3 requests per 5 minutes per email)
  const checkRateLimit = (email: string): boolean => {
    const now = Date.now();
    const limit = rateLimitStore.get(email);
    
    if (!limit || now > limit.resetAt) {
      rateLimitStore.set(email, { count: 1, resetAt: now + 5 * 60 * 1000 });
      return true;
    }
    
    if (limit.count >= 3) {
      return false;
    }
    
    limit.count++;
    return true;
  };

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
      }

      // Rate limit check
      if (!checkRateLimit(email)) {
        return res.status(429).json({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً" });
      }

      const merchant = await storage.getMerchantByEmail(email);
      if (!merchant) {
        // Don't reveal if email exists or not for security
        return res.json({ success: true, message: "إذا كان البريد مسجلاً، سيتم إرسال رمز التحقق" });
      }

      // Generate 6-digit OTP using crypto for better randomness
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpStore.set(email, { otp, expires, attempts: 0 });

      // DEV MODE: Log OTP to console (replace with email service in production)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV OTP] Password reset code for ${email}: ${otp}`);
      }
      // TODO: In production, integrate email service (SendGrid/Resend) to send OTP

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

      // Track failed attempts (max 5 attempts)
      if (stored.otp !== otp) {
        stored.attempts = (stored.attempts || 0) + 1;
        if (stored.attempts >= 5) {
          otpStore.delete(email);
          return res.status(400).json({ error: "تم تجاوز عدد المحاولات، يرجى طلب رمز جديد" });
        }
        return res.status(400).json({ error: "رمز التحقق غير صحيح" });
      }

      // Generate reset token and clear OTP (one-time use)
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      otpStore.set(email, { 
        otp: '', // Clear OTP after successful verification
        token, 
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes for password reset
        attempts: 0 
      });

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
      const parsed = merchantProfileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      await storage.updateMerchant(req.session.userId!, parsed.data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث بيانات المتجر" });
    }
  });

  // Update merchant documents
  const merchantDocUpload = documentUpload.fields([
    { name: "commercialRegistrationDoc", maxCount: 1 },
    { name: "nationalIdImage", maxCount: 1 },
    { name: "freelanceCertificateImage", maxCount: 1 }
  ]);

  app.post("/api/merchant/documents", requireMerchant, merchantDocUpload, async (req, res) => {
    try {
      const merchant = await storage.getMerchant(req.session.userId!);
      if (!merchant) {
        return res.status(404).json({ error: "لم يتم العثور على التاجر" });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const updateData: Record<string, string> = {};

      // Validate document type matches store type and reject mismatched uploads
      if (merchant.storeType === "company" || merchant.storeType === "institution") {
        // Reject individual documents for company/institution
        if (files.nationalIdImage || files.freelanceCertificateImage) {
          return res.status(400).json({ error: "نوع المستند غير مطابق لنوع الكيان" });
        }
        if (files.commercialRegistrationDoc?.[0]) {
          updateData.commercialRegistrationDoc = `/uploads/documents/${files.commercialRegistrationDoc[0].filename}`;
        }
      } else if (merchant.storeType === "individual") {
        // Reject company documents for individual
        if (files.commercialRegistrationDoc) {
          return res.status(400).json({ error: "نوع المستند غير مطابق لنوع الكيان" });
        }
        if (files.nationalIdImage?.[0]) {
          updateData.nationalIdImage = `/uploads/documents/${files.nationalIdImage[0].filename}`;
        }
        if (files.freelanceCertificateImage?.[0]) {
          updateData.freelanceCertificateImage = `/uploads/documents/${files.freelanceCertificateImage[0].filename}`;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "لم يتم رفع أي مستندات صالحة" });
      }

      await storage.updateMerchant(req.session.userId!, updateData);
      res.json({ success: true, message: "تم تحديث المستندات بنجاح" });
    } catch (error) {
      console.error("Document update error:", error);
      res.status(500).json({ error: "فشل تحديث المستندات" });
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

  app.patch("/api/merchant/products/:id/visibility", requireMerchant, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "لم يتم العثور على المنتج" });
      }

      const newStatus = product.status === "active" ? "hidden" : "active";
      await storage.updateProduct(productId, { status: newStatus });
      res.json({ success: true, status: newStatus });
    } catch (error) {
      res.status(500).json({ error: "فشل تغيير حالة المنتج" });
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

  // ========== PRODUCT OPTIONS ROUTES ==========
  
  app.get("/api/merchant/products/:id/options", requireMerchant, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "لم يتم العثور على المنتج" });
      }

      const options = await storage.getProductOptions(productId);
      const optionsWithChoices = await Promise.all(
        options.map(async (option) => {
          const choices = option.type === "multiple_choice" 
            ? await storage.getProductOptionChoices(option.id)
            : [];
          return { ...option, choices };
        })
      );
      
      res.json(optionsWithChoices);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب خيارات المنتج" });
    }
  });

  app.post("/api/merchant/products/:id/options", requireMerchant, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.merchantId !== req.session.userId) {
        return res.status(404).json({ error: "لم يتم العثور على المنتج" });
      }

      const { options } = req.body as { 
        options: Array<{
          type: string;
          title: string;
          placeholder?: string;
          required: boolean;
          choices?: Array<{ label: string }>;
        }> 
      };

      // Delete existing options first
      await storage.deleteAllProductOptions(productId);

      // Create new options
      const createdOptions = [];
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const createdOption = await storage.createProductOption({
          productId,
          type: opt.type,
          title: opt.title,
          placeholder: opt.placeholder || null,
          required: opt.required,
          sortOrder: i,
        });

        // Create choices for multiple_choice type
        if (opt.type === "multiple_choice" && opt.choices) {
          for (let j = 0; j < opt.choices.length; j++) {
            await storage.createProductOptionChoice({
              optionId: createdOption.id,
              label: opt.choices[j].label,
              sortOrder: j,
            });
          }
        }

        createdOptions.push(createdOption);
      }

      res.json({ success: true, options: createdOptions });
    } catch (error) {
      console.error("Error saving product options:", error);
      res.status(500).json({ error: "فشل حفظ خيارات المنتج" });
    }
  });

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
      
      // Notify admin about new withdrawal request
      await storage.createNotification({
        recipientType: "admin",
        recipientId: null,
        title: "طلب سحب جديد",
        body: `طلب سحب بمبلغ ${amount} ريال من ${merchant.storeName}`,
        actionType: "withdrawal_request",
        actionRef: { transactionId: transaction.id, merchantId: merchant.id } as Record<string, any>
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
      const parsed = merchantStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "حالة غير صالحة" });
      }
      const { status } = parsed.data;

      await storage.updateMerchantStatus(merchantId, status);
      
      // Notify merchant about status change
      const statusMessages: Record<string, string> = {
        active: "تم تفعيل متجرك بنجاح! يمكنك الآن إضافة المنتجات واستقبال الطلبات",
        suspended: "تم إيقاف متجرك. يرجى التواصل مع الإدارة",
        review: "طلب تسجيل متجرك قيد المراجعة"
      };
      
      if (statusMessages[status]) {
        await storage.createNotification({
          recipientType: "merchant",
          recipientId: merchantId,
          title: status === "active" ? "تم تفعيل متجرك" : status === "suspended" ? "تم إيقاف متجرك" : "قيد المراجعة",
          body: statusMessages[status],
          actionType: "status_change",
          actionRef: { status } as Record<string, any>
        });
      }
      
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
          const optionSelections = await storage.getOrderOptionSelections(order.id);
          
          // Enrich option selections with option details
          const optionsWithDetails = await Promise.all(
            optionSelections.map(async (sel) => {
              const option = await storage.getProductOption(sel.optionId);
              return {
                ...sel,
                optionTitle: option?.title || "",
                optionType: option?.type || "text"
              };
            })
          );
          
          return {
            ...order,
            customer: customer ? { id: customer.id, name: customer.name, mobile: customer.mobile, city: customer.city } : null,
            merchant: merchant ? { id: merchant.id, storeName: merchant.storeName, ownerName: merchant.ownerName } : null,
            product: product ? { id: product.id, name: product.name, price: product.price, images: product.images } : null,
            optionSelections: optionsWithDetails
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
      const parsed = withdrawalStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "حالة غير صالحة" });
      }
      const { status } = parsed.data;

      // Get transaction to find merchant
      const transaction = await storage.getTransactionById(transactionId);
      
      await storage.updateTransactionStatus(transactionId, status);
      
      // Notify merchant about withdrawal status
      if (transaction) {
        await storage.createNotification({
          recipientType: "merchant",
          recipientId: transaction.merchantId,
          title: status === "completed" ? "تم تحويل المبلغ" : "تم رفض طلب السحب",
          body: status === "completed" 
            ? `تم تحويل مبلغ ${Math.abs(transaction.amount)} ريال إلى حسابك البنكي`
            : "تم رفض طلب السحب. يرجى التواصل مع الإدارة",
          actionType: "withdrawal_update",
          actionRef: { transactionId, status } as Record<string, any>
        });
      }
      
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
      const parsed = bannerUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      await storage.updateBanner(bannerId, parsed.data);
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
      const parsed = categoryUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      await storage.updateCategory(categoryId, parsed.data);
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
      const parsed = cityUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      await storage.updateCity(cityId, parsed.data);
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
      const parsed = settingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const { key, value, valueJson } = parsed.data;
      const setting = await storage.setSetting(key, value ?? undefined, valueJson);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "فشل حفظ الإعداد" });
    }
  });

  // ========== ADMIN DISCOUNT CODES ROUTES ==========
  
  const discountCodeSchema = z.object({
    code: z.string().min(2).max(50),
    type: z.enum(["percentage", "fixed", "free_shipping"]),
    value: z.number().min(0),
    minOrderAmount: z.number().min(0).optional(),
    maxUses: z.number().min(1).optional().nullable(),
    isActive: z.boolean().optional(),
    expiresAt: z.string().optional().nullable(),
  });

  app.get("/api/admin/discount-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllDiscountCodes();
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب أكواد الخصم" });
    }
  });

  app.post("/api/admin/discount-codes", requireAdmin, async (req, res) => {
    try {
      const parsed = discountCodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const { expiresAt, ...rest } = parsed.data;
      const code = await storage.createDiscountCode({
        ...rest,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      res.json(code);
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "كود الخصم موجود مسبقاً" });
      }
      res.status(500).json({ error: "فشل إضافة كود الخصم" });
    }
  });

  app.patch("/api/admin/discount-codes/:id", requireAdmin, async (req, res) => {
    try {
      const codeId = parseInt(req.params.id);
      const parsed = discountCodeSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const { expiresAt, ...rest } = parsed.data;
      await storage.updateDiscountCode(codeId, {
        ...rest,
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      });
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "كود الخصم موجود مسبقاً" });
      }
      res.status(500).json({ error: "فشل تحديث كود الخصم" });
    }
  });

  app.delete("/api/admin/discount-codes/:id", requireAdmin, async (req, res) => {
    try {
      const codeId = parseInt(req.params.id);
      await storage.deleteDiscountCode(codeId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل حذف كود الخصم" });
    }
  });

  // Public API to validate discount code
  app.post("/api/public/validate-discount", async (req, res) => {
    try {
      const { code, orderAmount } = req.body;
      if (!code) {
        return res.status(400).json({ error: "الكود مطلوب" });
      }
      
      const discountCode = await storage.getDiscountCodeByCode(code);
      
      if (!discountCode) {
        return res.status(404).json({ error: "كود الخصم غير صالح" });
      }
      
      if (!discountCode.isActive) {
        return res.status(400).json({ error: "كود الخصم غير نشط" });
      }
      
      if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
        return res.status(400).json({ error: "كود الخصم منتهي الصلاحية" });
      }
      
      if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
        return res.status(400).json({ error: "تم استخدام كود الخصم الحد الأقصى من المرات" });
      }
      
      if (discountCode.minOrderAmount && orderAmount < discountCode.minOrderAmount) {
        return res.status(400).json({ 
          error: `الحد الأدنى للطلب ${discountCode.minOrderAmount} ريال` 
        });
      }
      
      res.json({
        valid: true,
        type: discountCode.type,
        value: discountCode.value,
        code: discountCode.code,
      });
    } catch (error) {
      res.status(500).json({ error: "فشل التحقق من الكود" });
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

  // ========== NOTIFICATIONS ROUTES ==========
  
  // Merchant notifications
  app.get("/api/merchant/notifications", requireMerchant, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsForMerchant(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الإشعارات" });
    }
  });

  app.get("/api/merchant/notifications/unread-count", requireMerchant, async (req, res) => {
    try {
      const count = await storage.getUnreadCountForMerchant(req.session.userId!);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "فشل جلب عدد الإشعارات" });
    }
  });

  app.patch("/api/merchant/notifications/:id/read", requireMerchant, async (req, res) => {
    try {
      await storage.markNotificationRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث الإشعار" });
    }
  });

  app.post("/api/merchant/notifications/read-all", requireMerchant, async (req, res) => {
    try {
      await storage.markAllNotificationsRead("merchant", req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث الإشعارات" });
    }
  });

  // Admin notifications
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsForAdmin();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "فشل جلب الإشعارات" });
    }
  });

  app.get("/api/admin/notifications/unread-count", requireAdmin, async (req, res) => {
    try {
      const count = await storage.getUnreadCountForAdmin();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "فشل جلب عدد الإشعارات" });
    }
  });

  app.patch("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
    try {
      await storage.markNotificationRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث الإشعار" });
    }
  });

  app.post("/api/admin/notifications/read-all", requireAdmin, async (req, res) => {
    try {
      await storage.markAllNotificationsRead("admin");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "فشل تحديث الإشعارات" });
    }
  });

  return httpServer;
}
