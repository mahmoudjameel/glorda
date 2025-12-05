import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Shield, BookOpen, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface AppSetting {
  id: number;
  key: string;
  value: string | null;
  valueJson: any;
  updatedAt: string;
}

export default function AdminPolicies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  const [aboutUs, setAboutUs] = useState("");

  const { data: settings = [], isLoading } = useQuery<AppSetting[]>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    }
  });

  useEffect(() => {
    if (settings.length > 0) {
      const privacy = settings.find(s => s.key === "privacy_policy");
      const terms = settings.find(s => s.key === "terms_conditions");
      const about = settings.find(s => s.key === "about_us");
      
      if (privacy?.value) setPrivacyPolicy(privacy.value);
      if (terms?.value) setTermsConditions(terms.value);
      if (about?.value) setAboutUs(about.value);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) throw new Error("Failed to save setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "تم الحفظ بنجاح", className: "bg-emerald-50 border-emerald-200 text-emerald-800" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل الحفظ" });
    }
  });

  const handleSavePrivacy = () => {
    saveMutation.mutate({ key: "privacy_policy", value: privacyPolicy });
  };

  const handleSaveTerms = () => {
    saveMutation.mutate({ key: "terms_conditions", value: termsConditions });
  };

  const handleSaveAbout = () => {
    saveMutation.mutate({ key: "about_us", value: aboutUs });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">السياسات والشروط</h2>
          <p className="text-muted-foreground mt-2">إدارة سياسة الخصوصية والشروط والأحكام ومعلومات التطبيق</p>
        </div>

        <Tabs defaultValue="privacy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="w-4 h-4" />
              سياسة الخصوصية
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-2">
              <FileText className="w-4 h-4" />
              الشروط والأحكام
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <BookOpen className="w-4 h-4" />
              عن التطبيق
            </TabsTrigger>
          </TabsList>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  سياسة الخصوصية
                </CardTitle>
                <CardDescription>
                  سياسة الخصوصية المعروضة في صفحة "حسابي" في التطبيق
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>محتوى سياسة الخصوصية</Label>
                  <Textarea
                    placeholder="اكتب سياسة الخصوصية هنا..."
                    value={privacyPolicy}
                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                    className="min-h-[300px] font-sans"
                    data-testid="textarea-privacy"
                  />
                </div>
                <Button 
                  onClick={handleSavePrivacy} 
                  disabled={saveMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-privacy"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الشروط والأحكام
                </CardTitle>
                <CardDescription>
                  الشروط والأحكام المعروضة في صفحة "حسابي" في التطبيق
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>محتوى الشروط والأحكام</Label>
                  <Textarea
                    placeholder="اكتب الشروط والأحكام هنا..."
                    value={termsConditions}
                    onChange={(e) => setTermsConditions(e.target.value)}
                    className="min-h-[300px] font-sans"
                    data-testid="textarea-terms"
                  />
                </div>
                <Button 
                  onClick={handleSaveTerms} 
                  disabled={saveMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-terms"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  عن التطبيق
                </CardTitle>
                <CardDescription>
                  معلومات عن التطبيق المعروضة في صفحة "حسابي" في التطبيق
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>محتوى صفحة عن التطبيق</Label>
                  <Textarea
                    placeholder="اكتب معلومات عن التطبيق هنا..."
                    value={aboutUs}
                    onChange={(e) => setAboutUs(e.target.value)}
                    className="min-h-[300px] font-sans"
                    data-testid="textarea-about"
                  />
                </div>
                <Button 
                  onClick={handleSaveAbout} 
                  disabled={saveMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-about"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
