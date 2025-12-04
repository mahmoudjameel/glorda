import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Facebook, Twitter, Globe, Save } from "lucide-react";

export default function MerchantSocials() {
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
              <Input placeholder="https://instagram.com/your-store" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-sky-500" /> تويتر (X)
              </Label>
              <Input placeholder="https://twitter.com/your-store" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" /> فيسبوك
              </Label>
              <Input placeholder="https://facebook.com/your-store" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-600" /> الموقع الإلكتروني
              </Label>
              <Input placeholder="https://your-store.com" dir="ltr" />
            </div>
            
            <div className="space-y-2">
               <Label className="flex items-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4f/TikTok_logo.svg" className="w-4 h-4" /> تيك توك
              </Label>
               <Input placeholder="https://tiktok.com/@your-store" dir="ltr" />
            </div>

            <Button className="w-full md:w-auto gap-2">
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
