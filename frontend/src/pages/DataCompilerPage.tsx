function DataCompilerPage() {
    return (
        <div>
            <h1>Data Compiler</h1>
            <button
                onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".json";
                    input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                try {
                                    const json = JSON.parse(event.target?.result as string);
                                    // Log it out for now as a placeholder
                                    console.log("Uploaded JSON:", json);
                                } catch (error) {
                                    console.error("Invalid JSON file:", error);
                                }
                            };
                            reader.readAsText(file);
                        }
                    };
                    input.click();
                }}
            >
                Upload JSON
            </button>
        </div>
    );
}

export default DataCompilerPage;
