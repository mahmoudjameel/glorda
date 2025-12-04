import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useLocation } from "wouter";
import { Store } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Mock login for prototype
    if (values.email.includes("admin")) {
      setLocation("/admin");
    } else {
      setLocation("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
              <Store className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-display">مرحباً بعودتك</h1>
          <p className="text-muted-foreground">الرجاء تسجيل الدخول للمتابعة إلى لوحة التحكم</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بريدك الإلكتروني وكلمة المرور</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} className="bg-background/50" />
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
                        <Input type="password" placeholder="••••••••" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full text-base py-5 font-display">
                  تسجيل الدخول
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                سجل الآن كتاجر
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
