export interface CompleteResponse<T> {
  data: T | T[];
  message?: string;
}

export interface MessageResponse {
  message: string;
}

export type MetadataType = {
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
};

export interface PaginationResponse<T> {
  data: T[];
  metadata: MetadataType;
}

export interface FormatResponse<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T | T[];
  metadata?: MetadataType;
  timestamp: string;
}

export interface EnumOptions<T> {
  value: T;
  option: string;
}

export type BaseApiResponse<T> = CompleteResponse<T> | PaginationResponse<T> | MessageResponse;
