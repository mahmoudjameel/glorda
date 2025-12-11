import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Search, Loader2, Send, User, Package, ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearch, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  getMerchantOrders,
  getOrderMessages,
  addOrderMessage,
  type Order,
  type OrderMessage
} from "@/lib/merchant-data";

// Helper function to format Firebase Timestamp or Date
const formatFirebaseDate = (date: any, format: 'time' | 'date' = 'time'): string => {
  if (!date) return 'غير محدد';

  try {
    let dateObj: Date;

    if (date && typeof date === 'object' && 'seconds' in date) {
      dateObj = new Date(date.seconds * 1000);
    } else if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      return 'غير محدد';
    }

    if (format === 'time') {
      return dateObj.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    }
    return dateObj.toLocaleDateString('ar-SA');
  } catch {
    return 'غير محدد';
  }
};

interface Conversation extends Order {
  messagesCount?: number;
  lastMessage?: OrderMessage | null;
}

export default function MerchantMessages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const merchantId = user?.id;

  // Fetch orders as conversations
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["merchant-orders", merchantId],
    queryFn: () => getMerchantOrders(merchantId!),
    enabled: !!merchantId,
  });

  // Convert orders to conversations
  const conversations: Conversation[] = orders.map(order => ({
    ...order,
    messagesCount: 0,
    lastMessage: null,
  }));

  useEffect(() => {
    if (conversations.length > 0 && searchString) {
      const params = new URLSearchParams(searchString);
      const orderId = params.get("orderId");
      if (orderId) {
        const conversation = conversations.find(c => c.id === orderId);
        if (conversation) {
          setSelectedConversation(conversation);
          setLocation("/dashboard/messages", { replace: true });
        }
      }
    }
  }, [conversations, searchString, setLocation]);

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<OrderMessage[]>({
    queryKey: ["order-messages", selectedConversation?.id],
    queryFn: () => getOrderMessages(selectedConversation!.id),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ orderId, message }: { orderId: string; message: string }) => {
      await addOrderMessage(orderId, merchantId!, "merchant", message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-messages", selectedConversation?.id] });
      setNewMessage("");
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل إرسال الرسالة" });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.customerId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      orderId: selectedConversation.id,
      message: newMessage.trim()
    });
  };

  return (
    <DashboardLayout role="merchant">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display">الرسائل</h2>
          <p className="text-muted-foreground mt-2">تواصل مع العملاء بخصوص طلباتهم</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5" />
                المحادثات
              </CardTitle>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                  data-testid="input-search-conversations"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-400px)]" data-testid="conversations-list">
                {isLoading ? (
                  <div className="flex justify-center py-12" data-testid="loading-conversations">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4" data-testid="empty-conversations">
                    <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">لا توجد محادثات</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-3 rounded-lg text-right transition-colors ${selectedConversation?.id === conv.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                          }`}
                        data-testid={`button-conversation-${conv.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="font-medium truncate" data-testid={`text-customer-name-${conv.id}`}>
                                طلب #{conv.orderNumber || conv.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground truncate" data-testid={`text-order-info-${conv.id}`}>
                                {conv.status} - {(conv.totalAmount || 0).toFixed(2)} ر.س
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {conv.status}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">طلب #{selectedConversation.orderNumber || selectedConversation.id}</CardTitle>
                        <CardDescription className="text-xs">
                          {selectedConversation.status} - {(selectedConversation.totalAmount || 0).toFixed(2)} ر.س
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{selectedConversation.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-4" data-testid="messages-area">
                    {isLoadingMessages ? (
                      <div className="flex justify-center py-12" data-testid="loading-messages">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12" data-testid="empty-messages">
                        <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">لا توجد رسائل بعد</p>
                        <p className="text-xs text-muted-foreground mt-1">ابدأ المحادثة مع العميل</p>
                      </div>
                    ) : (
                      <div className="space-y-4" data-testid="messages-list">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderType === "merchant" ? "justify-start" : "justify-end"}`}
                            data-testid={`message-${msg.id}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-2xl ${msg.senderType === "merchant"
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : "bg-muted rounded-tl-sm"
                                }`}
                            >
                              <p className="text-sm" data-testid={`text-message-content-${msg.id}`}>{msg.message}</p>
                              <p className={`text-[10px] mt-1 ${msg.senderType === "merchant" ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`} data-testid={`text-message-time-${msg.id}`}>
                                {formatFirebaseDate(msg.createdAt, 'time')}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="اكتب رسالتك..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="min-h-[44px] max-h-[120px] resize-none"
                        data-testid="input-message"
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        data-testid="button-send-message"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg">اختر محادثة</h3>
                  <p className="text-muted-foreground text-sm">اختر محادثة من القائمة للبدء</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
