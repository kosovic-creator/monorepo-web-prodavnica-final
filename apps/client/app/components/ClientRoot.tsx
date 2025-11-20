"use client";
import { SessionProvider } from "next-auth/react";
import ClientLayout from "./ClientLayout";
import Footer from "./Footer";

export default function ClientRoot({ children, banner, grid }: {
    children: React.ReactNode;
    banner: React.ReactNode;
    grid: React.ReactNode;
}) {
    return (
        <SessionProvider>
            {/* Banner paralelna ruta */}

            <div className="flex flex-col min-h-screen">
                <ClientLayout>
                    <main className="flex-1">{children}</main>
                </ClientLayout>
                {/* Grid paralelna ruta */}
                {banner}
                {grid}
                <Footer />
            </div>
        </SessionProvider>
    );
}
