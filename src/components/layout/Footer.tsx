import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-md py-8 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row px-4 md:px-6">
        <p className="text-sm text-center text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} <Link href="/" className="font-semibold text-foreground hover:text-primary transition-colors">MUN Platform</Link>. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
