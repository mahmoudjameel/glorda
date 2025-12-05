import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Link, useLocation, useSearch } from "wouter";
import { KeyRound, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@assets/شعار_غلوردا_1764881546720.jpg";

const formSchema = z.object({
  otp: z.string().length(6, { message: "رمز التحقق يجب أن يكون 6 أرقام" }),
});

export default function VerifyOTP() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const email = params.get("email") || "";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: values.otp }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: data.error || "رمز التحقق غير صحيح",
        });
        return;
      }
      
      toast({
        title: "تم التحقق بنجاح",
        description: "يمكنك الآن إعادة تعيين كلمة المرور",
      });
      
      setLocation(`/reset-password?email=${encodeURIComponent(email)}&token=${data.token}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل الاتصال بالخادم",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendOTP() {
    setIsResending(true);
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        toast({
          title: "تم إعادة إرسال الرمز",
          description: "تحقق من بريدك الإلكتروني",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل إعادة إرسال الرمز",
      });
    } finally {
      setIsResending(false);
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">لم يتم تحديد البريد الإلكتروني</p>
            <Link href="/forgot-password">
              <Button>العودة</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-display text-primary">التحقق من الرمز</h1>
          <p className="text-muted-foreground text-sm">
            أدخل الرمز المرسل إلى<br />
            <span className="font-mono text-foreground">{email}</span>
          </p>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <div className="h-1 bg-primary w-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              رمز التحقق
            </CardTitle>
            <CardDescription>أدخل الرمز المكون من 6 أرقام</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel>رمز التحقق</FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} {...field} data-testid="input-otp">
                          <InputOTPGroup dir="ltr" className="gap-2">
                            <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                            <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                            <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                            <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                            <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                            <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-verify">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <KeyRound className="w-4 h-4 ml-2" />
                  )}
                  تحقق من الرمز
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 space-y-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={resendOTP}
                disabled={isResending}
                data-testid="button-resend"
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 ml-2" />
                )}
                إعادة إرسال الرمز
              </Button>
              
              <div className="text-center">
                <Link href="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                  <ArrowRight className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
