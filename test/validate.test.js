const AJV = require('ajv');
const ajv = new AJV({ unknownFormats: ["int32", "int64", "datetime", "binary"] });

const validate = require("../scripts/validate").validate
const validateFile = require("../scripts/validate").validateFile
const fs = require('fs');
const yaml = require('js-yaml')

const testSchema1 = {
    title: "testSchema",
    type: "object",
    required: ["test1"],
    properties: {
        test1: {
            type: "string",
            enum: ["string"]
        }
    }
}
const testObj1 = {
    test1: "string"
}
const testObj2 = {
    test1: true,
    test2: false
}

describe("validate tests", () => {


    test("test validate function positive", async () => {
        var valid = validate(testObj1, testSchema1)
        expect(valid).toEqual(true)
    }),
    test("test validate function negative", async ()  => {
        try {
            var valid = validate(testObj2, testSchema1)
        } catch (error) {
            expect(error instanceof Error).toEqual(true)
        }
    })
    test("validateFile", async () => {
        var valid = validateFile("./CFA-Swagger.yaml", "./schema.yaml")
        expect(valid).toEqual(true)
    })
})