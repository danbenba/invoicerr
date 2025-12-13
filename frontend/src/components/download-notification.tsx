import { useEffect, useState } from "react";
import { X, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DownloadProgress {
    id: string;
    percent: number;
    filename: string;
}

interface DownloadComplete {
    id: string;
    filename: string;
    filePath: string;
}

export function DownloadNotification() {
    const [downloads, setDownloads] = useState<Map<string, DownloadProgress>>(new Map());
    const [completed, setCompleted] = useState<Map<string, DownloadComplete>>(new Map());
    const [errors, setErrors] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        if (typeof window !== 'undefined' && window.electronAPI) {
            // Écouter les événements de progression
            window.electronAPI.onDownloadProgress((data: DownloadProgress) => {
                setDownloads(prev => {
                    const newMap = new Map(prev);
                    newMap.set(data.id, data);
                    return newMap;
                });
            });

            // Écouter les événements de complétion
            window.electronAPI.onDownloadComplete((data: DownloadComplete) => {
                setDownloads(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(data.id);
                    return newMap;
                });
                setCompleted(prev => {
                    const newMap = new Map(prev);
                    newMap.set(data.id, data);
                    return newMap;
                });

                // Supprimer après 3 secondes
                setTimeout(() => {
                    setCompleted(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(data.id);
                        return newMap;
                    });
                }, 3000);
            });

            return () => {
                window.electronAPI?.removeAllListeners('download-progress');
                window.electronAPI?.removeAllListeners('download-complete');
            };
        }
    }, []);

    const allNotifications = [
        ...Array.from(downloads.entries()).map(([id, data]) => ({
            id,
            type: 'progress' as const,
            data,
        })),
        ...Array.from(completed.entries()).map(([id, data]) => ({
            id,
            type: 'complete' as const,
            data,
        })),
        ...Array.from(errors.entries()).map(([id, message]) => ({
            id,
            type: 'error' as const,
            data: { message },
        })),
    ];

    if (allNotifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
            {allNotifications.map((notification) => (
                <Card
                    key={notification.id}
                    className="shadow-lg border-2 animate-in slide-in-from-top"
                >
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            {notification.type === 'progress' && (
                                <>
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Download className="h-5 w-5 text-blue-600 animate-pulse" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {notification.data.filename}
                                        </p>
                                        <div className="mt-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${notification.data.percent}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {notification.data.percent}%
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {notification.type === 'complete' && (
                                <>
                                    <div className="p-2 bg-emerald-100 rounded-full">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            Téléchargement terminé
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-1">
                                            {notification.data.filename}
                                        </p>
                                    </div>
                                </>
                            )}
                            {notification.type === 'error' && (
                                <>
                                    <div className="p-2 bg-red-100 rounded-full">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">
                                            Erreur de téléchargement
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {notification.data.message}
                                        </p>
                                    </div>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    if (notification.type === 'progress') {
                                        setDownloads(prev => {
                                            const newMap = new Map(prev);
                                            newMap.delete(notification.id);
                                            return newMap;
                                        });
                                    } else if (notification.type === 'complete') {
                                        setCompleted(prev => {
                                            const newMap = new Map(prev);
                                            newMap.delete(notification.id);
                                            return newMap;
                                        });
                                    } else {
                                        setErrors(prev => {
                                            const newMap = new Map(prev);
                                            newMap.delete(notification.id);
                                            return newMap;
                                        });
                                    }
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Déclaration TypeScript pour window.electronAPI
declare global {
    interface Window {
        electronAPI?: {
            downloadFile: (url: string, filename: string) => Promise<{ success: boolean; filePath?: string; message?: string }>;
            saveSession: () => Promise<{ success: boolean }>;
            getConfig: () => Promise<{ frontendUrl: string }>;
            updateConfig: (config: { frontendUrl: string }) => Promise<{ success: boolean; message?: string }>;
            onDownloadProgress: (callback: (data: DownloadProgress) => void) => void;
            onDownloadComplete: (callback: (data: DownloadComplete) => void) => void;
            removeAllListeners: (channel: string) => void;
        };
    }
}

