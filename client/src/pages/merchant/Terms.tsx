import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Shield, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SettingData {
  key: string;
  value: string | null;
}

export default function MerchantTerms() {
  const { data: termsData, isLoading: termsLoading, error: termsError, refetch: refetchTerms } = useQuery<SettingData>({
    queryKey: ["/api/public/settings/merchant_terms_conditions"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings/merchant_terms_conditions");
      if (!res.ok) throw new Error("Failed to fetch terms");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always"
  });

  const { data: privacyData, isLoading: privacyLoading } = useQuery<SettingData>({
    queryKey: ["/api/public/settings/merchant_privacy_policy"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings/merchant_privacy_policy");
      if (!res.ok) throw new Error("Failed to fetch privacy");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always"
  });

  const { data: aboutData, isLoading: aboutLoading } = useQuery<SettingData>({
    queryKey: ["/api/public/settings/merchant_about_us"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings/merchant_about_us");
      if (!res.ok) throw new Error("Failed to fetch about");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always"
  });

  const isLoading = termsLoading || privacyLoading || aboutLoading;

  if (isLoading) {
    return (
      <DashboardLayout role="merchant">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  if (termsError) {
    return (
      <DashboardLayout role="merchant">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">حدث خطأ أثناء تحميل البيانات</p>
          <Button onClick={() => refetchTerms()} variant="outline" data-testid="button-retry">
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة المحاولة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const termsContent = termsData?.value || "لا توجد شروط وأحكام متاحة حالياً.";
  const privacyContent = privacyData?.value || "لا توجد سياسة خصوصية متاحة حالياً.";
  const aboutContent = aboutData?.value || "لا توجد معلومات متاحة حالياً.";

  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display" data-testid="text-page-title">السياسات والشروط</h1>
          <p className="text-muted-foreground mt-1">اطلع على سياسات وشروط استخدام منصة غلوردا</p>
        </div>

        <Tabs defaultValue="terms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="terms" className="gap-2" data-testid="tab-terms">
              <FileText className="w-4 h-4" />
              الشروط والأحكام
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2" data-testid="tab-privacy">
              <Shield className="w-4 h-4" />
              سياسة الخصوصية
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2" data-testid="tab-about">
              <BookOpen className="w-4 h-4" />
              من نحن
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <Card data-testid="card-terms">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>الشروط والأحكام</CardTitle>
                    <CardDescription>شروط وأحكام استخدام منصة غلوردا للتجار</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-6 border min-h-[300px]">
                  <div 
                    className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap"
                    data-testid="text-terms-content"
                  >
                    {termsContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card data-testid="card-privacy">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle>سياسة الخصوصية</CardTitle>
                    <CardDescription>كيف نحمي بياناتك ونحافظ على خصوصيتك</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-6 border min-h-[300px]">
                  <div 
                    className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap"
                    data-testid="text-privacy-content"
                  >
                    {privacyContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card data-testid="card-about">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>من نحن</CardTitle>
                    <CardDescription>تعرف على منصة غلوردا ورؤيتنا</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-6 border min-h-[300px]">
                  <div 
                    className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap"
                    data-testid="text-about-content"
                  >
                    {aboutContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
