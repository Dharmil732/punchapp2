import "./globals.css";
import RoleNav from "@/components/RoleNav";

export const metadata = { title: "Punch - Pharmasave", description: "Time & Shift app" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div className="text-lg font-semibold">Punch</div>
            <div className="text-sm text-muted">final v14</div>
          </header>
          <RoleNav />
          <main style={{ marginTop: "12px" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
