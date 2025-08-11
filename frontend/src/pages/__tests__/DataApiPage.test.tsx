import {describe, it, expect, vi} from "vitest";
import DataApiPage from "../DataApiPage";
import {render, screen, waitFor} from "@testing-library/react";
import {userEvent} from "@testing-library/user-event";
import {dataApi} from "../../services/dataApi.ts";

const createMockDatabaseTableListResponse = async (
    databaseTableList: string[],
    status_code: number = 200,
    status: string = "success"
) => {
    return new Response(JSON.stringify({
        database_tables: databaseTableList,
        status
    }), {
        status: status_code,
        headers: {"Content-Type": "application/json"}
    });
};

const createMockDataResponse = async (
    rows: (number | string)[][],
    columns: string[],
    status_code: number = 200,
    status: string = "success"
) => {
    return new Response(JSON.stringify({
        rows: rows,
        columns: columns,
        status
    }), {
        status: status_code,
        headers: {"Content-Type": "application/json"}
    })
}

const createErrorResponse = async () => {
    return new Error("Network error")
}

const createMockData = () => {
    return {
        columns: ["id", "name", "description"],
        rows: [
            [1, "Test1", "A great description"],
            [2, "Test2", "A different description"]
        ]
    }
}

vi.mock("../../services/dataApi.ts")

