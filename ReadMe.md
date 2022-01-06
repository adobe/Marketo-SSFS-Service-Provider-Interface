# Self-Service Flow Actions Service Provider Interface
Self-service Flow Actions is a framework for creating and publishing HTTP APIs for consumption by Marketo Smart Campaigns as flow actions. The accompanying OpenAPI/Swagger document is a Service-Provider Interface describing how an API must be implemented for automatic integration to Marketo instances.  Implementation of an API requires at least 3 and as many as 7 endpoints, definition of an authentication schema, and the components and schemas required for implementation

**Note: This is currently a pre-release feature and is only available to Marketo Subscriptions enrolled in the Closed Beta at this time**


[//]: # (Add Overview Diagram Here)

## Changes from 0.2.3

* Installation is now initiated with Swagger API definition rather than serviceDefinition endpoint
* Removed auth, support contact, settings from serviceDefinition and moved them to Swagger
    * Authentication should be defined using security and securitySchemes
    * use x-fields to define non-standard names or patterns
* Use x-schemaVersion to indicate version of CFA-Swagger.yaml used to define your API

## Endpoints

### /getServiceDefinition

This endpoint is the entry point for Marketo to begin onboarding of your service into an individual instance.  It describes most of the configuration required to implement a service, includes links to other endpoints, describes the chosen authentication scheme, and describes the lead, activity, and contextual data required by the service to operate.

#### Authentication

Currently, only Basic and API-Key based authentication are supported.  Support for OAuth2 Client Credentials, Refresh Token, and Authorization Code grant types, as well as JWT authentication are planned.

Authentication type is set in the Service Definition under authSetting.  Setting the authType to 'basic' will prompt end users for a username and password during service configuration.  If your service does not use the 'realm' component of basic authentication as defined in [RFC 7235](https://datatracker.ietf.org/doc/html/rfc7235#section-2.2), then you should also set realmRequired to 'false.'  During invocation Marketo will [encode the credentials as defined by the RFC](https://datatracker.ietf.org/doc/html/rfc7235#section-2.1) and send them in the Authorization header. 


#### Field Mappings

In order for lead data to be sent to or received from a service, those fields must be mapped to an existing Marketo field.  Field mappings have two types, outgoing and incoming (relative to invocation by Marketo).  Outgoing fields are sent by Marketo to the service during invocation, while incoming fields are received by Marketo through the callback and have their values written back to the lead record.  There are also two usage modes for field mappings: Service-Driven Mappings for services that have a fixed and predetermined set of person-fields to complete data processing, like an event registration service, and User-Driven Mappings for services that have generic arguments, like a service for looking up data from tables uploaded by users.

Fields that have been mapped, where user or service-driven, are sent to the service when refreshing picklist choices in the fieldMappingContext object, so that mapped fields may be used to generate choices.  See [Picklists](#getpicklist)

##### Service-Driven Mappings

If your service requires a fixed set of inputs to process a record, then using Service-Driven Mappings is likely the correct choice for you.  Take an example use case, registering for an event.  A typical registration will require Full Name, Contact Info (Phone and/or Email), and Job Title.  In this case your invocationPayloadDef.fields might look like this:

`[
    {
        "required": true,
        "serviceAttribute": "JobTitle",
        "suggestedMarketoAttribute": "title",
        "dataType": "string"
    },
    {
        "required": true,
        "serviceAttribute": "Email",
        "suggestedMarketoAttribute": "email",
        "dataType": "email"
    },
    {
        "required": true,
        "serviceAttribute": "Phone",
        "suggestedMarketoAttribute": "phone",
        "dataType": "string"
    },
    {
        "required": true,
        "serviceAttribute": "FirstName",
        "suggestedMarketoAttribute": "firstName",
        "dataType": "string"
    },
    {
        "required": true,
        "serviceAttribute": "LastName",
        "suggestedMarketoAttribute": "lastName",
        "dataType": "string"
    }
]`

In this example, when onboarding, JobTitle will default to mapping to the field with the REST API Name 'title.'  While this is likely ideal for most cases, some Marketo subscriptions may be configured to use the Job Title field differently than the service provider expects.  If a subscription uses this field to hold info on Job Function or Job Level, then an admin might choose to map to a field which has more appropriate data based on their own instance configuration.  Service-driven mappings work in the same way for the callback as they do for invocation, except lead-fields in the callback may not be required, so Admins may always choose to leave callback fields unmapped.



##### User-Driven Mappings

If your service has a flexible set of inputs and outputs, then user-driven mappings are likely the best choice for your service.  Using a lookup table flow step as an example, if we have a country code lookup table where we need to send a 'country' field and receive a 'countryCode' field, then an admin will need to manually add those fields during onboarding.

#### Flow and Global Parameters

Aside from field mappings, Flow and Global parameters are the primary means of parameterization when invoking a service.  If parameters have suggested values, then the 'picklistUrl' attribute should be populated with your /getPicklist URL.  If this parameter can only accept a fixed set of values then it should have both a picklistUrl and have enforcePicklistSelect set to true.

**Flow** parameters are assigned at the individual flow step level, meaning that these parameters may have completely different values from one campaign to another.  In our event-registration example, we would need to define an "Event" Flow parameter as a string to select the event to register for.  In most cases, it's easier for services to deal with IDs and users to deal with Names, so for cases like this, you should consider configuring the parameter as a picklist so that you can offer the Event Name to the user, but receive the submitted ID value.  See [/getPicklist](#getpicklist) for more information

**Flow Parameters and Activity Attributes must not have any overlapping field names**

**Global** parameters are assigned at the service level by an admin user.  Global params are submitted with every invocation request.  In our Lookup Table use case example, "Directory" would be an example of a global parameter, where in order to provide a reduced picklist of tables to the end user, the admin would give the value of the directory where the relevant lookup tables for their instance live on the service-side

#### Activity Attributes

Activity attributes define the data that you can send back and write to an activity in the 'attributes' of your callbackPayloadDef in your service definition.  Activities in Marketo serve two primary purposes: driving triggered events, and recording an event related to a person.  You may not use the names _success_, _reason_, or _errorCode_ as these are reserved created for all SSFS activity types and can be written to in the [selfServiceFlowComplete Callback](#selfserviceflowcompletecallback).  When written, activities will log both the values submitted in the callback, and the parameter values of the executed flow step choice.

**Flow Parameters and Activity Attributes must not have any overlapping field names**

The **primaryAttribute** field must be a flow parameter.

#### Context Data

### /async

This endpoint is invoked by Marketo when the flow action is invoked by a Marketo Smart Campaign.  Marketo sends lead data, execution context, flow parameters, and global parameters to this endpoint, as well as a callback URL and one-time use authentication token, so that the service can return data via the callback.  The invoker expects the service to return a 201 upon successful acceptance of the request.  Synchronous invocation is not supported.

#### selfServiceFlowComplete Callback

When processing of the invocation request has been completed, lead and activity data are returned via callback.  Data must be passed back to lead fields and activity attributes in the same manner as described by the service definition.  

When Data Value Change activities are recorded as the result of a callback, the "Source" and "Reason" attributes will be populated with the following data:
* Source: "{Service Name} ({Id})"
* Reason: "Smart Campaign: {Id}, Step Seq ID: {Id}"

##### Default Values

Lead and activity data have have default values set through the callback.  This can reduce the amount of data which needs to be sent over the wire, and can simplify mapping data back to Marketo if appropriate for your service.

##### Errors

Chunk-level errors not reported by the http response to invocation should be represented by errorCode and errorMessage in the callback payload.  errorCode is used to classify the error in Marketo service logs, and each instance will increment the error reporting count for the day.  errorMessage will be recorded to the logged event.  Error codes for individual activities and chunk-level failures should not have overlapping names to avoid complications in statistical reporting.

##### callbackData

callbackData is where record-specific values for the person and activity are written in leadData and activityData respectively.  Each callbackData must have a leadData with an _id_ property or it will be recorded as unsuccessful.  Other properties must be defined in the serviceDefinition and mapped by an admin of the invoking instance in order to be written.  In order to correctly report on failures to execute a job successfully for an individual record, in activityData, you should set success to false and populate errorCode with a string classifying the reason for failure, e.g. LOOKUP_VALUE_NOT_FOUND, and reason with a detailed message specific to the failure, e.g. "No value found for search parameters, Key: country Value: Cascadia."  Error codes for individual activities and chunk-level failures should not have overlapping names to avoid complications in statistical reporting.  If a record

### /status

Status and health endpoint that the service may use to provide Informational, Warning, or Error notifications outside of the invocation/callback workflow.  This endpoint is invoked by Marketo in a nightly job.

### /getPicklist - _Optional_

Endpoint to return picklist choices for flow of global parameters defined as picklists in the service definition.  A maximum of 1000 choices per field are supported at this time.  Supports separate display and picklist values.  A submittedValue and displayValue with an en_US default is required.  When invoked, Marketo will send a name and a type, either flow or global, which your service can use to determine which choices to respond with.

If implemented, Marketo will poll this endpoint in a nightly job for each parameter in your service definition with a populated picklistUrl parameter.

### /brandIcon - _Optional_

Endpoint that returns an image which identifies your brand for use in the Marketo UI

### /serviceIcon - _Optional_

Endpoint that returns an image which identifies your service for use in the Marketo UI.  This icon is used to represent your service's flow action in the Campaign Flow Palette in the UI

## Errors and Logging

### Error Codes

**Error codes for individual activities and chunk-level failures should not have overlapping names to avoid complications in statistical reporting.**

Error codes are used to classify outcomes of failed chunks, and failed records.  Each error code has a daily count which is incremented for each instance of an error received through invocation HTTP Response, e.g. 429 Too Many Requests, in the callback at the chunk level, e.g. TABLE_FILE_NOT_FOUND, or at the record level, e.g LOOKUP_VALUE_NOT_FOUND.

## FAQs

### What types of Marketo Subscriptions have access to this feature?

As of writing, September 2021, Self-Service Flow actions are planned for inclusion in all Marketo Engage packages when it becomes available for general release

### What kind of data can I send and receive with this feature?

You can send any lead field, flow step or global parameters, and execution context.  Token values, e.g. {{my.Token}}, may also be used in flow or global parameters.

### How does internationalization work?

Many fields allow internationalization based on country and locale code, e.g. "en_US"  However, Marketo only offers UI support for a [fixed set of languages](https://experienceleague.adobe.com/docs/marketo/using/product-docs/administration/settings/select-your-language-locale-and-time-zone.html?lang=en), and does not offer locale translation support as of September 2021.  This means that you may offer additional translations that are locale-specific or have unsupported language codes, but until support is added, there will be no way to access those translations.

### What data types are supported?

These are defined in '#components/schemas/fieldType': boolean, integer, date, datetime, email, float, phone, score, string, url, text.  [Read more about Marketo Field Types](https://experienceleague.adobe.com/docs/marketo/using/product-docs/administration/field-management/custom-field-type-glossary.html?lang=en)

### What will happen if data I return to Marketo exceeds the maximum length of the target field?

String and string-like values that exceed maximum length of the target field will be truncated to that length

### What happens if I update the API credentials of an integration?

Updating API credentials is not recommended if you intend to continue to use the service, but if the following conditions are met, then continued operation is possible:  If the new account shares the same URLs, API definition, and Service Definition, then the service should continue to operate as normal.  If the new account does not have the same configuration, then Marketo may not be able to invoke the service correctly.

## Useful Links

* [Marketo Developer Documentation](https://developers.marketo.com)
* [Marketo Engage Documentation](https://docs.marketo.com)
* [IO Runtime Documentation](https://www.adobe.io/apis/experienceplatform/runtime/docs.html)
* [Project Firefly Documentation](https://www.adobe.io/project-firefly/docs/overview/)
* [Lookup Table POC](https://github.com/adobe/mkto-flow-lookup)
