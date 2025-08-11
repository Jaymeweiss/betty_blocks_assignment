import {useEffect, useState} from "react";
import {dataApi, type DatabaseTableDataResponse, type DatabaseTableListResponse} from "../services/dataApi.tsx";

function DataApiPage() {
    const [isRetrievingDatabaseTableList, setIsRetrievingDatabaseTableList] = useState(false);
    const [isRetrievingData, setIsRetrievingData] = useState(false);
    const [databaseList, setDatabaseList] = useState<string[]>([]);
    const [selectedDatabaseTable, setSelectedDatabaseTable] = useState<string | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRetrieveDatabaseTableList = async () => {
        setIsRetrievingDatabaseTableList(true);
        setErrorMessage(null);
        setDatabaseList([]);
        setSelectedDatabaseTable(null);
        setColumns([]);
        setRows([]);

        try {
            const response = await dataApi.getDatabaseTableList();
            const result: DatabaseTableListResponse = await response.json();
            if (response.ok && response.status === 200) {
                setDatabaseList(result.database_tables);
            } else {
                setErrorMessage("Failed to retrieve database table list");
            }
        } catch (_error) {
            setErrorMessage("Failed to connect to the data API. Please try again.");
        } finally {
            setIsRetrievingDatabaseTableList(false);
        }
    };

    const handleRetrieveData = async (database: string) => {
        setIsRetrievingData(true);
        setSelectedDatabaseTable(database);
        setErrorMessage(null);
        setColumns([]);
        setRows([]);

        try {
            const response = await dataApi.getData(database);
            const result: DatabaseTableDataResponse = await response.json();
            if (response.ok && response.status === 200) {
                setColumns(result.columns);
                setRows(result.rows);
            } else {
                setErrorMessage("Failed to retrieve data");
            }
        } catch (_error) {
            setErrorMessage("Failed to connect to the data API. Please try again.");
        } finally {
            setIsRetrievingData(false);
        }
    };

    useEffect(() => {
        handleRetrieveDatabaseTableList();
    }, []);

    return (
        <div>
            <h1>Data API</h1>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <div>
                {isRetrievingDatabaseTableList && (
                    <p>Retrieving database table list...</p>
                )}
                <div className={databaseList ? "database-list" : "database-list hidden"}>
                    <h2>Databases:</h2>
                    <div className="chip-container">
                        {databaseList.map((database, index) => (
                            <div
                                key={index}
                                className="chip"
                                onClick={() => handleRetrieveData(database)}
                            >
                                {database}
                            </div>
                        ))}
                    </div>
                </div>
                {isRetrievingData && <p>Retrieving data...</p>}
                <div className={columns ? "table-container" : "table-container hidden"}>
                    <table>
                        <thead>
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index}>{column}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={`${selectedDatabaseTable}-${rowIndex}`}>
                                {row.map((cell, cellIndex) => (
                                    <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DataApiPage;
