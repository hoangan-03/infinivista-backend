export interface PaginationMetadata {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginationResponseInterface<T> {
    data: T[];
    metadata: PaginationMetadata;
}
