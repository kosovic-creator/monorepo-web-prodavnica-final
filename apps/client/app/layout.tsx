import type { Metadata } from "next";
import "./globals.css";
import ClientRoot from "./components/ClientRoot";

export const metadata: Metadata = {
  title: "Prodavnica",
  description: "Web prodavnica - client app",
};

export default function RootLayout({
  children,
  banner,
  grid,
}: {
  children: React.ReactNode;
  banner: React.ReactNode;
  grid: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body>
        <ClientRoot banner={banner} grid={grid}>
          {children}
        </ClientRoot>
      </body>
    </html>
  );
}
