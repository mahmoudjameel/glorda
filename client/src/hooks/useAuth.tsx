import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";

interface User {
  id: number;
  email: string;
  name?: string;
  storeName?: string;
  ownerName?: string;
}

interface AuthContextType {
  user: User | null;
  userType: "merchant" | "admin" | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"merchant" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUserType(data.type);
      } else {
        setUser(null);
        setUserType(null);
      }
    } catch {
      setUser(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setUserType(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      isLoading,
      isAuthenticated: !!user,
      logout,
      refetch: fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: ReactNode; 
  requiredRole: "merchant" | "admin" 
}) {
  const { isAuthenticated, userType, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(requiredRole === "admin" ? "/admin/login" : "/");
      } else if (userType !== requiredRole) {
        navigate(requiredRole === "admin" ? "/admin/login" : "/");
      }
    }
  }, [isAuthenticated, userType, isLoading, requiredRole, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || userType !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
