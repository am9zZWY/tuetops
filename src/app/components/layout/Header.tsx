'use client'

import { useState } from "react";
import { Home, List, LogIn, Menu } from "lucide-react";
import Button from "@/app/components/Button";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useTranslations } from 'next-intl';
import { useIsSignedIn } from "@/app/zustand/auth";

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const t = useTranslations();

    const isSignedIn = useIsSignedIn()

    const adminLinks = [
        { to: `/admin/prepare/pizza`, text: t('Header.AdminLinks.prepare') }, // does not work yet
        { to: `/admin/prepare/order`, text: t('Header.AdminLinks.manage_orders') },
        { to: `/admin/manage/database`, text: t('Header.AdminLinks.manage_db') },
        { to: `/admin/manage/pizza`, text: t('Header.AdminLinks.manage_items') },
        { to: `/admin/logout`, text: t('Header.AdminLinks.logout') },
    ];

    const headerText = t('app_title');
    const headerEmoji = "🍕";

    return (
        <header className="sticky top-0 bg-white shadow z-20 rounded-2xl p-2 md:p-4 mb-5 w-full">
            <div className="container mx-auto flex justify-between items-center px-2 md:px-4 py-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    <a href={`/`}>
                        {headerText} <span aria-label="pizza">{headerEmoji}</span>
                    </a>
                </h1>
                <LanguageSelector/>
            </div>


            <nav>
                <div className="container mx-auto flex justify-between items-center px-2 md:px-4 py-2">
                    {/* Basic navigation links */}
                    <div className="flex space-x-4 sm:space-x-6">
                        <a href={`/`}
                           className="flex items-center space-x-2 text-black hover:text-primary-500 transition-colors duration-200 group"
                        >
                            <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"/>
                            <span className="font-medium">{t('Header.Menu.home')}</span>
                        </a>

                        <a
                            href={`/order/list`}
                            className="flex items-center space-x-2 text-black hover:text-primary-500 transition-colors duration-200 group"
                        >
                            <List className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"/>
                            <span className="font-medium">{t('Header.Menu.orders')}</span>
                        </a>
                    </div>

                    {!isSignedIn && (
                        <div className="flex space-x-4 sm:space-x-6">
                            <a
                                href={`/login`}
                                className="flex items-center space-x-2 text-black hover:text-primary-500 transition-colors duration-200 group"
                            >
                                <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"/>
                                <span className="font-medium">{t('Header.Menu.login')}</span>
                            </a>
                        </div>
                    )}

                    {isSignedIn && (
                        <>
                            {/* Admin Links: Hidden on small screens, visible on medium+ */}
                            <div className="hidden md:flex space-x-4 lg:space-x-6">
                                {adminLinks.map(({ to, text }) => (
                                    <a key={to} href={to}
                                       className="flex items-center space-x-2 text-black hover:text-primary-500 transition-colors duration-200 group">
                                        <span className="font-medium">{text}</span>
                                    </a>
                                ))}
                            </div>
                            {/* Hamburger Menu Button: Visible only on small screens */}
                            <div className="md:hidden">
                                <Button
                                    className="text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    aria-label="Toggle admin menu"
                                    aria-expanded={menuOpen}
                                >
                                    <Menu/>
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {menuOpen && isSignedIn && (
                    <div className="lg:hidden border-t border-white/20 bg-white/5 backdrop-blur-md">
                        <nav className="container mx-auto px-4 py-4 space-y-2">
                            {adminLinks.map(({ to, text }) => (
                                <a
                                    key={to}
                                    href={to}
                                    className="flex items-center space-y-3 text-black hover:text-primary-500 transition-colors duration-200 group"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span className="font-medium">{text}</span>
                                </a>
                            ))}
                        </nav>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
