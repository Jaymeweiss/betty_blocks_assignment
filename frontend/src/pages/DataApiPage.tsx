import {useEffect, useState} from "react";
import {dataApi, type DatabaseTableDataResponse, type DatabaseTableListResponse} from "../services/dataApi.ts";

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
            const response: Response | Error = await dataApi.getDatabaseTableList();
            if (response instanceof Response) {
                const result: DatabaseTableListResponse = await response.json();
                if (response.ok && response.status === 200) {
                    setDatabaseList(result.database_tables);
                } else {
                    setErrorMessage("Failed to retrieve database table list");
                }
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
            const response: Response | Error = await dataApi.getData(database);
            if (response instanceof Response) {
                const result: DatabaseTableDataResponse = await response.json();
                if (response.ok && response.status === 200) {
                    setColumns(result.columns);
                    setRows(result.rows);
                } else {
                    setErrorMessage("Failed to retrieve data");
                }
            } else {
                setErrorMessage("Failed to retrieve data");
            }
        } catch (_error) {
            setErrorMessage("Failed to connect to the data API. Please try again.");
        } finally {
            setIsRetrievingData(false);
        }
    };

    const shouldDisplayData = selectedDatabaseTable && columns.length > 0 && rows.length > 0;


    useEffect(() => {
        handleRetrieveDatabaseTableList();
    }, []);

    return (
        <div>
            <h1>Data API</h1>
            {errorMessage && <div className="error-message" data-testid="error-banner">{`Error: ${errorMessage}`}</div>}
            {
                isRetrievingDatabaseTableList
                    ? <p>Retrieving database table list...</p>
                    : databaseList.length > 0
                        ? <div className="database-table-list" data-testid="database-table-list">
                            <h2>Database tables:</h2>
                            <div className="chip-container">
                                {databaseList.map((database, index) => (
                                    <div
                                        key={`${selectedDatabaseTable}-${index}`}
                                        className={selectedDatabaseTable === database ? "selected_chip" : "chip"}
                                        onClick={() => handleRetrieveData(database)}
                                    >
                                        {database}
                                    </div>
                                ))}
                            </div>
                        </div>
                        : <div className="info-message">No database tables available</div>
            }
            {
                isRetrievingData
                    ? <p>Retrieving data...</p>
                    : (shouldDisplayData)
                        ? <div className="table-container" data-testid="data-table">
                            <table>
                                <thead>
                                <tr>
                                    {columns.map((column, index) => (
                                        <th
                                            key={`${selectedDatabaseTable}-column-${index}`}
                                            data-testid={`${selectedDatabaseTable}-column-${index}`}
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map((row, rowIndex) => (
                                    <tr
                                        key={`${selectedDatabaseTable}-row-${rowIndex}`}
                                        data-testid={`${selectedDatabaseTable}-row-${rowIndex}`}
                                    >
                                        {row.map((cell, cellIndex) => (
                                            <td
                                                key={`row-${rowIndex}-cell-${cellIndex}`}
                                                data-testid={`row-${rowIndex}-cell-${cellIndex}`}
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        : <div className="info-message">No data available</div>
            }
        </div>
    );
}

export default DataApiPage;
