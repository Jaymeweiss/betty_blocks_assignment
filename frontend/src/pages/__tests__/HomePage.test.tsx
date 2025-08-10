import {describe, it, expect} from "vitest";
import HomePage from "../HomePage";
import {render, screen} from "@testing-library/react";


describe("HomePage", () => {
    it("should only the DataAPI text by default", () => {
        render(<HomePage/>);
        expect(screen.getByText("Data API")).toBeInTheDocument();
    });
})
