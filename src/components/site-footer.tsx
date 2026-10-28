import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { configQuery } from "@/lib/catalog.functions";
import { brandLogo } from "@/lib/identity";

export function SiteFooter() {
  const { data: cfg } = useQuery(configQuery);
  const wa = cfg?.whatsapp_loja;
  return (
    <footer className="mt-16 border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <img src={brandLogo} alt="Líder Grifes" width={72} height={72} className="mb-3 h-18 w-18 object-contain" />
          <p className="font-display text-lg font-semibold">Líder Grifes Atacado</p>
          <p className="mt-2 text-muted-foreground">Camisetas básicas e polos no atacado.</p>
        </div>
        <div>
          <p className="font-semibold">Contato</p>
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="tap mt-1 flex items-center text-muted-foreground hover:text-foreground">
              WhatsApp: +{wa}
            </a>
          )}
        </div>
        <nav className="flex flex-col">
          <p className="font-semibold">Institucional</p>
          <Link to="/info/$pagina" params={{ pagina: "sobre" }} className="tap flex items-center text-muted-foreground hover:text-foreground">Sobre nós</Link>
          <Link to="/info/$pagina" params={{ pagina: "trocas" }} className="tap flex items-center text-muted-foreground hover:text-foreground">Trocas e devoluções</Link>
          <Link to="/info/$pagina" params={{ pagina: "privacidade" }} className="tap flex items-center text-muted-foreground hover:text-foreground">Privacidade</Link>
        </nav>
      </div>
      <p className="pb-8 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Líder Grifes</p>
    </footer>
  );
}
