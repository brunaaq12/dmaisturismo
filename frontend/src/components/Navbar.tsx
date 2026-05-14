import { Link, useNavigate } from "react-router-dom";
import { Plane, User, LogOut, Shield, ShoppingCart, Ticket, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { MobileMenu } from "@/components/MobileMenu";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-2 md:h-20">
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <div className="rounded-lg bg-gradient-gold p-2 shadow-gold transition-smooth group-hover:scale-105 shrink-0">
            <Plane className="h-4 w-4 text-blue-900 md:h-5 md:w-5" strokeWidth={2.5} />
          </div>
          <div className="font-serif text-lg sm:text-2xl md:text-4xl font-bold leading-none tracking-tight truncate">
            D<span className="text-blue-900">+</span> <span className="text-primary">TURISMO</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="text-foreground/80 hover:text-accent transition-smooth">Pacotes</Link>
          <a href="#sobre" className="text-foreground/80 hover:text-accent transition-smooth">Sobre</a>
          <a href="#contato" className="text-foreground/80 hover:text-accent transition-smooth">Contato</a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="relative gap-2" onClick={() => nav("/carrinho")}>
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Carrinho</span>
            {count > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 bg-accent text-accent-foreground">
                {count}
              </Badge>
            )}
          </Button>
          <div className="hidden md:flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Minha conta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav("/conta")}><User className="mr-2 h-4 w-4" /> Meus dados</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/conta?tab=reservas")}><Ticket className="mr-2 h-4 w-4" /> Minhas reservas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/conta?tab=canceladas")}><XCircle className="mr-2 h-4 w-4" /> Reservas canceladas</DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => nav("/admin")}><Shield className="mr-2 h-4 w-4" /> Painel Admin</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); nav("/"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" className="bg-gradient-gold text-primary hover:opacity-90 shadow-gold" onClick={() => nav("/auth")}>
              Entrar
            </Button>
          )}
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
};
