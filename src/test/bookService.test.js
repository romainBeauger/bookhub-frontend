import { describe, expect, it } from "vitest";
import { buildBooksQueryParams } from "../services/bookService.js";

describe("buildBooksQueryParams", () => {
    it("serializes only non-empty filters", () => {
        const params = buildBooksQueryParams({
            q: "dune",
            author: "",
            categoryId: "3",
            available: "true",
            publishedFrom: "1960-01-01",
            publishedTo: "",
            sort: "asc",
            page: 2,
            limit: 20,
        });

        expect(params.toString()).toBe(
            "q=dune&categoryId=3&publishedFrom=1960-01-01&available=true&sort=asc&page=2&limit=20"
        );
    });

    it("normalizes boolean availability values", () => {
        expect(
            buildBooksQueryParams({ available: 1 }).get("available")
        ).toBe("true");
        expect(
            buildBooksQueryParams({ available: 0 }).get("available")
        ).toBe("false");
        expect(
            buildBooksQueryParams({ available: "" }).get("available")
        ).toBeNull();
        expect(
            buildBooksQueryParams({ sort: "invalid" }).get("sort")
        ).toBeNull();
        expect(
            buildBooksQueryParams({ sort: "random" }).get("sort")
        ).toBe("random");
    });
});
