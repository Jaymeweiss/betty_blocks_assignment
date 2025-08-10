import {useState, useRef} from "react";
import {
    type CompilerResponse,
    dataCompilerApi,
    type TableSchema,
} from "../services/dataCompilerApi.tsx";
import * as React from "react";

function DataCompilerPage() {
    const [message, setMessage] = useState<string>("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");
    const [isLoading, setIsLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    handleCompileJson(
                        JSON.parse(event.target?.result as string),
                        setMessage,
                        setMessageType,
                        setIsLoading,
                    ).catch((_error) => {
                        setMessage(
                            "An unexpected error occurred during compilation process",
                        );
                        setMessageType("error");
                        setIsLoading(false);
                    });
                } catch (_error) {
                    setMessage("Invalid JSON file format");
                    setMessageType("error");
                }
            };
            reader.readAsText(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <h1>Data Compiler</h1>

            {message && (
                <div
                    style={{
                        padding: "10px",
                        margin: "10px 0",
                        borderRadius: "4px",
                        backgroundColor: messageType === "success" ? "#d4edda" : "#f8d7da",
                        color: messageType === "success" ? "#155724" : "#721c24",
                        border: `1px solid ${messageType === "success" ? "#c3e6cb" : "#f5c6cb"}`,
                    }}
                >
                    {message}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{display: "none"}}
                data-testid="file-input"
            />
            <button disabled={isLoading} onClick={triggerFileInput}>
                {isLoading ? "Processing..." : "Upload JSON"}
            </button>
        </div>
    );
}

const handleCompileJson = async (
    jsonData: TableSchema,
    setMessage: (message: string) => void,
    setMessageType: (type: "success" | "error" | "") => void,
    setIsLoading: (loading: boolean) => void,
) => {
    setIsLoading(true);
    setMessage("");

    try {
        const response = await dataCompilerApi.compileJson(jsonData);
        const result: CompilerResponse = await response.json();

        if (response.ok && response.status === 200) {
            setMessage("JSON compiled successfully");
            setMessageType(result.status);
        } else {
            setMessage(
                result.message || "Failed to connect to compile the JSON file. Please try again.",
            );
            setMessageType(result.status);
        }
    } catch (_error) {
        setMessage("Failed to connect to the compiler service. Please try again.");
        setMessageType("error");
    } finally {
        setIsLoading(false);
    }
};

export default DataCompilerPage;
