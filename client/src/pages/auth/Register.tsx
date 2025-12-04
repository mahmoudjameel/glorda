import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link, useLocation } from "wouter";
import { Store, Plus, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@assets/شعار_غلوردا_1764881546720.jpg";

const formSchema = z.object({
  ownerName: z.string().min(2, "اسم المالك مطلوب"),
  storeName: z.string().min(3, "اسم المتجر مطلوب"),
  mobile: z.string().min(9, "رقم الجوال غير صالح"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  storeType: z.enum(["company", "institution", "individual"], {
    required_error: "يرجى اختيار نوع المتجر",
  }),
  category: z.enum(["gifts", "flowers", "all"], {
    required_error: "يرجى اختيار فئة المتجر",
  }),
  city: z.string().min(2, "المدينة مطلوبة"),
  registrationNumber: z.string().min(1, "رقم السجل / الوثيقة مطلوب"),
  deliveryMethod: z.enum(["representative", "pickup", "all"], {
    required_error: "يرجى اختيار طريقة التوصيل",
  }),
  branches: z.array(z.object({
    name: z.string().min(1, "اسم الفرع مطلوب"),
    mapLink: z.string().url("رابط قوقل ماب غير صالح"),
  })).optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.deliveryMethod === "pickup" || data.deliveryMethod === "all") {
    return data.branches && data.branches.length > 0;
  }
  return true;
}, {
  message: "يجب إضافة فرع واحد على الأقل",
  path: ["branches"],
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ownerName: "",
      storeName: "",
      mobile: "",
      email: "",
      city: "",
      registrationNumber: "",
      branches: [],
      password: "",
      confirmPassword: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "branches",
  });

  const deliveryMethod = form.watch("deliveryMethod");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log(values);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "تم استلام طلبك بنجاح",
      description: "حسابك قيد المراجعة الآن. سيتم إشعارك عند التفعيل.",
    });
    
    // Redirect to login or a "pending" page
    setLocation("/"); // Redirect to login for now
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-10" dir="rtl">
      {/* Admin Login Button */}
      <Link href="/admin/login">
        <Button variant="outline" className="fixed top-4 left-4 gap-2 hidden md:flex">
          <ShieldCheck className="w-4 h-4" />
          دخول الإدارة
        </Button>
      </Link>

      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-primary">انضم إلى غلوردا</h1>
          <p className="text-muted-foreground">سجل متجرك وابدأ في بيع منتجاتك لآلاف العملاء</p>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader>
            <CardTitle>بيانات المتجر الجديد</CardTitle>
            <CardDescription>الرجاء تعبئة جميع البيانات بدقة لتسريع عملية التفعيل</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Personal & Store Info Section */}
                <div className="grid md:grid-cols-2 gap-6">
                   <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المالك</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم الثلاثي" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المتجر</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم المتجر التجاري" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الجوال</FormLabel>
                        <FormControl>
                          <Input placeholder="05xxxxxxxx" {...field} className="font-mono text-right" />
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
                          <Input placeholder="name@example.com" {...field} className="font-mono text-right" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="storeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الكيان</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع الكيان" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent dir="rtl">
                            <SelectItem value="individual">فرد / عمل حر</SelectItem>
                            <SelectItem value="institution">مؤسسة</SelectItem>
                            <SelectItem value="company">شركة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم السجل / وثيقة العمل الحر</FormLabel>
                        <FormControl>
                          <Input placeholder="70xxxxxxxxx" {...field} className="font-mono text-right" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>فئة المتجر</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفئة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent dir="rtl">
                            <SelectItem value="gifts">هدايا</SelectItem>
                            <SelectItem value="flowers">ورود</SelectItem>
                            <SelectItem value="all">الكل (عام)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة</FormLabel>
                        <FormControl>
                          <Input placeholder="الرياض، جدة..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">طريقة التوصيل / الاستلام</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="representative" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                                <div className="mb-3 rounded-full bg-primary/10 p-2 text-primary">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                                </div>
                                <div className="text-center">
                                  <span className="block font-semibold text-lg">مندوب توصيل</span>
                                  <span className="text-xs text-muted-foreground mt-1 block">توصيل الطلبات للعملاء عبر مندوب المتجر</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="pickup" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                                <div className="mb-3 rounded-full bg-primary/10 p-2 text-primary">
                                  <Store className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                  <span className="block font-semibold text-lg">استلام من الفرع</span>
                                  <span className="text-xs text-muted-foreground mt-1 block">العميل يستلم الطلب من فروعكم</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="md:col-span-2">
                              <FormControl>
                                <RadioGroupItem value="all" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                                <div className="mb-3 rounded-full bg-primary/10 p-2 text-primary">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                </div>
                                <div className="text-center">
                                  <span className="block font-semibold text-lg">الكل (توصيل + استلام)</span>
                                  <span className="text-xs text-muted-foreground mt-1 block">تفعيل جميع خيارات التوصيل والاستلام للعملاء</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(deliveryMethod === "pickup" || deliveryMethod === "all") && (
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Store className="w-5 h-5 text-primary" />
                            الفروع ومواقع الاستلام
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">أضف جميع الفروع التي يمكن للعملاء الاستلام منها</p>
                        </div>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => append({ name: "", mapLink: "" })}
                          className="gap-2 shadow-sm"
                        >
                          <Plus className="w-4 h-4" /> إضافة فرع جديد
                        </Button>
                      </div>
                      
                      {fields.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                            <Store className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">لا توجد فروع مضافة</p>
                          <p className="text-xs text-muted-foreground">يجب إضافة فرع واحد على الأقل للمتابعة</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div key={field.id} className="group relative grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-background/50 hover:bg-background transition-colors">
                              <div className="absolute -left-2 -top-2 md:static md:col-span-2 md:hidden">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-6 w-6 rounded-full shadow-sm"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              <FormField
                                control={form.control}
                                name={`branches.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">اسم الفرع</FormLabel>
                                    <FormControl>
                                      <Input placeholder="مثال: فرع العليا - الرياض" {...field} className="bg-background" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <FormField
                                    control={form.control}
                                    name={`branches.${index}.mapLink`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">رابط الموقع (Google Maps)</FormLabel>
                                        <FormControl>
                                          <Input placeholder="https://maps.google.com/..." {...field} className="bg-background font-mono text-xs" dir="ltr" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hidden md:flex"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
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
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full text-lg py-6 font-display mt-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    "تسجيل حساب جديد"
                  )}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
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
