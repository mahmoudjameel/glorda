import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, Users, Plus, Trash2, Loader2, Shield, UserPlus, Tag, Percent, DollarSign, Truck, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface Admin {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

interface DiscountCode {
  id: number;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [discountForm, setDiscountForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed" | "free_shipping",
    value: 0,
    minOrderAmount: 0,
    maxUses: null as number | null,
    isActive: true,
    expiresAt: ""
  });

  const { data: admins = [], isLoading } = useQuery<Admin[]>({
    queryKey: ["/api/admin/admins"],
    queryFn: async () => {
      const res = await fetch("/api/admin/admins", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch admins");
      return res.json();
    }
  });

  const { data: discountCodes = [], isLoading: isLoadingDiscounts } = useQuery<DiscountCode[]>({
    queryKey: ["/api/admin/discount-codes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/discount-codes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch discount codes");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create admin");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "تم إضافة المسؤول بنجاح", className: "bg-emerald-50 border-emerald-200 text-emerald-800" });
      setIsAddOpen(false);
      setFormData({ name: "", email: "", password: "" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete admin");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "تم حذف المسؤول" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/admin/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم تغيير كلمة المرور بنجاح", className: "bg-emerald-50 border-emerald-200 text-emerald-800" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message });
    }
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (data: typeof discountForm) => {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          expiresAt: data.expiresAt || null
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create discount code");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "تم إضافة كود الخصم بنجاح", className: "bg-emerald-50 border-emerald-200 text-emerald-800" });
      setIsDiscountOpen(false);
      resetDiscountForm();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message });
    }
  });

  const updateDiscountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof discountForm> }) => {
      const res = await fetch(`/api/admin/discount-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          expiresAt: data.expiresAt || null
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update discount code");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "تم تحديث كود الخصم بنجاح", className: "bg-emerald-50 border-emerald-200 text-emerald-800" });
      setIsDiscountOpen(false);
      setEditingDiscount(null);
      resetDiscountForm();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message });
    }
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/discount-codes/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete discount code");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "تم حذف كود الخصم" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message });
    }
  });

  const resetDiscountForm = () => {
    setDiscountForm({
      code: "",
      type: "percentage",
      value: 0,
      minOrderAmount: 0,
      maxUses: null,
      isActive: true,
      expiresAt: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast({ variant: "destructive", title: "جميع الحقول مطلوبة" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ variant: "destructive", title: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({ variant: "destructive", title: "جميع الحقول مطلوبة" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ variant: "destructive", title: "كلمتا المرور غير متطابقتان" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ variant: "destructive", title: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.code) {
      toast({ variant: "destructive", title: "اسم الكود مطلوب" });
      return;
    }
    if (discountForm.type !== "free_shipping" && discountForm.value <= 0) {
      toast({ variant: "destructive", title: "قيمة الخصم يجب أن تكون أكبر من صفر" });
      return;
    }
    if (discountForm.type === "percentage" && discountForm.value > 100) {
      toast({ variant: "destructive", title: "نسبة الخصم لا يمكن أن تتجاوز 100%" });
      return;
    }
    
    if (editingDiscount) {
      updateDiscountMutation.mutate({ id: editingDiscount.id, data: discountForm });
    } else {
      createDiscountMutation.mutate(discountForm);
    }
  };

  const openEditDiscount = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setDiscountForm({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minOrderAmount: discount.minOrderAmount || 0,
      maxUses: discount.maxUses,
      isActive: discount.isActive,
      expiresAt: discount.expiresAt ? new Date(discount.expiresAt).toISOString().split("T")[0] : ""
    });
    setIsDiscountOpen(true);
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case "percentage": return "نسبة مئوية";
      case "fixed": return "قيمة ثابتة";
      case "free_shipping": return "شحن مجاني";
      default: return type;
    }
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case "percentage": return <Percent className="w-4 h-4" />;
      case "fixed": return <DollarSign className="w-4 h-4" />;
      case "free_shipping": return <Truck className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">الإعدادات</h2>
          <p className="text-muted-foreground mt-2">إدارة إعدادات الحساب والمسؤولين</p>
        </div>

        <Tabs defaultValue="password" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="password" className="gap-2">
              <Key className="w-4 h-4" />
              كلمة المرور
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              <Users className="w-4 h-4" />
              المسؤولين
            </TabsTrigger>
            <TabsTrigger value="discounts" className="gap-2">
              <Tag className="w-4 h-4" />
              أكواد الخصم
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  تغيير كلمة المرور
                </CardTitle>
                <CardDescription>
                  قم بتغيير كلمة المرور الخاصة بحسابك ({user?.email})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="أدخل كلمة المرور الحالية"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      data-testid="input-current-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="أدخل كلمة المرور الجديدة"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      data-testid="input-new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      data-testid="input-confirm-password"
                    />
                  </div>
                  <Button type="submit" disabled={changePasswordMutation.isPending} data-testid="button-change-password">
                    {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    تغيير كلمة المرور
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    المسؤولين
                  </CardTitle>
                  <CardDescription className="mt-2">
                    إدارة حسابات مسؤولي لوحة التحكم
                  </CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-add-admin">
                      <UserPlus className="w-4 h-4" />
                      إضافة مسؤول
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مسؤول جديد</DialogTitle>
                      <DialogDescription>أدخل بيانات المسؤول الجديد للوصول إلى لوحة التحكم</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم</Label>
                        <Input
                          id="name"
                          placeholder="اسم المسؤول"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="input-admin-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          data-testid="input-admin-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="كلمة مرور قوية"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          data-testid="input-admin-password"
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-admin">
                          {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                          إضافة المسؤول
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">لا يوجد مسؤولين</h3>
                    <p className="text-muted-foreground">قم بإضافة مسؤول جديد للبدء</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">المسؤول</TableHead>
                          <TableHead className="text-right">البريد الإلكتروني</TableHead>
                          <TableHead className="text-right">تاريخ الإضافة</TableHead>
                          <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => (
                          <TableRow key={admin.id} data-testid={`row-admin-${admin.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {admin.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{admin.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{admin.email}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {new Date(admin.createdAt).toLocaleDateString('ar-SA')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteMutation.mutate(admin.id)}
                                disabled={deleteMutation.isPending || admin.id === user?.id}
                                data-testid={`button-delete-admin-${admin.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discounts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    أكواد الخصم
                  </CardTitle>
                  <CardDescription className="mt-2">
                    إدارة أكواد الخصم للتطبيق
                  </CardDescription>
                </div>
                <Dialog open={isDiscountOpen} onOpenChange={(open) => {
                  setIsDiscountOpen(open);
                  if (!open) {
                    setEditingDiscount(null);
                    resetDiscountForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-add-discount">
                      <Plus className="w-4 h-4" />
                      إضافة كود خصم
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingDiscount ? "تعديل كود الخصم" : "إضافة كود خصم جديد"}</DialogTitle>
                      <DialogDescription>
                        {editingDiscount ? "عدّل بيانات كود الخصم" : "أدخل بيانات كود الخصم الجديد"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDiscountSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="discountCode">اسم الكود</Label>
                        <Input
                          id="discountCode"
                          placeholder="مثال: SAVE20"
                          value={discountForm.code}
                          onChange={(e) => setDiscountForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          data-testid="input-discount-code"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>نوع الخصم</Label>
                        <Select
                          value={discountForm.type}
                          onValueChange={(value: "percentage" | "fixed" | "free_shipping") => 
                            setDiscountForm(prev => ({ ...prev, type: value, value: value === "free_shipping" ? 0 : prev.value }))
                          }
                        >
                          <SelectTrigger data-testid="select-discount-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              <div className="flex items-center gap-2">
                                <Percent className="w-4 h-4" />
                                نسبة مئوية
                              </div>
                            </SelectItem>
                            <SelectItem value="fixed">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                قيمة ثابتة
                              </div>
                            </SelectItem>
                            <SelectItem value="free_shipping">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                شحن مجاني
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {discountForm.type !== "free_shipping" && (
                        <div className="space-y-2">
                          <Label htmlFor="discountValue">
                            {discountForm.type === "percentage" ? "نسبة الخصم (%)" : "قيمة الخصم (ريال)"}
                          </Label>
                          <Input
                            id="discountValue"
                            type="number"
                            min="0"
                            max={discountForm.type === "percentage" ? 100 : undefined}
                            placeholder={discountForm.type === "percentage" ? "مثال: 20" : "مثال: 50"}
                            value={discountForm.value || ""}
                            onChange={(e) => setDiscountForm(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                            data-testid="input-discount-value"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="minOrderAmount">الحد الأدنى للطلب (ريال) - اختياري</Label>
                        <Input
                          id="minOrderAmount"
                          type="number"
                          min="0"
                          placeholder="مثال: 100"
                          value={discountForm.minOrderAmount || ""}
                          onChange={(e) => setDiscountForm(prev => ({ ...prev, minOrderAmount: parseInt(e.target.value) || 0 }))}
                          data-testid="input-min-order"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxUses">الحد الأقصى للاستخدام - اختياري</Label>
                        <Input
                          id="maxUses"
                          type="number"
                          min="1"
                          placeholder="اتركه فارغاً لاستخدام غير محدود"
                          value={discountForm.maxUses || ""}
                          onChange={(e) => setDiscountForm(prev => ({ ...prev, maxUses: e.target.value ? parseInt(e.target.value) : null }))}
                          data-testid="input-max-uses"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiresAt">تاريخ الانتهاء - اختياري</Label>
                        <Input
                          id="expiresAt"
                          type="date"
                          value={discountForm.expiresAt}
                          onChange={(e) => setDiscountForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                          data-testid="input-expires-at"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isActive">نشط</Label>
                        <Switch
                          id="isActive"
                          checked={discountForm.isActive}
                          onCheckedChange={(checked) => setDiscountForm(prev => ({ ...prev, isActive: checked }))}
                          data-testid="switch-is-active"
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={createDiscountMutation.isPending || updateDiscountMutation.isPending} 
                          data-testid="button-submit-discount"
                        >
                          {(createDiscountMutation.isPending || updateDiscountMutation.isPending) && 
                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          }
                          {editingDiscount ? "حفظ التغييرات" : "إضافة الكود"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingDiscounts ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : discountCodes.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">لا توجد أكواد خصم</h3>
                    <p className="text-muted-foreground">قم بإضافة كود خصم جديد للبدء</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الكود</TableHead>
                          <TableHead className="text-right">النوع</TableHead>
                          <TableHead className="text-right">القيمة</TableHead>
                          <TableHead className="text-right">الاستخدام</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {discountCodes.map((discount) => (
                          <TableRow key={discount.id} data-testid={`row-discount-${discount.id}`}>
                            <TableCell className="font-mono font-bold">{discount.code}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getDiscountTypeIcon(discount.type)}
                                {getDiscountTypeLabel(discount.type)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {discount.type === "percentage" ? `${discount.value}%` :
                               discount.type === "fixed" ? `${discount.value} ريال` : "-"}
                            </TableCell>
                            <TableCell>
                              {discount.maxUses 
                                ? `${discount.usedCount}/${discount.maxUses}`
                                : `${discount.usedCount} (غير محدود)`
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={discount.isActive ? "default" : "secondary"}>
                                {discount.isActive ? "نشط" : "غير نشط"}
                              </Badge>
                              {discount.expiresAt && new Date(discount.expiresAt) < new Date() && (
                                <Badge variant="destructive" className="mr-2">منتهي</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDiscount(discount)}
                                  data-testid={`button-edit-discount-${discount.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => deleteDiscountMutation.mutate(discount.id)}
                                  disabled={deleteDiscountMutation.isPending}
                                  data-testid={`button-delete-discount-${discount.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
