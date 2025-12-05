import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { MapPin, Plus, Trash2, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface City {
  id: number;
  name: string;
  nameEn: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function AdminCities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    isActive: true,
    sortOrder: 0
  });

  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ["/api/admin/cities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cities", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cities");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create city");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      toast({ title: "تم إضافة المدينة بنجاح", className: "bg-emerald-50 border-emerald-200 text-emerald-800" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل إضافة المدينة" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/admin/cities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update city");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      toast({ title: "تم تحديث المدينة بنجاح" });
      setEditingCity(null);
      resetForm();
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل تحديث المدينة" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/cities/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete city");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      toast({ title: "تم حذف المدينة" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل حذف المدينة" });
    }
  });

  const resetForm = () => {
    setFormData({ name: "", nameEn: "", isActive: true, sortOrder: 0 });
  };

  const handleEdit = (city: City) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      nameEn: city.nameEn || "",
      isActive: city.isActive,
      sortOrder: city.sortOrder
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ variant: "destructive", title: "اسم المدينة مطلوب" });
      return;
    }
    if (editingCity) {
      updateMutation.mutate({ id: editingCity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-display">المدن</h2>
            <p className="text-muted-foreground mt-2">إدارة المدن المتاحة في التطبيق</p>
          </div>
          
          <Dialog open={isAddOpen || !!editingCity} onOpenChange={(open) => {
            if (!open) {
              setIsAddOpen(false);
              setEditingCity(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setIsAddOpen(true)} data-testid="button-add-city">
                <Plus className="w-4 h-4" />
                إضافة مدينة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCity ? "تعديل المدينة" : "إضافة مدينة جديدة"}</DialogTitle>
                <DialogDescription>
                  {editingCity ? "قم بتعديل بيانات المدينة" : "أضف مدينة جديدة للتطبيق"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المدينة (عربي)</Label>
                  <Input
                    id="name"
                    placeholder="مثال: الرياض"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-city-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">اسم المدينة (إنجليزي) - اختياري</Label>
                  <Input
                    id="nameEn"
                    placeholder="مثال: Riyadh"
                    value={formData.nameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                    data-testid="input-city-name-en"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">ترتيب العرض</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    placeholder="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    data-testid="input-city-order"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>نشط</Label>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-city">
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    {editingCity ? "حفظ التعديلات" : "إضافة المدينة"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              قائمة المدن
            </CardTitle>
            <CardDescription>
              المدن المتاحة للعملاء والتجار في التطبيق
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : cities.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">لا توجد مدن</h3>
                <p className="text-muted-foreground">قم بإضافة مدينة جديدة للبدء</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم (عربي)</TableHead>
                      <TableHead className="text-right">الاسم (إنجليزي)</TableHead>
                      <TableHead className="text-right">الترتيب</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.map((city) => (
                      <TableRow key={city.id} data-testid={`row-city-${city.id}`}>
                        <TableCell className="font-medium">{city.name}</TableCell>
                        <TableCell className="text-muted-foreground">{city.nameEn || "-"}</TableCell>
                        <TableCell>{city.sortOrder}</TableCell>
                        <TableCell>
                          <Badge variant={city.isActive ? "default" : "secondary"}>
                            {city.isActive ? "نشط" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(city)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteMutation.mutate(city.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-city-${city.id}`}
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
      </div>
    </DashboardLayout>
  );
}
