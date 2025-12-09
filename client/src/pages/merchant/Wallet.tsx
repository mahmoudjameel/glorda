import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, DollarSign, Loader2, Activity } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Merchant } from "@shared/schema";

export default function MerchantWallet() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<Merchant>({
    queryKey: ["/api/merchant/profile"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    }
  });

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/merchant/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/transactions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch("/api/merchant/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to request withdrawal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/profile"] });
      setWithdrawAmount("");
      toast({ title: "تم إرسال طلب السحب بنجاح" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    }
  });

  const balance = profile?.balance || 0;
  const feePercentage = 5;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.round(parseFloat(withdrawAmount) * 100);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "المبلغ غير صالح" });
      return;
    }
    // Send the net amount after 5% fee deduction
    const netAmount = Math.floor(amount * (100 - feePercentage) / 100);
    withdrawMutation.mutate(netAmount);
  };
  const fees = Math.floor(balance * feePercentage / 100);
  const netBalance = balance - fees;
  const pendingWithdrawals = transactions
    .filter(t => t.type === "withdrawal" && t.status === "pending")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const completedWithdrawals = transactions
    .filter(t => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
              <div className="text-3xl font-bold font-mono" data-testid="text-balance">
                {(balance / 100).toFixed(2)} ر.س
              </div>
              <div className="mt-3 pt-3 border-t border-primary-foreground/20 space-y-1">
                <div className="flex justify-between text-xs text-primary-foreground/70">
                  <span>رسوم ({feePercentage}%)</span>
                  <span className="font-mono">- {(fees / 100).toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>الصافي بعد الخصم</span>
                  <span className="font-mono" data-testid="text-net-balance">{(netBalance / 100).toFixed(2)} ر.س</span>
                </div>
              </div>
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
              <div className="text-3xl font-bold font-mono" data-testid="text-completed-withdrawals">
                {(completedWithdrawals / 100).toFixed(2)} ر.س
              </div>
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
              <div className="text-3xl font-bold font-mono" data-testid="text-pending-withdrawals">
                {(pendingWithdrawals / 100).toFixed(2)} ر.س
              </div>
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
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد عمليات بعد
                  </div>
                ) : (
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
                        <TableRow key={trx.id} data-testid={`row-transaction-${trx.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-full ${trx.type === 'sale' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {trx.type === 'sale' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{trx.description}</span>
                                <span className="text-xs text-muted-foreground font-mono">#{trx.id}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {new Date(trx.createdAt).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={trx.status === 'completed' ? 'outline' : 'secondary'} 
                              className={trx.status === 'completed' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-amber-600 bg-amber-50'}
                            >
                              {trx.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-mono font-medium ${trx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {trx.amount > 0 ? '+' : ''}{(trx.amount / 100).toFixed(2)} ر.س
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>طلب سحب رصيد</CardTitle>
                <CardDescription>تحويل الأرباح لحسابك البنكي</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-2">
                    <Label>المبلغ المراد سحبه (ر.س)</Label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="0.00" 
                        className="pr-9 font-mono"
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        data-testid="input-withdraw-amount"
                      />
                    </div>
                    {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>المبلغ</span>
                          <span className="font-mono">{parseFloat(withdrawAmount).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>رسوم ({feePercentage}%)</span>
                          <span className="font-mono text-red-500">- {(parseFloat(withdrawAmount) * feePercentage / 100).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-1">
                          <span>المبلغ بعد الخصم</span>
                          <span className="font-mono text-primary">{(parseFloat(withdrawAmount) * (100 - feePercentage) / 100).toFixed(2)} ر.س</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>الحساب البنكي</Label>
                    {profile?.bankName && profile?.iban ? (
                      <div className="p-3 border rounded-md bg-muted/50 flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium font-mono" dir="ltr">{profile.iban}</p>
                          <p className="text-xs text-muted-foreground">{profile.bankName} - {profile.accountHolderName}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border rounded-md bg-amber-50 border-amber-200 text-amber-700 text-sm">
                        لم يتم إضافة بيانات الحساب البنكي بعد. يرجى التواصل مع الإدارة لتحديث البيانات.
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-2" 
                    type="submit"
                    disabled={withdrawMutation.isPending}
                    data-testid="button-withdraw"
                  >
                    {withdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال طلب السحب"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    تستغرق معالجة الطلبات 24-48 ساعة عمل
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
