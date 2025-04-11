export interface PaginationResponseInterface<T> {
    data: T[];
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
