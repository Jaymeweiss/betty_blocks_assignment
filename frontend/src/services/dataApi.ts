import API_CONFIG from '../config/api';

export interface DatabaseTableListResponse {
    database_tables: string[];
}

export interface DatabaseTableDataResponse {
    columns: string[];
    rows: string[][]; // data types here need to be more specific - we shouldn't just be returning strings
}

class DataApiService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.DATA_API_BASE_URL;
    }

    async getDatabaseTableList(): Promise<Response | Error> {
        return await fetch(`${this.baseUrl}/db_tables`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    async getData(databaseTable: string): Promise<Response | Error> {
        return await fetch(`${this.baseUrl}/data/${databaseTable}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

}

export const dataApi = new DataApiService();
