import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {BrowserRouter} from "react-router-dom";
import App from "../App";

const AppWithRouter = () => (
    <BrowserRouter>
        <App/>
    </BrowserRouter>
);

describe("App", () => {
    it("should render the homepage by default", () => {
        window.history.pushState({}, "Test page", "/app");
        render(<AppWithRouter/>);
        expect(screen.getByText("Data API")).toBeInTheDocument();
    });

    it("should render the compiler page on /compiler route", () => {
        window.history.pushState({}, "Test page", "/compiler");
        render(<AppWithRouter/>);
        expect(screen.getByText("Data Compiler")).toBeInTheDocument();
        expect(screen.getByText("Upload JSON")).toBeInTheDocument();
    });

    it("should render the home page on / route", () => {
        window.history.pushState({}, "Test page", "/");
        render(<AppWithRouter/>);
        expect(screen.getByText("Data API")).toBeInTheDocument();
    });
});