describe("DataApiPage", () => {
    it("should render the page with the correct default visual elements", async () => {
        vi.mocked(dataApi.getDatabaseTableList).mockReturnValue(createMockDatabaseTableListResponse(["firstTestTable", "secondTestTable"]))

        render(<DataApiPage/>);

        expect(screen.getByRole("heading", {level: 1})).toHaveTextContent(
            "Data API",
        );

        await waitFor(() => {
            expect(screen.getByRole("heading", {level: 2})).toHaveTextContent("Database tables:");
        });

        // No error messages
        expect(screen.queryByTestId("error-banner")).toBeNull();

        // 2 example tables - neither are selected
        expect(screen.getByText("firstTestTable")).toBeInTheDocument();
        expect(screen.getByText("firstTestTable")).toHaveClass("chip");
        expect(screen.getByText("secondTestTable")).toBeInTheDocument();
        expect(screen.getByText("secondTestTable")).toHaveClass("chip");
        // No data loaded up just yet
        expect(screen.getByText("No data available")).toBeInTheDocument();
        expect(screen.getByText("No data available")).toHaveClass("info-message");
    });

    it("should highlight the selected database table chip and display its data", async () => {
        const user = userEvent.setup();

        const mockData = createMockData()
        vi.mocked(dataApi.getDatabaseTableList).mockReturnValue(createMockDatabaseTableListResponse(["firstTestTable", "secondTestTable"]))
        vi.mocked(dataApi.getData).mockReturnValue(createMockDataResponse(mockData["rows"], mockData["columns"]))

        render(<DataApiPage/>);

        await waitFor(() => {
            expect(screen.queryByText("Retrieving database table list...")).toBeNull();
        });

        await user.click(screen.getByText("secondTestTable"));

        await waitFor(() => {
            expect(screen.getByText("secondTestTable")).toHaveClass("selected_chip");
        });

        // No error messages
        expect(screen.queryByTestId("error-banner")).toBeNull();

        // 2 example tables - The one which is clicked is selected
        expect(screen.getByText("firstTestTable")).toBeInTheDocument();
        expect(screen.getByText("firstTestTable")).toHaveClass("chip");
        expect(screen.getByText("secondTestTable")).toBeInTheDocument();
        expect(screen.getByText("secondTestTable")).toHaveClass("selected_chip");

        // Data being shown in the table
        // Columns
        expect(screen.getByTestId("secondTestTable-column-2")).toHaveTextContent("description")
        expect(screen.getByTestId("secondTestTable-column-0")).toHaveTextContent("id")
        expect(screen.getByTestId("secondTestTable-column-1")).toHaveTextContent("name")

        // Rows
        expect(screen.getByTestId("row-0-cell-0")).toHaveTextContent("1")
        expect(screen.getByTestId("row-0-cell-1")).toHaveTextContent("Test1")
        expect(screen.getByTestId("row-0-cell-2")).toHaveTextContent("A great description")
        expect(screen.getByTestId("row-1-cell-0")).toHaveTextContent("2")
        expect(screen.getByTestId("row-1-cell-1")).toHaveTextContent("Test2")
        expect(screen.getByTestId("row-1-cell-2")).toHaveTextContent("A different description")
    });

    it("should show an info message if there is no data present for the database table", async () => {
        const user = userEvent.setup();

        vi.mocked(dataApi.getDatabaseTableList).mockReturnValue(createMockDatabaseTableListResponse(["firstTestTable", "secondTestTable"]))
        vi.mocked(dataApi.getData).mockReturnValue(createMockDataResponse([], []))

        render(<DataApiPage/>);

        await waitFor(() => {
            expect(screen.queryByText("Retrieving database table list...")).toBeNull();
        });

        await user.click(screen.getByText("firstTestTable"));

        await waitFor(() => {
            expect(screen.getByText("firstTestTable")).toHaveClass("selected_chip");
        });

        // No error messages
        expect(screen.queryByTestId("error-banner")).toBeNull();

        // 2 example tables - The one which is clicked is selected
        expect(screen.getByText("firstTestTable")).toBeInTheDocument();
        expect(screen.getByText("firstTestTable")).toHaveClass("selected_chip");
        expect(screen.getByText("secondTestTable")).toBeInTheDocument();
        expect(screen.getByText("secondTestTable")).toHaveClass("chip");

        // No table is present
        expect(screen.queryByTestId("data-table")).toBeNull();

        // Info message shown
        expect(screen.getByText("No data available")).toBeInTheDocument();
        expect(screen.getByText("No data available")).toHaveClass("info-message");
    });

    it("should show an info message if there are no possible database tables", async () => {
        vi.mocked(dataApi.getDatabaseTableList).mockReturnValue(createMockDatabaseTableListResponse([]))

        render(<DataApiPage/>);

        await waitFor(() => {
            expect(screen.queryByText("Retrieving database table list...")).toBeNull();
        });

        // No error messages
        expect(screen.queryByTestId("error-banner")).toBeNull();

        // No database table list
        expect(screen.queryByTestId("database-table-list")).toBeNull();

        // No table is present
        expect(screen.queryByTestId("data-table")).toBeNull();

        // Info message shown
        expect(screen.getByText("No database tables available")).toBeInTheDocument();
        expect(screen.getByText("No database tables available")).toHaveClass("info-message");
    });

    it("should show an error message if the database tables call has a status which is not successful", async () => {
        vi.mocked(dataApi.getDatabaseTableList).mockReturnValue(createMockDatabaseTableListResponse(
            [],
            400,
            "error"
            ))

        render(<DataApiPage/>);

        await waitFor(() => {
            expect(screen.queryByText("Retrieving database table list...")).toBeNull();
        });

        // No database table list
        expect(screen.queryByTestId("database-table-list")).toBeNull();
        expect(screen.getByText("No database tables available")).toBeInTheDocument();
        expect(screen.getByText("No database tables available")).toHaveClass("info-message");

        // No table is present
        expect(screen.queryByTestId("data-table")).toBeNull();

        // Error message shown
        expect(screen.getByTestId("error-banner")).toHaveTextContent("Failed to retrieve database table list")
    });

    it("should show an error message if the database tables call throws an error", async () => {
        vi.mocked(dataApi.getDatabaseTableList).mockReturnValue(createErrorResponse())

        render(<DataApiPage/>);

        await waitFor(() => {
            expect(screen.queryByText("Retrieving database table list...")).toBeNull();
        });

        // No database table list
        expect(screen.queryByTestId("database-table-list")).toBeNull();

        // No table is present
        expect(screen.queryByTestId("data-table")).toBeNull();

        // Error message shown
        expect(screen.getByTestId("error-banner")).toHaveTextContent("Failed to retrieve database table list")
    });

    it("should show an error message if the data lookup call has a status which is not successful", async () => {
        const user = userEvent.setup();

        vi.mocked(dataApi.getDatabaseTableList).mockReturnValue(createMockDatabaseTableListResponse(["firstTestTable", "secondTestTable"]))
        vi.mocked(dataApi.getData).mockReturnValue(createMockDataResponse([], [], 400, "error"))

        render(<DataApiPage/>);

        await waitFor(() => {
            expect(screen.queryByText("Retrieving database table list...")).toBeNull();
        });

        await user.click(screen.getByText("secondTestTable"));

        await waitFor(() => {
            expect(screen.getByText("secondTestTable")).toHaveClass("selected_chip");
        });

        // 2 example tables - The one which is clicked is selected
        expect(screen.getByText("firstTestTable")).toBeInTheDocument();
        expect(screen.getByText("firstTestTable")).toHaveClass("chip");
        expect(screen.getByText("secondTestTable")).toBeInTheDocument();
        expect(screen.getByText("secondTestTable")).toHaveClass("selected_chip");

        // No table is present
        expect(screen.queryByTestId("data-table")).toBeNull();
        expect(screen.getByText("No data available")).toBeInTheDocument();
        expect(screen.getByText("No data available")).toHaveClass("info-message");

        // Error message shown
        expect(screen.getByTestId("error-banner")).toHaveTextContent("Failed to retrieve data")
    });

    it("should show an error message if data lookup call throws an error", async () => {
        const user = userEvent.setup();

        vi.mocked(dataApi.getDatabaseTableList).mockReturnValue(createMockDatabaseTableListResponse(["firstTestTable", "secondTestTable"]))
        vi.mocked(dataApi.getData).mockReturnValue(createErrorResponse())

        render(<DataApiPage/>);

        await waitFor(() => {
            expect(screen.queryByText("Retrieving database table list...")).toBeNull();
        });

        await user.click(screen.getByText("secondTestTable"));

        await waitFor(() => {
            expect(screen.getByText("secondTestTable")).toHaveClass("selected_chip");
        });

        // 2 example tables - The one which is clicked is selected
        expect(screen.getByText("firstTestTable")).toBeInTheDocument();
        expect(screen.getByText("firstTestTable")).toHaveClass("chip");
        expect(screen.getByText("secondTestTable")).toBeInTheDocument();
        expect(screen.getByText("secondTestTable")).toHaveClass("selected_chip");

        // No table is present
        expect(screen.queryByTestId("data-table")).toBeNull();
        expect(screen.getByText("No data available")).toBeInTheDocument();
        expect(screen.getByText("No data available")).toHaveClass("info-message");

        // Error message shown
        expect(screen.getByTestId("error-banner")).toHaveTextContent("Failed to retrieve data")
    });
})
