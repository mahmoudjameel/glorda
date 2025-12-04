import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, DollarSign } from "lucide-react";

const transactions = [
  { id: "TRX-9821", type: "sale", amount: "+450.00", date: "2024-05-01", status: "completed", desc: "طلب #1023" },
  { id: "TRX-9822", type: "sale", amount: "+120.00", date: "2024-05-02", status: "completed", desc: "طلب #1024" },
  { id: "TRX-9823", type: "withdrawal", amount: "-1,000.00", date: "2024-05-05", status: "pending", desc: "سحب أرباح" },
  { id: "TRX-9824", type: "sale", amount: "+850.00", date: "2024-05-06", status: "completed", desc: "طلب #1025" },
  { id: "TRX-9825", type: "sale", amount: "+210.00", date: "2024-05-07", status: "completed", desc: "طلب #1026" },
];

export default function MerchantWallet() {
  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">المحفظة الإلكترونية</h2>
          <p className="text-muted-foreground mt-2">متابعة الأرباح وطلب السحوبات المالية</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80">الرصيد الحالي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">3,450.00 ر.س</div>
              <p className="text-xs mt-2 text-primary-foreground/60 flex items-center">
                <Wallet className="w-3 h-3 ml-1" />
                متاح للسحب
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي السحوبات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">12,000.00 ر.س</div>
              <p className="text-xs mt-2 text-muted-foreground flex items-center">
                <ArrowUpRight className="w-3 h-3 ml-1 text-emerald-500" />
                تم تحويلها لحسابك البنكي
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">معلق</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">1,000.00 ر.س</div>
              <p className="text-xs mt-2 text-muted-foreground flex items-center">
                <Activity className="w-3 h-3 ml-1 text-amber-500" />
                بانتظار موافقة الإدارة
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>سجل العمليات</CardTitle>
                <CardDescription>آخر الحركات المالية على محفظتك</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العملية</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((trx) => (
                      <TableRow key={trx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-full ${trx.type === 'sale' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {trx.type === 'sale' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{trx.desc}</span>
                              <span className="text-xs text-muted-foreground font-mono">{trx.id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{trx.date}</TableCell>
                        <TableCell>
                          <Badge variant={trx.status === 'completed' ? 'outline' : 'secondary'} className={trx.status === 'completed' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-amber-600 bg-amber-50'}>
                            {trx.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-mono font-medium ${trx.type === 'sale' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {trx.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>طلب سحب رصيد</CardTitle>
                <CardDescription>تحويل الأرباح لحسابك البنكي</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>المبلغ المراد سحبه</Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="0.00" className="pr-9 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الحساب البنكي</Label>
                  <div className="p-3 border rounded-md bg-muted/50 flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">SA56 8000 0000 0000 1234</p>
                      <p className="text-xs text-muted-foreground">Al Rajhi Bank</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-2">إرسال طلب السحب</Button>
                <p className="text-xs text-muted-foreground text-center pt-2">
                  تستغرق معالجة الطلبات 24-48 ساعة عمل
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { Activity } from "lucide-react";
