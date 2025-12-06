import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function MerchantTerms() {
  const { data: termsData, isLoading, error, refetch } = useQuery<{ key: string; value: string | null }>({
    queryKey: ["/api/public/settings/merchant_terms_conditions"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings/merchant_terms_conditions");
      if (!res.ok) throw new Error("Failed to fetch terms");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always"
  });

  if (isLoading) {
    return (
      <DashboardLayout role="merchant">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="merchant">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">حدث خطأ أثناء تحميل الشروط والأحكام</p>
          <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة المحاولة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const termsContent = termsData?.value || "لا توجد شروط وأحكام متاحة حالياً.";

  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display" data-testid="text-page-title">الشروط والأحكام</h1>
          <p className="text-muted-foreground mt-1">اطلع على شروط وأحكام استخدام منصة غلوردا</p>
        </div>

        <Card data-testid="card-terms">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>شروط وأحكام التجار</CardTitle>
                <CardDescription>يرجى قراءة الشروط والأحكام بعناية</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-6 border">
              <div 
                className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap"
                data-testid="text-terms-content"
              >
                {termsContent}
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>بتسجيلك في المنصة فإنك توافق على هذه الشروط والأحكام</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
