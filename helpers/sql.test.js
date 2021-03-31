const {sqlForPartialUpdate} = require("./sql")

describe("sqlForPartialUpdate", () => {
    test("updates 1 item", () => {
        const result = sqlForPartialUpdate(
            { field1: "val1" },
            { field1: "field1", field2: "val2"});
        expect(result).toEqual({
            setCols: "\"field1\"=$1",
            values: ["val1"]
        });
    });

    test("updates 2 items", () => {
        const result = sqlForPartialUpdate(
            { field1: "val1", field2: "val2" },
            { field2: "field2"});
        expect(result).toEqual({
            setCols: "\"field1\"=$1, \"field2\"=$2",
            values: ["val1", "val2"],
        });
    });
});