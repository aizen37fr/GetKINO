import { useState, useCallback } from 'react';
import type { ScanHistoryItem } from '../types/scanHistory';
import type { UniversalDetectionResult } from '../services/universalDetection';

const STORAGE_KEY = 'kino_scan_history_v1';
const MAX_HISTORY = 50;

function load(): ScanHistoryItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function save(items: ScanHistoryItem[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // storage quota exceeded — ignore
    }
}

export function useScanHistory() {
    const [history, setHistory] = useState<ScanHistoryItem[]>(load);

    const addScan = useCallback((result: UniversalDetectionResult, thumbnail?: string, isVideo = false) => {
        const item: ScanHistoryItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            scannedAt: Date.now(),
            result,
            thumbnail,
            isVideo,
        };
        setHistory(prev => {
            const next = [item, ...prev].slice(0, MAX_HISTORY);
            save(next);
            return next;
        });
        return item.id;
    }, []);

    const removeScan = useCallback((id: string) => {
        setHistory(prev => {
            const next = prev.filter(i => i.id !== id);
            save(next);
            return next;
        });
    }, []);

    const clearHistory = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setHistory([]);
    }, []);

    return { history, addScan, removeScan, clearHistory };
}
