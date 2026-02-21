import type { UniversalDetectionResult } from '../services/universalDetection';

export interface ScanHistoryItem {
    id: string;              // uuid
    scannedAt: number;       // timestamp ms
    result: UniversalDetectionResult;
    thumbnail?: string;      // base64 or data url of the image scanned
    isVideo: boolean;
}
