import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Store, Camera, Loader2, Save, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Merchant } from "@shared/schema";

export default function MerchantSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [storeName, setStoreName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [storeImage, setStoreImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: profile, isLoading } = useQuery<Merchant>({
    queryKey: ["/api/merchant/profile"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    }
  });

  useEffect(() => {
    if (profile) {
      setStoreName(profile.storeName || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setStoreImage(profile.storeImage || null);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { storeName?: string; username?: string; bio?: string; storeImage?: string }) => {
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
    updateProfileMutation.mutate({
      storeName,
      username,
      bio,
      storeImage: storeImage || undefined
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

            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="w-full"
              data-testid="button-save"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>معلومات الحساب</CardTitle>
            <CardDescription>معلومات إضافية عن حسابك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">اسم المالك</p>
                <p className="font-medium">{profile?.ownerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium font-mono text-sm">{profile?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">رقم الجوال</p>
                <p className="font-medium font-mono" dir="ltr">{profile?.mobile}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">المدينة</p>
                <p className="font-medium">{profile?.city}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              لتعديل هذه المعلومات، يرجى التواصل مع إدارة المنصة
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
