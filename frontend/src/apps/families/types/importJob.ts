export interface ImportJobFailedSet {
    setNum: string;
    error: string;
}

export interface ImportJob {
    id: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    totalSets: number;
    processedSets: number;
    failedSets: number;
    failedSetDetails: ImportJobFailedSet[] | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string | null;
}
