import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Users, Store, TrendingUp, Activity } from "lucide-react";

const data = [
  { name: "يناير", merchants: 40, users: 240 },
  { name: "فبراير", merchants: 55, users: 380 },
  { name: "مارس", merchants: 85, users: 680 },
  { name: "أبريل", merchants: 120, users: 980 },
  { name: "مايو", merchants: 160, users: 1300 },
  { name: "يونيو", merchants: 210, users: 1800 },
];

const StatsCard = ({ title, value, icon: Icon, description }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold font-display">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {description}
      </p>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">لوحة الإدارة</h2>
          <p className="text-muted-foreground mt-2">مراقبة أداء المنصة والتجار والمستخدمين</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="إجمالي التجار" 
            value="210" 
            icon={Store}
            description="+15 تاجر جديد هذا الشهر"
          />
          <StatsCard 
            title="المستخدمين النشطين" 
            value="1,800" 
            icon={Users}
            description="+340 مستخدم جديد"
          />
          <StatsCard 
            title="حجم العمليات" 
            value="1.2M ر.س" 
            icon={Activity}
            description="+24% نمو في الإيرادات"
          />
          <StatsCard 
            title="معدل النمو" 
            value="18.2%" 
            icon={TrendingUp}
            description="نمو ثابت في الربع الأخير"
          />
        </div>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>نمو المنصة</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
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
                  <Line 
                    type="monotone" 
                    dataKey="merchants" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--chart-2))" }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
