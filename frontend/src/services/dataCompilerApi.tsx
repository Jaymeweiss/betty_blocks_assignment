import API_CONFIG from '../config/api';

export interface TableSchema {
    name: string;
    columns: Array<{
        name: string;
        type: string;
        length?: number;
        nullable?: boolean;
    }>;
    description?: string;
}

export interface CompilerResponse {
    status: 'success' | 'error';
    message: string;
}

class DataCompilerApiService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.DATA_COMPILER_BASE_URL;
    }

    async compileJson(jsonData: TableSchema): Promise<Response> {
        return await fetch(`${this.baseUrl}/compile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({json_data: jsonData})
        });
    }
}

export const dataCompilerApi = new DataCompilerApiService();
