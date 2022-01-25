const AJV = require('ajv');
const ajv = new AJV({unknownFormats: ["int32", "int64"]});

const fs = require('fs');

const yaml = require('js-yaml')

const metaschema = yaml.load(fs.readFileSync('./metaschema.yaml'));
const swagger = yaml.load(fs.readFileSync('./CFA-Swagger.yaml'));

//ajv.addMetaSchema(metaschema, "meta")

describe("schema tests", () =>{
    test("test metaschema", async () =>{
        // expect(ajv.validateSchema(swagger)).toEqual(true)
        console.log(metaschema)
        var validate = ajv.compile(metaschema)
        
        var valid = validate(swagger)
        if(valid != true){
            console.log("Errors", validate.errors);
        }
        expect(valid).toEqual(true)
    })
})
