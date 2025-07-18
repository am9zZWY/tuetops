'use client'

import React from "react";
import useOrderStore from "@/app/zustand/order";
import { ShoppingCart, X } from "lucide-react";
import Button from "@/app/components/Button";
import { useTranslations } from 'next-intl';
import { useShallow } from "zustand/react/shallow";

export const FloatingOrderSummary = ({
                                         onToggleAction,
                                     }: { onToggleAction: () => void }) => {
    const t = useTranslations();

    const { totalItemsCount, currentOrderTotal, error, setError } = useOrderStore(
        useShallow((state) => ({
            totalItemsCount: state.getTotalItemCount(),
            currentOrderTotal: state.getCurrentOrderTotal(),
            error: state.error,
            setError: state.setError
        }))
    )

    // Derive state instead of managing it
    const enableCart = totalItemsCount > 0;
    const text = totalItemsCount === 0
        ? t('Order.order_summary.add')
        : t('Order.order_summary.open_order_summary');

    if (totalItemsCount <= 0) {
        return null;
    }


    return (
        <div
            className="fixed bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90vw] max-w-md transition-all duration-300 ease-out h-20">
            <div
                className={`rounded-2xl md:rounded-2xl ${enableCart ? 'bg-orange-500 text-white' : 'bg-white border-4 border-orange-500 text-black'} ${error ? 'bg-red-500 text-white' : ''} shadow-lg  transition-all duration-300 ease-out p-1`}>
                <div
                    className="relative flex items-center justify-between h-full flex-row">
                    {!error && (
                        <>
                            <div className="flex items-center justify-center min-w-[60px] px-3">
                                <div className="relative">
                                    <ShoppingCart className="w-6 h-6 text-white-800"/>
                                    {totalItemsCount > 0 && (
                                        <span
                                            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {totalItemsCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={onToggleAction}
                                disabled={!enableCart}
                                className={`flex-1 text-center py-3 px-4 ${enableCart ? 'hover:shadow-inner hover:inset-shadow-2xs' : ''} rounded-lg transition-colors duration-200 text-white-800 font-bold text-2xl`}
                                aria-label="View cart"
                            >
                                {text}
                            </Button>

                            <div className="flex items-center justify-center min-w-[80px] px-3">
                                <span className="text-white-800 font-bold text-lg">
                                    €{currentOrderTotal.toFixed(2)}
                                </span>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="w-full text-center px-2 flex items-center justify-center h-full">
                            <p className="text-2xl bg-opacity-50 px-3 py-1 rounded">{error}</p>
                            <button
                                onClick={() => setError('')}
                                className="ml-2 text-white hover:text-gray-200"
                            >
                                <X className="w-8 h-8"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FloatingOrderSummary;
