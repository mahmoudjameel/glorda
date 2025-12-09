import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Search, Loader2, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface ProductWithMerchant {
  id: number;
  merchantId: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  productType: string;
  category: string | null;
  status: string;
  promoBadge: string | null;
  images: string[] | null;
  createdAt: string;
  merchant: {
    id: number;
    storeName: string;
  } | null;
}

const productTypeLabels: Record<string, string> = {
  flowers: "زهور",
  gifts: "هدايا"
};

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [], isLoading } = useQuery<ProductWithMerchant[]>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const res = await fetch("/api/admin/products", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }
  });

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.merchant?.storeName && product.merchant.storeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-display">المنتجات</h2>
            <p className="text-muted-foreground mt-2">جميع منتجات المتاجر</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {products.length} منتج
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              قائمة المنتجات
            </CardTitle>
            <CardDescription>
              جميع المنتجات مع تفاصيل المتجر والسعر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم، المتجر أو الفئة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                  data-testid="input-search-products"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12" data-testid="loading-products">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20" data-testid="empty-products">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">لا يوجد منتجات</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "لا توجد نتائج للبحث" : "لم يتم إضافة أي منتجات بعد"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="grid-products">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className="aspect-square relative bg-muted">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <Badge 
                          variant={
                            product.status === 'active' ? 'default' : 
                            product.status === 'out_of_stock' ? 'destructive' : 'secondary'
                          }
                          className={`text-xs ${
                            product.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                            product.status === 'low_stock' ? 'bg-amber-500 hover:bg-amber-600' : ''
                          }`}
                        >
                          {
                            product.status === 'active' ? 'نشط' : 
                            product.status === 'out_of_stock' ? 'نفذت الكمية' : 'مخزون منخفض'
                          }
                        </Badge>
                      </div>
                      {product.promoBadge && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-primary text-xs">{product.promoBadge}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate mb-1">{product.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Store className="w-3 h-3" />
                        <span className="truncate">{product.merchant?.storeName || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-xs ${product.productType === 'flowers' ? 'border-pink-300 text-pink-600' : 'border-amber-300 text-amber-600'}`}>
                          {productTypeLabels[product.productType] || product.productType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">المخزون: {product.stock}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary text-sm">{(product.price / 100).toFixed(2)} ر.س</span>
                        {product.category && (
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
