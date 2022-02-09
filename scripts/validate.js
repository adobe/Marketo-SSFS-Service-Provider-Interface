const AJV = require('ajv');

const fs = require('fs');
const yaml = require('js-yaml')


/**
 * 
 * @param {Object} object JS Object to validate
 * @param {Object} schema Schema to validate object with
 * 
 * @returns {boolean}
 * 
 * @throws {Error}
 */
const validate =  function(object, schema){
    var ajv = ajv = new AJV({unknownFormats: ["int32", "int64", "datetime", "binary"]});
    validator = ajv.compile(schema);
    var valid = validator(object)
    if(valid){
        return valid;
    }else if(validator.errors != null && validator.errors.length > 0 ){
        console.error("Errors: ", validator.errors)
        throw new Error(validator.errors[0])
    }
}
const validateFile = function (filePath, schemaPath) {
    // const schema = yaml.load(fs.readFileSync("../schema.yaml"))
    const schemaFile = fs.readFileSync(schemaPath);
    var schema;
    if (schemaPath.indexOf(".yaml") > -1 || schemaPath.indexOf(".yml")) {
        schema = yaml.load(schemaFile)
    } else if (filePath.indexOf(".json")) {
        schema = JSON.parse(schemaFile);
    } else {
        throw new Error(`Schema with path ${schemaPath} is not a json or yaml file`)
    }

    var file = fs.readFileSync(filePath);
    var obj;
    if (filePath.indexOf(".yaml") > -1 || filePath.indexOf(".yml")) {
        obj = yaml.load(file)
    } else if (filePath.indexOf(".json")) {
        obj = JSON.parse(file);
    } else {
        throw new Error(`file with path ${filePath} is not a json or yaml file`)
    }
    var valid;
    try {
        valid = validate(obj, schema)
    } catch (error) {
        console.error("Encountered validations errors: ", error);
    }

    if (valid) {
        console.log("File is a valid SSFS API definition");
        return true
    }else {
        return false
    }
}
module.exports = {
    validate,
    validateFile
}