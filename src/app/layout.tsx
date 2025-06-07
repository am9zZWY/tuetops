import Header from "@/app/components/layout/Header";
import Footer from "@/app/components/layout/Footer";

import "./globals.css";
import { Metadata } from "next";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";


export const metadata: Metadata = {
    title: "🍕 FSI/K Sommerfest Pizza",
    description: "Order your pizza for the FSI/K Sommerfest 2024",
};

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();

    return (
        <html lang={locale}>
        <body>
        <main className="max-h-fit flex flex-col bg-gray-50">
            <NextIntlClientProvider>
                <Header/>
                <div className="p-4 md:p-8 my-5 w-full max-w-7xl mx-auto min-h-screen">
                    {children}
                </div>
                <Footer/>
            </NextIntlClientProvider>
        </main>
        </body>
        </html>
    );
}
