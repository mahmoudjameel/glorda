import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Facebook, Twitter, Globe, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
  tiktok?: string;
}

interface MerchantProfile {
  id: number;
  storeName: string;
  socialLinks: SocialLinks | null;
}

export default function MerchantSocials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [links, setLinks] = useState<SocialLinks>({
    instagram: "",
    twitter: "",
    facebook: "",
    website: "",
    tiktok: ""
  });

  const { data: profile, isLoading, isError } = useQuery<MerchantProfile>({
    queryKey: ["/api/merchant/profile"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    }
  });

  useEffect(() => {
    if (profile?.socialLinks) {
      setLinks({
        instagram: profile.socialLinks.instagram || "",
        twitter: profile.socialLinks.twitter || "",
        facebook: profile.socialLinks.facebook || "",
        website: profile.socialLinks.website || "",
        tiktok: profile.socialLinks.tiktok || ""
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (socialLinks: SocialLinks) => {
      const res = await fetch("/api/merchant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialLinks })
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/profile"] });
      toast({
        title: "تم حفظ التغييرات بنجاح",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "فشل حفظ التغييرات"
      });
    }
  });

  const handleSave = () => {
    const cleanLinks: SocialLinks = {};
    if (links.instagram?.trim()) cleanLinks.instagram = links.instagram.trim();
    if (links.twitter?.trim()) cleanLinks.twitter = links.twitter.trim();
    if (links.facebook?.trim()) cleanLinks.facebook = links.facebook.trim();
    if (links.website?.trim()) cleanLinks.website = links.website.trim();
    if (links.tiktok?.trim()) cleanLinks.tiktok = links.tiktok.trim();
    saveMutation.mutate(cleanLinks);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="merchant">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout role="merchant">
        <div className="text-center py-12">
          <p className="text-destructive">فشل تحميل البيانات. يرجى تحديث الصفحة.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">وسائل التواصل الاجتماعي</h2>
          <p className="text-muted-foreground mt-2">اربط حسابات التواصل الخاصة بمتجرك لتظهر للعملاء في التطبيق</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>روابط الحسابات</CardTitle>
            <CardDescription>
              أدخل روابط حساباتك في المنصات المختلفة. اترك الحقل فارغاً إذا لم يوجد حساب.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-600" /> انستقرام
              </Label>
              <Input 
                placeholder="https://instagram.com/your-store" 
                dir="ltr"
                value={links.instagram}
                onChange={(e) => setLinks(prev => ({ ...prev, instagram: e.target.value }))}
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
                value={links.twitter}
                onChange={(e) => setLinks(prev => ({ ...prev, twitter: e.target.value }))}
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
                value={links.facebook}
                onChange={(e) => setLinks(prev => ({ ...prev, facebook: e.target.value }))}
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
                value={links.website}
                onChange={(e) => setLinks(prev => ({ ...prev, website: e.target.value }))}
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
                value={links.tiktok}
                onChange={(e) => setLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                data-testid="input-tiktok"
              />
            </div>

            <Button 
              className="w-full md:w-auto gap-2"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              data-testid="button-save-socials"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
