import { ReactNode } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Home, Settings, Users, BarChart3, Send, AlertTriangle } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Layout({ children, title, showBack, onBack }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-gradient-primary shadow-float sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {showBack && (
                <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9 p-0">
                  <span className="text-sm sm:text-base">←</span>
                </Button>
              )}
              <h1 className="text-lg sm:text-xl font-bold text-primary-foreground">{title}</h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9 p-0">
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 sm:w-56">
                  <DropdownMenuItem asChild className="h-10 sm:h-11 text-sm sm:text-base">
                    <Link to="/">
                      <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-10 sm:h-11 text-sm sm:text-base">
                    <Link to="/management">
                      <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Cadastros
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-10 sm:h-11 text-sm sm:text-base">
                    <Link to="/reports">
                      <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Relatórios
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-10 sm:h-11 text-sm sm:text-base">
                    <Link to="/closing">
                      <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Fechamento
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-10 sm:h-11 text-sm sm:text-base">
                    <Link to="/perda-servico">
                      <AlertTriangle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Perdas de Serviço
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="h-10 sm:h-11 text-sm sm:text-base">
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9 p-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 sm:w-56">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm sm:text-base font-medium">{user?.user_metadata?.name || user?.email}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={handleLogout} className="h-10 sm:h-11 text-sm sm:text-base">
                    <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {children}
        </main>
      </div>
  );
}