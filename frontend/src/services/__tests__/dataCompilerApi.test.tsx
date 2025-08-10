import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {dataCompilerApi, type TableSchema} from "../dataCompilerApi";

describe("DataCompilerApiService", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("compileJson", () => {
        it("should make a POST request to the compile endpoint", async () => {
            const mockTableSchema: TableSchema = {
                name: "test_table",
                columns: [
                    {name: "id", type: "integer", nullable: false},
                    {name: "name", type: "string", length: 255, nullable: true},
                ],
                description: "Test table",
            };

            const mockResponse = new Response(
                JSON.stringify({status: "success", message: "Compiled successfully"}),
                {status: 200, headers: {"Content-Type": "application/json"}},
            );

            vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

            const result = await dataCompilerApi.compileJson(mockTableSchema);

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/compile"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({json_data: mockTableSchema}),
            });

            expect(result).toBe(mockResponse);
        });

        it("should bubble up errors incurred to allow pages to handle them as they need", async () => {
            const mockTableSchema: TableSchema = {
                name: "test_table",
                columns: [],
            };

            vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

            await expect(
                dataCompilerApi.compileJson(mockTableSchema),
            ).rejects.toThrow("Network error");
        });
    });
});
