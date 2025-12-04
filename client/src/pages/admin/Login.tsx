import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import logoUrl from "@assets/شعار_غلوردا_1764881546720.jpg";

const formSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Mock login delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, you would validate admin credentials here
    console.log("Admin login attempt:", values);
    
    setLocation("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-display">إدارة النظام</h1>
          <p className="text-muted-foreground text-sm">تسجيل الدخول المخصص لمشرفي النظام</p>
        </div>

        <Card className="border-muted/40 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بيانات المشرف للمتابعة</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@glorada.com" {...field} className="font-mono text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                          <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full py-6 mt-2" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "الدخول للوحة التحكم"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            هذه الصفحة مخصصة للموظفين المصرح لهم فقط.
          </p>
        </div>
      </div>
    </div>
  );
}
