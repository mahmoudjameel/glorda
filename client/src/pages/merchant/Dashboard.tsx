import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";

const data = [
  { name: "يناير", total: 1200 },
  { name: "فبراير", total: 2100 },
  { name: "مارس", total: 1800 },
  { name: "أبريل", total: 3200 },
  { name: "مايو", total: 2800 },
  { name: "يونيو", total: 4500 },
];

const StatsCard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold font-display">{value}</div>
      <p className={`text-xs flex items-center mt-1 ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
        <TrendingUp className={`w-3 h-3 mr-1 ${!trendUp && 'rotate-180'}`} />
        {trend}
      </p>
    </CardContent>
  </Card>
);

export default function MerchantDashboard() {
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
            value="45,231.89 ر.س" 
            icon={DollarSign}
            trend="+20.1% من الشهر الماضي"
            trendUp={true}
          />
          <StatsCard 
            title="الطلبات" 
            value="+2350" 
            icon={ShoppingBag}
            trend="+180.1% من الشهر الماضي"
            trendUp={true}
          />
          <StatsCard 
            title="المبيعات" 
            value="+12,234" 
            icon={TrendingUp}
            trend="+19% من الشهر الماضي"
            trendUp={true}
          />
          <StatsCard 
            title="الزوار النشطين" 
            value="+573" 
            icon={Users}
            trend="+201 من الساعة الماضية"
            trendUp={true}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>نظرة عامة على الإيرادات</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
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
                      tickFormatter={(value) => `${value} ر.س`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>المبيعات الأخيرة</CardTitle>
              <CardDescription>
                قمت ببيع 265 منتج هذا الشهر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div className="flex items-center" key={i}>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      OM
                    </div>
                    <div className="mr-4 space-y-1">
                      <p className="text-sm font-medium leading-none">عمر محمد</p>
                      <p className="text-xs text-muted-foreground">omar@example.com</p>
                    </div>
                    <div className="mr-auto font-medium font-mono text-sm">+1,999.00 ر.س</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
