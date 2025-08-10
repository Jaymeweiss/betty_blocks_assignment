import {describe, it, expect} from "vitest";
import DataApiPage from "../DataApiPage";
import {render, screen} from "@testing-library/react";


describe("DataApiPage", () => {
    it("should only the DataAPI text by default", () => {
        render(<DataApiPage/>);
        expect(screen.getByText("Data API")).toBeInTheDocument();
    });
})
