import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link, useLocation } from "wouter";
import { Store, Plus, Trash2, Loader2, ChevronsUpDown, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@assets/شعار_غلوردا_1764881546720.jpg";
import { saudiCities } from "@/constants/saudiCities";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  ownerName: z.string().min(2, "اسم المالك مطلوب"),
  storeName: z.string().min(3, "اسم المتجر مطلوب"),
  username: z.string().min(3, "اسم المستخدم مطلوب").regex(/^[a-zA-Z0-9_]+$/, "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط"),
  mobile: z.string().min(9, "رقم الجوال غير صالح"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  storeType: z.enum(["company", "institution", "individual"], {
    required_error: "يرجى اختيار نوع المتجر",
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
  bankName: z.string().min(2, "اسم البنك مطلوب"),
  iban: z.string().min(15, "رقم الآيبان غير صالح").max(34, "رقم الآيبان غير صالح"),
  accountHolderName: z.string().min(2, "اسم صاحب الحساب مطلوب"),
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ownerName: "",
      storeName: "",
      username: "",
      mobile: "",
      email: "",
      city: "",
      registrationNumber: "",
      branches: [],
      bankName: "",
      iban: "",
      accountHolderName: "",
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
    
    try {
      const { confirmPassword, ...registerData } = values;
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "خطأ في التسجيل",
          description: data.error || "حدث خطأ ما",
        });
        return;
      }
      
      toast({
        title: "تم استلام طلبك بنجاح",
        description: "حسابك قيد المراجعة الآن. سيتم إشعارك عند التفعيل.",
      });
      
      setLocation("/");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-10" dir="rtl">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" data-testid="img-logo" />
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
                
                <div className="grid md:grid-cols-2 gap-6">
                   <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المالك</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم الثلاثي" {...field} data-testid="input-owner-name" />
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
                          <Input placeholder="اسم المتجر التجاري" {...field} data-testid="input-store-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="store_name" {...field} className="font-mono text-left" dir="ltr" data-testid="input-username" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">سيكون رابط متجرك: glorda.com/{field.value || "username"}</p>
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
                          <Input placeholder="05xxxxxxxx" {...field} className="font-mono text-right" data-testid="input-mobile" />
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
                          <Input placeholder="name@example.com" {...field} className="font-mono text-right" data-testid="input-email" />
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
                            <SelectTrigger data-testid="select-store-type">
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
                          <Input placeholder="70xxxxxxxxx" {...field} className="font-mono text-right" data-testid="input-registration-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>المدينة</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="select-city"
                            >
                              {field.value
                                ? saudiCities.find((city) => city.nameAr === field.value)?.nameAr + " - " + saudiCities.find((city) => city.nameAr === field.value)?.nameEn
                                : "اختر المدينة"}
                              <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start" dir="rtl">
                          <Command dir="rtl">
                            <CommandInput placeholder="ابحث عن مدينة..." className="text-right" />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على مدينة</CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-y-auto">
                                {saudiCities.map((city, index) => (
                                  <CommandItem
                                    value={city.nameAr + " " + city.nameEn}
                                    key={`${city.nameAr}-${city.nameEn}-${index}`}
                                    onSelect={() => {
                                      field.onChange(city.nameAr);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "ml-2 h-4 w-4",
                                        city.nameAr === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {city.nameAr} - {city.nameEn}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all" data-testid="radio-representative">
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
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all" data-testid="radio-pickup">
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
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all" data-testid="radio-all">
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
                          data-testid="button-add-branch"
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
                                  data-testid={`button-remove-branch-${index}`}
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
                                      <Input placeholder="مثال: فرع العليا - الرياض" {...field} className="bg-background" data-testid={`input-branch-name-${index}`} />
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
                                          <Input placeholder="https://maps.google.com/..." {...field} className="bg-background font-mono text-xs" dir="ltr" data-testid={`input-branch-map-${index}`} />
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
                                  data-testid={`button-remove-branch-desktop-${index}`}
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

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                      البيانات البنكية
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">لتحويل أرباحك من المبيعات</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم البنك</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: البنك الأهلي" {...field} data-testid="input-bank-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountHolderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم صاحب الحساب</FormLabel>
                          <FormControl>
                            <Input placeholder="الاسم كما يظهر في الحساب البنكي" {...field} data-testid="input-account-holder" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="iban"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>رقم الآيبان (IBAN)</FormLabel>
                          <FormControl>
                            <Input placeholder="SA0000000000000000000000" {...field} className="font-mono text-left" dir="ltr" data-testid="input-iban" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              className="pl-10"
                              data-testid="input-password" 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
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
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              className="pl-10"
                              data-testid="input-confirm-password" 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              data-testid="button-toggle-confirm-password"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-display rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-200 mt-4" disabled={isSubmitting} data-testid="button-submit">
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
              <Link href="/" className="text-primary hover:underline font-medium" data-testid="link-login">
                سجل دخولك هنا
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
