interface DatabaseCollections {
    tickets: any[];
    users: any[];
    automationRules: any[];
    slaConfigs: any[];
    departments: any[];
    escalationRules: any[];
}
declare class DatabaseService {
    private dataPath;
    private collections;
    constructor();
    private ensureDataDirectory;
    private loadCollections;
    private saveCollection;
    create<T>(collectionName: keyof DatabaseCollections, data: Omit<T, 'id'>): T;
    findAll<T>(collectionName: keyof DatabaseCollections): T[];
    findById<T>(collectionName: keyof DatabaseCollections, id: string): T | null;
    findBy<T>(collectionName: keyof DatabaseCollections, predicate: (item: T) => boolean): T[];
    update<T>(collectionName: keyof DatabaseCollections, id: string, updates: Partial<T>): T | null;
    delete(collectionName: keyof DatabaseCollections, id: string): boolean;
    findWithPagination<T>(collectionName: keyof DatabaseCollections, options: {
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        filter?: (item: T) => boolean;
    }): {
        data: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    initializeDefaultData(): void;
}
export declare const db: DatabaseService;
export default DatabaseService;
//# sourceMappingURL=database.d.ts.map