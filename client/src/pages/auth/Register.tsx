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
  deliveryMethod: z.enum(["representative", "pickup"], {
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
  if (data.deliveryMethod === "pickup") {
    return data.branches && data.branches.length > 0;
  }
  return true;
}, {
  message: "يجب إضافة فرع واحد على الأقل عند اختيار الاستلام من الفرع",
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

                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>طريقة التوصيل / الاستلام</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-x-reverse">
                              <FormControl>
                                <RadioGroupItem value="representative" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                مندوب خاص بالمتجر (توصيل للعميل)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-x-reverse">
                              <FormControl>
                                <RadioGroupItem value="pickup" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                الاستلام من الفرع (Pickup)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {deliveryMethod === "pickup" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-primary">الفروع ومواقع الاستلام</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ name: "", mapLink: "" })}
                          className="gap-2"
                        >
                          <Plus className="w-3 h-3" /> إضافة فرع
                        </Button>
                      </div>
                      
                      {fields.length === 0 && (
                        <p className="text-sm text-destructive text-center py-2 bg-destructive/10 rounded-md">يجب إضافة فرع واحد على الأقل</p>
                      )}

                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                            <div className="col-span-5">
                              <FormField
                                control={form.control}
                                name={`branches.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="اسم الفرع (مثال: فرع العليا)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="col-span-6">
                              <FormField
                                control={form.control}
                                name={`branches.${index}.mapLink`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="رابط قوقل ماب" {...field} className="font-mono text-xs" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive/80"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
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
