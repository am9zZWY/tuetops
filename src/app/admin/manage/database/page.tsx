'use client'

import React, { useEffect, useState } from "react";
import { Database, MessageSquare } from "lucide-react";
import Button from "@/app/components/Button";
import { Heading } from "@/app/components/layout/Heading";

import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { System } from "@/model/system";
import { useSystem } from "@/lib/fetch/system";
import { Loading } from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";
import { EditableConfig } from "@/model/config";


export default function ManagePage() {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [enableChanges, setEnableChanges] = useState(false);
    const [systemMessage, setSystemMessage] = useState('');
    const [configData, setConfigData] = useState('');
    const t = useTranslations();

    const resetSystem = () => {
        if (!enableChanges) {
            return;
        }

        if (window.confirm(`Are you sure you want to RESET the database? THIS ACTION IS NOT REVERSIBLE!!`)) {
            fetch('/api/system/reset', {
                method: 'POST',
                credentials: 'include',
            })
                .then(() => setMessage('Database prepared'))
                .catch((error) => {
                    console.error('Error preparing database', error);
                    setMessage(error => error)
                })
        }
    }

    const { data, error, isFetching } = useSystem();

    const systemMutation = useMutation({
        mutationFn: async (system: System) => {
            const response = await fetch(`/api/system`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(system)
            });
            return response.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system'] }),
    });

    useEffect(() => {
        if (data) {
            if (data.status.message) {
                setMessage(data.status.message);
                setSystemMessage(data.status.message);
            } else if (data.status.active) {
                setMessage(t('Admin.Manage.Database.Status.activeSystem'));
            } else {
                setMessage(t('Admin.Manage.Database.Status.disabledSystem'));
            }
            setConfigData(JSON.stringify(data.config, null, 2));
        }
    }, [data])

    const saveConfig = () => {
        if (!data) {
            return;
        }

        try {
            const parsedConfig = JSON.parse(configData) as EditableConfig;
            systemMutation.mutate({ ...data, config: parsedConfig })
            console.log('Saving config:', parsedConfig);
        } catch (error) {
            console.error('Invalid JSON:', error);
        }
    };

    if (isFetching) {
        return <Loading message={t('SystemCheck.check_system_status')}/>
    }

    if (error) {
        return <ErrorMessage error={error.message}/>;
    }

    if (!data) {
        return null;
    }

    return (
        <div className="min-h-screen">
            <Heading
                title={t('Admin.Manage.Database.title')}
                description={message}
                icon={<Database className="size-10 text-primary-600"/>}
            />

            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {t('Admin.Manage.Database.SystemControls.title')}
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Enable Changes Toggle */}
                        <div
                            className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border-2 border-slate-200/50">
                            <label htmlFor="enableChanges" className="text-sm font-medium text-slate-700 flex-1">
                                {t('Admin.Manage.Database.Actions.enable_changes')}
                            </label>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="enableChanges"
                                    name="enableChanges"
                                    checked={enableChanges}
                                    onChange={() => setEnableChanges(!enableChanges)}
                                    className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border-2 border-primary-50 checked:bg-primary-800 checked:border-primary-800"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data && (
                                <Button
                                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        data.status.active
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md focus:ring-emerald-500'
                                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:shadow-md focus:ring-slate-500'
                                    }`}
                                    disabled={!enableChanges}
                                    onClick={() => {
                                        systemMutation.mutate({ ...data, status: { active: !data?.status.active } })
                                    }}
                                >
                                    <div
                                        className={`size-2 rounded-full ${data.status.active ? 'bg-white' : 'bg-slate-500'}`}/>
                                    {data.status.active ? t('Admin.Manage.Database.Status.activeSystem') : t('Admin.Manage.Database.Status.disabledSystem')}
                                </Button>
                            )}
                        </div>

                        {/* System Message Input */}
                        {data && (
                            <div className="space-y-3">
                                <label htmlFor="systemMessage" className="block text-sm font-medium text-slate-700">
                                    {t('Admin.Manage.Database.SystemMessage.title')}
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="relative col-span-2">
                                        <input
                                            type="text"
                                            id="systemMessage"
                                            name="systemMessage"
                                            value={systemMessage}
                                            placeholder={t('Admin.Manage.Database.Actions.enterSystemMessage')}
                                            className="w-full px-4 py-3 pl-11 text-sm bg-white border-2 border-slate-300 rounded-2xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-slate-400 placeholder-slate-400"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSystemMessage(e.target.value)}
                                        />
                                        <div
                                            className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <MessageSquare className="size-4 text-slate-400"/>
                                        </div>
                                    </div>
                                    <Button
                                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            data.status.active
                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md focus:ring-emerald-500'
                                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:shadow-md focus:ring-slate-500'
                                        }`}
                                        disabled={!enableChanges}
                                        onClick={() => {
                                            systemMutation.mutate({
                                                ...data,
                                                status: { active: false, message: systemMessage }
                                            })
                                        }}
                                    >
                                        <div className="size-2 rounded-full"/>
                                        {t('Admin.Manage.Database.Actions.set')}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {t('Admin.Manage.Database.SystemMessage.disclaimer')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Configuration Section */}
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex-1">
                                {t('Admin.Manage.Database.ConfigurationEditor.title')}
                            </h3>
                            <Button
                                onClick={saveConfig}
                                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-medium transition-all duration-200 bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                {t('Admin.Manage.Database.Actions.saveConfig')}
                            </Button>
                        </div>

                        <div className="relative">
                    <textarea
                        value={configData}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            setConfigData(e.target.value);
                        }}
                        className="w-full h-80 p-4 text-sm font-mono bg-slate-900 text-slate-100 rounded-2xl border-2 border-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-slate-400"
                        placeholder="Enter your JSON configuration here..."
                        spellCheck={false}
                    />
                            <div
                                className="absolute top-3 right-3 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
                                JSON
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border-2 border-slate-200">
                            {t('Admin.Manage.Database.ConfigurationEditor.disclaimer')}
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <Button
                            onClick={resetSystem}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-medium transition-all duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-200"
                            disabled={!enableChanges}
                        >
                            {t('Admin.Manage.Database.Actions.reset_database')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
