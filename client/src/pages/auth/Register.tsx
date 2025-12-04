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
  storeName: z.string().min(3, { message: "اسم المتجر يجب أن يكون 3 أحرف على الأقل" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export default function Register() {
  const [, setLocation] = useLocation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    setLocation("/dashboard");
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
          <h1 className="text-3xl font-bold tracking-tight font-display">انضم إلينا</h1>
          <p className="text-muted-foreground">ابدأ رحلتك في التجارة الإلكترونية اليوم</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>إنشاء حساب تاجر جديد</CardTitle>
            <CardDescription>أدخل بيانات متجرك للبدء</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المتجر</FormLabel>
                      <FormControl>
                        <Input placeholder="متجر الأناقة" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <div className="grid grid-cols-2 gap-4">
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد الكلمة</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="bg-background/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full text-base py-5 font-display mt-2">
                  إنشاء الحساب
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link href="/" className="text-primary hover:underline font-medium">
                سجل دخولك هنا
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
