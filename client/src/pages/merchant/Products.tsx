import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Plus, Search, MoreHorizontal, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

const products = [
  { id: "PROD-001", name: "قميص قطني فاخر", price: "120.00", stock: 45, status: "active", category: "ملابس" },
  { id: "PROD-002", name: "ساعة ذكية رياضية", price: "450.00", stock: 12, status: "active", category: "إلكترونيات" },
  { id: "PROD-003", name: "حذاء رياضي مريح", price: "299.00", stock: 0, status: "out_of_stock", category: "أحذية" },
  { id: "PROD-004", name: "سماعات بلوتوث", price: "180.00", stock: 23, status: "active", category: "إلكترونيات" },
  { id: "PROD-005", name: "حقيبة ظهر جلدية", price: "320.00", stock: 8, status: "low_stock", category: "اكسسوارات" },
];

export default function MerchantProducts() {
  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-display">المنتجات</h2>
            <p className="text-muted-foreground mt-2">إدارة منتجات متجرك وتتبع المخزون</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader className="text-right">
                <DialogTitle>إضافة منتج جديد</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل المنتج الجديد هنا. اضغط حفظ عند الانتهاء.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">اسم المنتج</Label>
                  <Input id="name" placeholder="مثال: قميص قطني" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">السعر</Label>
                    <Input id="price" type="number" placeholder="0.00" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">الكمية</Label>
                    <Input id="stock" type="number" placeholder="0" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Input id="category" placeholder="ملابس، إلكترونيات..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">حفظ المنتج</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="بحث عن منتج..." 
            className="max-w-sm border-none shadow-none focus-visible:ring-0" 
          />
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] text-right">المعرف</TableHead>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">السعر</TableHead>
                <TableHead className="text-right">المخزون</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium font-mono text-muted-foreground text-xs">{product.id}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        product.status === 'active' ? 'default' : 
                        product.status === 'out_of_stock' ? 'destructive' : 'secondary'
                      }
                      className={
                        product.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                        product.status === 'low_stock' ? 'bg-amber-500 hover:bg-amber-600' : ''
                      }
                    >
                      {
                        product.status === 'active' ? 'نشط' : 
                        product.status === 'out_of_stock' ? 'نفذت الكمية' : 'مخزون منخفض'
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{product.price} ر.س</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Edit className="w-4 h-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                          <Trash className="w-4 h-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
