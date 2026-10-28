import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Moon, ShoppingBag, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { homeQuery } from "@/lib/catalog.functions";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("lg-theme", next ? "dark" : "light");
  };
  return { dark, toggle };
}

const iconBtn =
  "tap relative inline-flex items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary";

export function SiteHeader() {
  const { pecas, items } = useCart();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { data: cats } = useQuery(homeQuery);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={iconBtn} aria-label="Abrir menu">
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] max-w-sm bg-background">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 text-lg" onClick={() => setOpen(false)}>
              <Link to="/" className="tap flex items-center rounded-xl px-3 hover:bg-secondary">Início</Link>
              {cats?.map((c) => (
                <Link key={c.id} to="/categoria/$slug" params={{ slug: c.slug }} className="tap flex items-center rounded-xl px-3 hover:bg-secondary">
                  {c.nome}
                </Link>
              ))}
              <Link to="/carrinho" className="tap flex items-center rounded-xl px-3 hover:bg-secondary">Meu pedido</Link>
              <div className="my-2 border-t border-border" />
              <Link to="/info/$pagina" params={{ pagina: "sobre" }} className="tap flex items-center rounded-xl px-3 text-base text-muted-foreground hover:bg-secondary">Sobre nós</Link>
              <Link to="/info/$pagina" params={{ pagina: "trocas" }} className="tap flex items-center rounded-xl px-3 text-base text-muted-foreground hover:bg-secondary">Trocas</Link>
              <Link to="/info/$pagina" params={{ pagina: "privacidade" }} className="tap flex items-center rounded-xl px-3 text-base text-muted-foreground hover:bg-secondary">Privacidade</Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex min-w-0 items-center justify-center gap-2" aria-label="Líder Grifes Atacado">
          <img src="/logo.webp" alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
          <span className="truncate font-display text-base font-semibold">Líder Grifes</span>
        </Link>

        <div className="flex items-center">
          <button type="button" onClick={toggle} className={iconBtn} aria-label={dark ? "Tema claro" : "Tema escuro"}>
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link to="/carrinho" className={iconBtn} aria-label={`Pedido: ${items.length} itens`}>
            <ShoppingBag className="h-6 w-6" />
            {items.length > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {items.length}
              </span>
            )}
            <span className="sr-only">{pecas} peças</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
