import {describe, it, expect, vi} from "vitest";
import DataCompilerPage from "../DataCompilerPage.tsx";
import {render, screen} from "@testing-library/react";
import {userEvent} from "@testing-library/user-event";
import {dataCompilerApi} from "../../services/dataCompilerApi.ts";

const mockTableSchema = {
    name: "test_table",
    columns: [
        {name: "id", type: "integer", nullable: false},
        {name: "name", type: "string", length: 255, nullable: true},
    ],
    description: "Test table",
};

const createMockCompileJsonResponse = async (
    status_code: number,
    status: string,
    message?: string,
) => {
    return new Response(JSON.stringify({status, message}), {
        status: status_code,
        headers: {"Content-Type": "application/json"},
    });
};

const createErrorResponse = async () => {
    return new Error("Network error")
}

// @ts-expect-error - the schema could be malformed, and we want to test this
const createMockFile = (schema) => {
    return new File([JSON.stringify(schema)], "test.json", {
        type: "application/json",
    });
};

vi.mock("../../services/dataCompilerApi.ts")

describe("DataCompilerPage", () => {
    it("should render the compiler page with the correct visual elements", () => {
        render(<DataCompilerPage/>);
        expect(screen.getByRole("heading", {level: 1})).toHaveTextContent(
            "Data Compiler",
        );
        expect(
            screen.getByRole("button", {name: "Upload JSON"}),
        ).toBeInTheDocument();
    });

    it("should trigger the file input when the upload button is clicked", async () => {
        const user = userEvent.setup();

        render(<DataCompilerPage/>);

        const uploadButton = screen.getByRole("button", {name: "Upload JSON"});
        const fileInput = screen.getByTestId("file-input");

        const clickSpy = vi.spyOn(fileInput, "click");
        vi.mocked(dataCompilerApi.compileJson).mockReturnValue(createMockCompileJsonResponse(
            200,
            "success",
            "Compiled successfully"
        ))

        await user.click(uploadButton);

        expect(clickSpy).toHaveBeenCalled();

        clickSpy.mockRestore();
    });

    it("should handle file upload when user clicks upload button", async () => {
        const user = userEvent.setup();

        render(<DataCompilerPage/>);
        vi.mocked(dataCompilerApi.compileJson).mockReturnValue(createMockCompileJsonResponse(
            200,
            "success",
            "Compiled successfully"
        ))

        const file = createMockFile(mockTableSchema);

        const fileInput = screen.getByTestId("file-input") as HTMLInputElement;

        await user.upload(fileInput, file);

        expect(fileInput.files![0]).toBe(file);
        expect(fileInput.files).toHaveLength(1);
    });

    it("should display the correct message when upon successful response from the DataCompiler API", async () => {
        const user = userEvent.setup();

        render(<DataCompilerPage/>);

        vi.mocked(dataCompilerApi.compileJson).mockReturnValue(createMockCompileJsonResponse(
            200,
            "success",
            "Compiled successfully"
        ))

        const file = createMockFile(mockTableSchema);

        const fileInput = screen.getByTestId("file-input");

        await user.upload(fileInput, file);

        expect(screen.getByText("JSON compiled successfully")).toBeInTheDocument();
        expect(screen.getByText("JSON compiled successfully")).toHaveStyle({
            padding: "10px",
            margin: "10px 0",
            borderRadius: "4px",
            backgroundColor: "#d4edda",
            color: "#155724",
            border: "1px solid #c3e6cb",
        });
    });

    it("should display the correct message when upon error response from the DataCompiler API", async () => {
        const user = userEvent.setup();

        render(<DataCompilerPage/>);

        vi.mocked(dataCompilerApi.compileJson).mockReturnValue(createMockCompileJsonResponse(
            400,
            "error",
            "Invalid JSON data provided"
        ))

        const file = createMockFile(mockTableSchema);

        const fileInput = screen.getByTestId("file-input");

        await user.upload(fileInput, file);
        expect(screen.getByText("Invalid JSON data provided")).toBeInTheDocument();
        expect(screen.getByText("Invalid JSON data provided")).toHaveStyle({
            padding: "10px",
            margin: "10px 0",
            borderRadius: "4px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
        });
    });

    it("should display the correct message when upon error response from the DataCompiler API when no message is present in the response", async () => {
        const user = userEvent.setup();

        render(<DataCompilerPage/>);

        vi.mocked(dataCompilerApi.compileJson).mockReturnValue(createMockCompileJsonResponse(
            400,
            "error"
        ))

        const file = createMockFile(mockTableSchema);

        const fileInput = screen.getByTestId("file-input");

        await user.upload(fileInput, file);

        expect(
            screen.getByText(
                "Failed to connect to compile the JSON file. Please try again.",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Failed to connect to compile the JSON file. Please try again.",
            ),
        ).toHaveStyle({
            padding: "10px",
            margin: "10px 0",
            borderRadius: "4px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
        });
    });

    it("should display the correct message when there is a failure when calling the DataCompiler API", async () => {
        const user = userEvent.setup();

        render(<DataCompilerPage/>);

        vi.mocked(dataCompilerApi.compileJson).mockReturnValue(createErrorResponse())

        const file = createMockFile(mockTableSchema);

        const fileInput = screen.getByTestId("file-input");

        await user.upload(fileInput, file);

        expect(
            screen.getByText(
                "Failed to connect to the compiler service. Please try again.",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Failed to connect to the compiler service. Please try again.",
            ),
        ).toHaveStyle({
            padding: "10px",
            margin: "10px 0",
            borderRadius: "4px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
        });
    });

    it("should display the correct error message when there an error parsing the JSON", async () => {
        const user = userEvent.setup();

        render(<DataCompilerPage/>);

        vi.mocked(dataCompilerApi.compileJson).mockReturnValue(createMockCompileJsonResponse(
            200,
            "success",
            "Compiled successfully"
        ))

        const invalidFile = new File(["{ invalid json syntax"], "invalid.json", {
            type: "application/json",
        });

        const fileInput = screen.getByTestId("file-input");
        await user.upload(fileInput, invalidFile);

        expect(screen.getByText("Invalid JSON file format")).toBeInTheDocument();
        expect(screen.getByText("Invalid JSON file format")).toHaveStyle({
            padding: "10px",
            margin: "10px 0",
            borderRadius: "4px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
        });
    });
});
