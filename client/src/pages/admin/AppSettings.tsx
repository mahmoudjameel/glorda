import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Image, Grid3X3, Plus, Trash2, Loader2, Edit, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";

interface Banner {
  id: number;
  title: string;
  image: string;
  link: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  nameEn: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function AppSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [bannerForm, setBannerForm] = useState({
    title: "",
    image: "",
    link: "",
    isActive: true,
    sortOrder: 0
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    nameEn: "",
    icon: "",
    image: "",
    isActive: true,
    sortOrder: 0
  });

  const { data: banners = [], isLoading: loadingBanners } = useQuery<Banner[]>({
    queryKey: ["/api/admin/banners"],
    queryFn: async () => {
      const res = await fetch("/api/admin/banners", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch banners");
      return res.json();
    }
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'category') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("images", files[0]);

    try {
      const res = await fetch("/api/merchant/products/upload-images", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!res.ok) {
        throw new Error("فشل رفع الصورة");
      }

      const data = await res.json();
      const imageUrl = data.images[0];
      
      if (type === 'banner') {
        setBannerForm(prev => ({ ...prev, image: imageUrl }));
      } else {
        setCategoryForm(prev => ({ ...prev, image: imageUrl }));
      }
      toast({ title: "تم رفع الصورة بنجاح" });
    } catch (error: any) {
      toast({ variant: "destructive", title: error.message || "فشل رفع الصورة" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Banner mutations
  const createBannerMutation = useMutation({
    mutationFn: async (data: typeof bannerForm) => {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "تم إضافة البانر بنجاح" });
      setIsAddBannerOpen(false);
      resetBannerForm();
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل إضافة البانر" });
    }
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof bannerForm> }) => {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "تم تحديث البانر بنجاح" });
      setEditingBanner(null);
      resetBannerForm();
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل تحديث البانر" });
    }
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "تم حذف البانر" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل حذف البانر" });
    }
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "تم إضافة القسم بنجاح" });
      setIsAddCategoryOpen(false);
      resetCategoryForm();
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل إضافة القسم" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof categoryForm> }) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "تم تحديث القسم بنجاح" });
      setEditingCategory(null);
      resetCategoryForm();
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل تحديث القسم" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "تم حذف القسم" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل حذف القسم" });
    }
  });

  const resetBannerForm = () => {
    setBannerForm({ title: "", image: "", link: "", isActive: true, sortOrder: 0 });
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", nameEn: "", icon: "", image: "", isActive: true, sortOrder: 0 });
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      image: banner.image,
      link: banner.link || "",
      isActive: banner.isActive,
      sortOrder: banner.sortOrder
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      nameEn: category.nameEn || "",
      icon: category.icon || "",
      image: category.image || "",
      isActive: category.isActive,
      sortOrder: category.sortOrder
    });
  };

  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.image) {
      toast({ variant: "destructive", title: "العنوان والصورة مطلوبان" });
      return;
    }
    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner.id, data: bannerForm });
    } else {
      createBannerMutation.mutate(bannerForm);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast({ variant: "destructive", title: "اسم القسم مطلوب" });
      return;
    }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">إعدادات التطبيق</h2>
          <p className="text-muted-foreground mt-2">إدارة البانرات والأقسام المعروضة في التطبيق</p>
        </div>

        <Tabs defaultValue="banners" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="banners" className="gap-2">
              <Image className="w-4 h-4" />
              البانرات
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Grid3X3 className="w-4 h-4" />
              الأقسام
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banners">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    البانرات
                  </CardTitle>
                  <CardDescription className="mt-2">
                    إدارة صور البانر في الصفحة الرئيسية للتطبيق
                  </CardDescription>
                </div>
                <Dialog open={isAddBannerOpen || !!editingBanner} onOpenChange={(open) => {
                  if (!open) {
                    setIsAddBannerOpen(false);
                    setEditingBanner(null);
                    resetBannerForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={() => setIsAddBannerOpen(true)} data-testid="button-add-banner">
                      <Plus className="w-4 h-4" />
                      إضافة بانر
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBanner ? "تعديل البانر" : "إضافة بانر جديد"}</DialogTitle>
                      <DialogDescription>
                        {editingBanner ? "قم بتعديل بيانات البانر" : "أضف صورة بانر جديدة للصفحة الرئيسية"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBannerSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>العنوان</Label>
                        <Input
                          placeholder="عنوان البانر"
                          value={bannerForm.title}
                          onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                          data-testid="input-banner-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الصورة</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="رابط الصورة"
                            value={bannerForm.image}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, image: e.target.value }))}
                            data-testid="input-banner-image"
                          />
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'banner')}
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "رفع"}
                          </Button>
                        </div>
                        {bannerForm.image && (
                          <img src={bannerForm.image} alt="Preview" className="h-24 rounded-lg object-cover" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>الرابط (اختياري)</Label>
                        <Input
                          placeholder="رابط عند النقر على البانر"
                          value={bannerForm.link}
                          onChange={(e) => setBannerForm(prev => ({ ...prev, link: e.target.value }))}
                          data-testid="input-banner-link"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={bannerForm.isActive}
                          onCheckedChange={(checked) => setBannerForm(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label>نشط</Label>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createBannerMutation.isPending || updateBannerMutation.isPending}>
                          {(createBannerMutation.isPending || updateBannerMutation.isPending) && 
                            <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                          {editingBanner ? "حفظ التعديلات" : "إضافة البانر"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingBanners ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : banners.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">لا توجد بانرات</h3>
                    <p className="text-muted-foreground">قم بإضافة بانر جديد للصفحة الرئيسية</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {banners.map((banner) => (
                      <div key={banner.id} className="border rounded-lg overflow-hidden" data-testid={`card-banner-${banner.id}`}>
                        <img src={banner.image} alt={banner.title} className="w-full h-32 object-cover" />
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{banner.title}</span>
                            <Badge variant={banner.isActive ? "default" : "secondary"}>
                              {banner.isActive ? "نشط" : "معطل"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditBanner(banner)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => deleteBannerMutation.mutate(banner.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="w-5 h-5" />
                    الأقسام
                  </CardTitle>
                  <CardDescription className="mt-2">
                    إدارة أقسام المنتجات في التطبيق
                  </CardDescription>
                </div>
                <Dialog open={isAddCategoryOpen || !!editingCategory} onOpenChange={(open) => {
                  if (!open) {
                    setIsAddCategoryOpen(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={() => setIsAddCategoryOpen(true)} data-testid="button-add-category">
                      <Plus className="w-4 h-4" />
                      إضافة قسم
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCategory ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle>
                      <DialogDescription>
                        {editingCategory ? "قم بتعديل بيانات القسم" : "أضف قسم جديد للتطبيق"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>اسم القسم (عربي)</Label>
                        <Input
                          placeholder="مثال: ورود وهدايا"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="input-category-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>اسم القسم (إنجليزي) - اختياري</Label>
                        <Input
                          placeholder="مثال: Flowers & Gifts"
                          value={categoryForm.nameEn}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, nameEn: e.target.value }))}
                          data-testid="input-category-name-en"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الأيقونة (اختياري)</Label>
                        <Input
                          placeholder="اسم الأيقونة أو إيموجي"
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                          data-testid="input-category-icon"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={categoryForm.isActive}
                          onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label>نشط</Label>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                          {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && 
                            <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                          {editingCategory ? "حفظ التعديلات" : "إضافة القسم"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingCategories ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <Grid3X3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">لا توجد أقسام</h3>
                    <p className="text-muted-foreground">قم بإضافة قسم جديد</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <div key={category.id} className="border rounded-lg p-4" data-testid={`card-category-${category.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {category.icon && <span className="text-2xl">{category.icon}</span>}
                            <div>
                              <div className="font-medium">{category.name}</div>
                              {category.nameEn && <div className="text-sm text-muted-foreground">{category.nameEn}</div>}
                            </div>
                          </div>
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "نشط" : "معطل"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
