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
import { Search, MoreHorizontal, ShieldCheck, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const merchants = [
  { id: "MER-001", name: "متجر الأناقة", owner: "سارة أحمد", email: "sara@example.com", status: "active", date: "2024-01-15", type: "مؤسسة" },
  { id: "MER-002", name: "تك زون", owner: "خالد عمر", email: "khaled@example.com", status: "active", date: "2024-02-20", type: "شركة" },
  { id: "MER-003", name: "بيتي الجميل", owner: "ليلى مصطفى", email: "laila@example.com", status: "pending", date: "2024-03-10", type: "فرد" },
  { id: "MER-004", name: "عالم الرياضة", owner: "محمد علي", email: "mohamed@example.com", status: "suspended", date: "2024-01-05", type: "مؤسسة" },
  { id: "MER-005", name: "كتب وقهوة", owner: "نورة سعد", email: "nora@example.com", status: "active", date: "2024-04-01", type: "فرد" },
  { id: "MER-006", name: "ورود الربيع", owner: "أحمد كمال", email: "ahmed@example.com", status: "pending", date: "2024-05-20", type: "مؤسسة" },
];

export default function AdminMerchants() {
  const { toast } = useToast();

  const handleApprove = (name: string) => {
    toast({
      title: "تم قبول المتجر",
      description: `تم تفعيل حساب ${name} بنجاح`,
      className: "bg-emerald-50 border-emerald-200 text-emerald-800"
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-display">التجار</h2>
            <p className="text-muted-foreground mt-2">إدارة حسابات التجار والموافقة على الطلبات الجديدة</p>
          </div>
          <Button className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            مراجعة الطلبات المعلقة (2)
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="بحث عن تاجر بالاسم أو البريد..." 
            className="max-w-sm border-none shadow-none focus-visible:ring-0" 
          />
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px] text-right">التاجر</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">تاريخ الانضمام</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://avatar.vercel.sh/${merchant.email}`} />
                        <AvatarFallback>M</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{merchant.name}</span>
                        <span className="text-xs text-muted-foreground">{merchant.owner} ({merchant.email})</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{merchant.type}</TableCell>
                  <TableCell className="font-mono text-sm">{merchant.date}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={
                        merchant.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 
                        merchant.status === 'suspended' ? 'border-red-200 bg-red-50 text-red-700' : 
                        'border-amber-200 bg-amber-50 text-amber-700'
                      }
                    >
                      {
                        merchant.status === 'active' ? 'نشط' : 
                        merchant.status === 'suspended' ? 'موقوف' : 'قيد المراجعة'
                      }
                    </Badge>
                  </TableCell>
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
                          <ShieldCheck className="w-4 h-4" /> تفاصيل الحساب
                        </DropdownMenuItem>
                        
                        {merchant.status === 'pending' && (
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700"
                            onClick={() => handleApprove(merchant.name)}
                          >
                            <CheckCircle className="w-4 h-4" /> قبول المتجر
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                          <Ban className="w-4 h-4" /> إيقاف الحساب
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
