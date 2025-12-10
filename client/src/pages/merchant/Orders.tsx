import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingBag, Search, Loader2, Eye, User, Package, MapPin, Phone, Calendar, CreditCard, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getMerchantOrders, updateOrderStatus, type Order } from "@/lib/merchant-data";

type OrderWithDetails = Order;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قيد الانتظار", variant: "secondary" },
  processing: { label: "قيد التجهيز", variant: "default" },
  shipped: { label: "تم الشحن", variant: "default" },
  delivered: { label: "تم التسليم", variant: "default" },
  completed: { label: "مكتمل", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
  rescheduled: { label: "إعادة جدولة", variant: "outline" },
  not_received: { label: "عدم استلام الطلب", variant: "destructive" },
};

const statusOptions = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "processing", label: "قيد التجهيز" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
  { value: "rescheduled", label: "إعادة جدولة" },
  { value: "not_received", label: "عدم استلام الطلب" },
];

export default function MerchantOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleMessageCustomer = (orderId: number, orderNumber: string) => {
    setLocation(`/dashboard/messages?orderId=${orderId}&orderNumber=${orderNumber}`);
  };

  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["merchant-orders", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMerchantOrders(user!.id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-orders", user?.id] });
      toast({ title: "تم تحديث حالة الطلب بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل تحديث حالة الطلب" });
    }
  });

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.customer?.name && order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (order.product?.name && order.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-display">الطلبات</h2>
            <p className="text-muted-foreground mt-2">إدارة طلبات متجرك</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {orders.length} طلب
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{orders.filter(o => o.status === "pending").length}</div>
              <p className="text-xs text-muted-foreground">قيد الانتظار</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{orders.filter(o => o.status === "processing").length}</div>
              <p className="text-xs text-muted-foreground">قيد التجهيز</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{orders.filter(o => o.status === "completed").length}</div>
              <p className="text-xs text-muted-foreground">مكتمل</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {orders.reduce((sum, o) => sum + (o.isPaid ? o.totalAmount : 0), 0)} ر.س
              </div>
              <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              قائمة الطلبات
            </CardTitle>
            <CardDescription>
              الطلبات الواردة لمتجرك مع تفاصيل العميل والمنتج
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الطلب، العميل أو المنتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                  data-testid="input-search-orders"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12" data-testid="loading-orders">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20" data-testid="empty-orders">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">لا يوجد طلبات</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "لا توجد نتائج للبحث" : "لم تستلم أي طلبات بعد"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border" data-testid="table-orders">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الدفع</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-mono font-medium" data-testid={`text-order-number-${order.id}`}>
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span data-testid={`text-customer-${order.id}`}>{order.customer?.name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="max-w-[150px] truncate" data-testid={`text-product-${order.id}`}>{order.product?.name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-quantity-${order.id}`}>{order.quantity}</TableCell>
                        <TableCell className="font-medium" data-testid={`text-amount-${order.id}`}>
                          {order.totalAmount} ر.س
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateStatusMutation.mutate({ orderId: order.id, status: value })}
                          >
                            <SelectTrigger className="w-[130px]" data-testid={`select-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value} data-testid={`option-status-${option.value}`}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.isPaid ? "default" : "outline"} data-testid={`status-paid-${order.id}`}>
                            {order.isPaid ? "مدفوع" : "غير مدفوع"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm" data-testid={`text-date-${order.id}`}>
                          {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                              data-testid={`button-view-order-${order.id}`}
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMessageCustomer(order.id, order.orderNumber)}
                              data-testid={`button-message-customer-${order.id}`}
                              title="رسالة للعميل"
                            >
                              <MessageCircle className="w-4 h-4" />
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

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب #{selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    بيانات العميل
                  </h4>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <p><strong>الاسم:</strong> {selectedOrder.customer?.name || "-"}</p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${selectedOrder.customer?.mobile}`} className="text-primary hover:underline">
                        {selectedOrder.customer?.mobile || "-"}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {selectedOrder.customer?.city || "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    بيانات المنتج
                  </h4>
                  <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-4">
                    {selectedOrder.product?.images && selectedOrder.product.images[0] && (
                      <img
                        src={selectedOrder.product.images[0]}
                        alt={selectedOrder.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="space-y-2">
                      <p><strong>المنتج:</strong> {selectedOrder.product?.name || "-"}</p>
                      <p><strong>السعر:</strong> {selectedOrder.product?.price} ر.س</p>
                      <p><strong>الكمية:</strong> {selectedOrder.quantity}</p>
                      <p><strong>الإجمالي:</strong> {selectedOrder.totalAmount} ر.س</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border space-y-2">
                    <h4 className="font-semibold text-sm">الحالة</h4>
                    <Badge variant={statusMap[selectedOrder.status]?.variant || "secondary"}>
                      {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg border space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4" />
                      الدفع
                    </h4>
                    <Badge variant={selectedOrder.isPaid ? "default" : "outline"}>
                      {selectedOrder.isPaid ? "مدفوع" : "غير مدفوع"}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg border space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      التاريخ
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedOrder.createdAt), "dd MMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </div>

                {selectedOrder.customerNote && (
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">ملاحظات العميل</h4>
                    <p className="text-muted-foreground">{selectedOrder.customerNote}</p>
                  </div>
                )}

                {selectedOrder.deliveryAddress && (
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      عنوان التوصيل
                    </h4>
                    <p className="text-muted-foreground">{selectedOrder.deliveryAddress}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
