import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { DollarSign, ShoppingBag, Package, Loader2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface MerchantStats {
  productsCount: number;
  ordersCount: number;
  pendingOrders: number;
  completedOrders: number;
  totalSales: number;
  balance: number;
  recentOrders: any[];
  recentTransactions: any[];
}

const StatsCard = ({ title, value, icon: Icon, description, loading }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : (
        <>
          <div className="text-2xl font-bold font-display" data-testid={`stat-${title}`}>{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const orderStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  ready: "جاهز",
  delivered: "تم التسليم",
  completed: "مكتمل",
  cancelled: "ملغي"
};

const orderStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-cyan-100 text-cyan-800",
  delivered: "bg-emerald-100 text-emerald-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function MerchantDashboard() {
  const { data: stats, isLoading } = useQuery<MerchantStats>({
    queryKey: ["/api/merchant/stats"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const chartData = [
    { name: "المنتجات", total: stats?.productsCount || 0 },
    { name: "الطلبات", total: stats?.ordersCount || 0 },
    { name: "المكتملة", total: stats?.completedOrders || 0 },
    { name: "المعلقة", total: stats?.pendingOrders || 0 }
  ];

  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">نظرة عامة</h2>
          <p className="text-muted-foreground mt-2">أهلاً بك في لوحة تحكم متجرك. إليك ملخص أداء اليوم.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="إجمالي المبيعات" 
            value={`${((stats?.totalSales || 0) / 100).toFixed(2)} ر.س`}
            icon={DollarSign}
            description="مجموع المبيعات المكتملة"
            loading={isLoading}
          />
          <StatsCard 
            title="الرصيد الحالي" 
            value={`${((stats?.balance || 0) / 100).toFixed(2)} ر.س`}
            icon={DollarSign}
            description="المتاح للسحب"
            loading={isLoading}
          />
          <StatsCard 
            title="المنتجات" 
            value={stats?.productsCount || 0}
            icon={Package}
            description="عدد المنتجات في متجرك"
            loading={isLoading}
          />
          <StatsCard 
            title="الطلبات" 
            value={stats?.ordersCount || 0}
            icon={ShoppingBag}
            description={`${stats?.pendingOrders || 0} طلبات معلقة`}
            loading={isLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>نظرة عامة</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>أحدث الطلبات</CardTitle>
              <CardDescription>
                آخر الطلبات الواردة لمتجرك
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentOrders.map((order: any) => (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" key={order.id} data-testid={`order-card-${order.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">طلب #{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={orderStatusColors[order.status]}>
                          {orderStatusLabels[order.status]}
                        </Badge>
                        <span className="text-sm font-mono">{(order.totalAmount / 100).toFixed(2)} ر.س</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">لا توجد طلبات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
