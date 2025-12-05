import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Camera, Loader2, Save, User, Instagram, Facebook, Twitter, Globe, MapPin, Wallet, Building2, CreditCard, UserCircle, Mail, Phone } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Merchant } from "@shared/schema";

interface City {
  id: number;
  name: string;
  nameEn: string | null;
  isActive: boolean;
}

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
  tiktok?: string;
}

export default function MerchantSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [storeName, setStoreName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [storeImage, setStoreImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: "",
    twitter: "",
    facebook: "",
    website: "",
    tiktok: ""
  });
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const { data: profile, isLoading } = useQuery<Merchant>({
    queryKey: ["/api/merchant/profile"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    }
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/public/cities"],
    queryFn: async () => {
      const res = await fetch("/api/public/cities");
      if (!res.ok) throw new Error("Failed to fetch cities");
      return res.json();
    }
  });

  useEffect(() => {
    if (profile) {
      setStoreName(profile.storeName || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setCity(profile.city || "");
      setStoreImage(profile.storeImage || null);
      setBankName(profile.bankName || "");
      setIban(profile.iban || "");
      setAccountHolderName(profile.accountHolderName || "");
      setOwnerName(profile.ownerName || "");
      setEmail(profile.email || "");
      setMobile(profile.mobile || "");
      if (profile.socialLinks) {
        setSocialLinks({
          instagram: (profile.socialLinks as SocialLinks).instagram || "",
          twitter: (profile.socialLinks as SocialLinks).twitter || "",
          facebook: (profile.socialLinks as SocialLinks).facebook || "",
          website: (profile.socialLinks as SocialLinks).website || "",
          tiktok: (profile.socialLinks as SocialLinks).tiktok || ""
        });
      }
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { 
      storeName?: string; 
      username?: string; 
      bio?: string; 
      storeImage?: string;
      city?: string;
      socialLinks?: SocialLinks;
      bankName?: string;
      iban?: string;
      accountHolderName?: string;
      ownerName?: string;
      email?: string;
      mobile?: string;
    }) => {
      const res = await fetch("/api/merchant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/profile"] });
      toast({ title: "تم حفظ التغييرات بنجاح" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "حجم الصورة كبير جداً", description: "الحد الأقصى 5 ميجابايت" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("images", file);

    try {
      const res = await fetch("/api/merchant/products/upload-images", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!res.ok) throw new Error("Failed to upload image");
      
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        setStoreImage(data.images[0]);
        toast({ title: "تم رفع الصورة بنجاح" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "فشل رفع الصورة" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const cleanLinks: SocialLinks = {};
    if (socialLinks.instagram?.trim()) cleanLinks.instagram = socialLinks.instagram.trim();
    if (socialLinks.twitter?.trim()) cleanLinks.twitter = socialLinks.twitter.trim();
    if (socialLinks.facebook?.trim()) cleanLinks.facebook = socialLinks.facebook.trim();
    if (socialLinks.website?.trim()) cleanLinks.website = socialLinks.website.trim();
    if (socialLinks.tiktok?.trim()) cleanLinks.tiktok = socialLinks.tiktok.trim();

    updateProfileMutation.mutate({
      storeName,
      username,
      bio,
      city,
      storeImage: storeImage || undefined,
      socialLinks: Object.keys(cleanLinks).length > 0 ? cleanLinks : undefined,
      bankName: bankName.trim() || undefined,
      iban: iban.trim() || undefined,
      accountHolderName: accountHolderName.trim() || undefined,
      ownerName: ownerName.trim() || undefined,
      email: email.trim() || undefined,
      mobile: mobile.trim() || undefined
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="merchant">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8 max-w-2xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">إعدادات المتجر</h2>
          <p className="text-muted-foreground mt-2">تعديل معلومات وصورة متجرك</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              الملف الشخصي للمتجر
            </CardTitle>
            <CardDescription>
              هذه المعلومات ستظهر للعملاء في صفحة متجرك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={storeImage || undefined} alt={storeName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                    <Store className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 left-0 rounded-full shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-upload-image"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <p className="text-sm text-muted-foreground">اضغط على الكاميرا لتغيير صورة المتجر</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">اسم المتجر</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="اسم متجرك"
                  data-testid="input-store-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="store_name"
                      className="pr-10 font-mono text-left"
                      dir="ltr"
                      data-testid="input-username"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">رابط متجرك: glorda.com/{username || "username"}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  المدينة
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger data-testid="select-city">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.name} data-testid={`option-city-${c.id}`}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">نبذة عن المتجر</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="اكتب نبذة قصيرة عن متجرك ومنتجاتك..."
                  rows={4}
                  className="resize-none"
                  data-testid="input-bio"
                />
                <p className="text-xs text-muted-foreground">{bio.length}/500 حرف</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              وسائل التواصل الاجتماعي
            </CardTitle>
            <CardDescription>
              أدخل روابط حساباتك في المنصات المختلفة لتظهر للعملاء في التطبيق
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-600" /> انستقرام
              </Label>
              <Input 
                placeholder="https://instagram.com/your-store" 
                dir="ltr"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                data-testid="input-instagram"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-sky-500" /> تويتر (X)
              </Label>
              <Input 
                placeholder="https://twitter.com/your-store" 
                dir="ltr"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                data-testid="input-twitter"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" /> فيسبوك
              </Label>
              <Input 
                placeholder="https://facebook.com/your-store" 
                dir="ltr"
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
                data-testid="input-facebook"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-600" /> الموقع الإلكتروني
              </Label>
              <Input 
                placeholder="https://your-store.com" 
                dir="ltr"
                value={socialLinks.website}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                data-testid="input-website"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                تيك توك
              </Label>
              <Input 
                placeholder="https://tiktok.com/@your-store" 
                dir="ltr"
                value={socialLinks.tiktok}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                data-testid="input-tiktok"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              بيانات المحفظة البنكية
            </CardTitle>
            <CardDescription>
              أدخل بياناتك البنكية لاستلام أرباحك عند طلب السحب
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                اسم البنك
              </Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="مثال: البنك الأهلي السعودي"
                data-testid="input-bank-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                رقم الآيبان (IBAN)
              </Label>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="SA0000000000000000000000"
                className="font-mono text-left"
                dir="ltr"
                maxLength={24}
                data-testid="input-iban"
              />
              <p className="text-xs text-muted-foreground">رقم الآيبان السعودي يتكون من 24 حرف ورقم</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolderName" className="flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                اسم المستفيد (صاحب الحساب)
              </Label>
              <Input
                id="accountHolderName"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="الاسم كما هو مسجل في البنك"
                data-testid="input-account-holder"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              معلومات الحساب
            </CardTitle>
            <CardDescription>تعديل بيانات حسابك الشخصية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                اسم المالك
              </Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="الاسم الكامل"
                data-testid="input-owner-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="font-mono text-left"
                dir="ltr"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                رقم الجوال
              </Label>
              <Input
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="05xxxxxxxx"
                className="font-mono text-left"
                dir="ltr"
                data-testid="input-mobile"
              />
            </div>

          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={updateProfileMutation.isPending}
          className="w-full"
          size="lg"
          data-testid="button-save"
        >
          {updateProfileMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <Save className="w-4 h-4 ml-2" />
          )}
          حفظ جميع التغييرات
        </Button>
      </div>
    </DashboardLayout>
  );
}
