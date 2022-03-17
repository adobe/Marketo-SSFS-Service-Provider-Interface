# Self-Service Flow Actions Service Provider Interface
Self-service Flow Actions is a framework for creating and publishing HTTP APIs for consumption by Marketo Smart Campaigns as flow actions. The accompanying OpenAPI/Swagger document is a Service-Provider Interface describing how an API must be implemented for automatic integration to Marketo instances.  Implementation of an API requires at least 3 and as many as 7 endpoints, definition of an authentication schema, and the components and schemas required for implementation

**Note: This is currently a pre-release feature in open Beta testing**


[//]: # (Add Overview Diagram Here)

## Changelog

### Changes from 3.0

* schema and tests added for validating OpenAPI definitions
* Added full authoring section
* icon and provider instructions booleans in serviceDefinition have been removed.  These endpoints will be inferred based on whether they are included as paths in your API definition

### Changes from 0.2.3

* Installation is now initiated with Swagger API definition rather than serviceDefinition endpoint
* Removed auth, support contact, settings from serviceDefinition and moved them to Swagger
    * Authentication should be defined using security and securitySchemes
    * use x-fields to define non-standard names or patterns
* Use x-schemaVersion to indicate version of CFA-Swagger.yaml used to define your API

## Authentication

Currently, only Basic and API-Key based authentication are supported.  Support for OAuth2 Client Credentials, Refresh Token, and Authorization Code grant types, as well as JWT authentication are planned.

Authentication type is set in your swagger definition using the securitySchemes object .  Setting the authType to 'basic' will prompt end users for a username and password during service configuration.  If your service does not use the 'realm' component of basic authentication as defined in [RFC 7235](https://datatracker.ietf.org/doc/html/rfc7235#section-2.2), then you should also set realmRequired to 'false.'  During invocation Marketo will [encode the credentials as defined by the RFC](https://datatracker.ietf.org/doc/html/rfc7235#section-2.1) and send them in the Authorization header.



## Authoring

Your API definition must conform both to the OpenAPI 3 specification and the included schema.yaml.  This section will only discuss requirements beyond the OpenAPI specification.  [More information on OpenAPI requirements can be found here.](https://swagger.io/specification/)  The example API definition provides extensive examples and descriptions of the metadata described in this section.

### info

Your info section must include:

* _x-providerName_: A _string_ which is used as the name of your service provider when installed in a Marketo instance
* _x-schemaVersion_: A _string_ which must match a version of the schema used to create it.  This corresponds to this repository's version in package.json
* _x-supportContact_: A _string_ which must be either an email address of URL which users can use to access support for your service

### Security

Your security section must use one of the sample schemes, _apiKey_, _oauth2_, or _basic_

### Paths

#### /getServiceDefinition

This endpoint describes most of the configuration required to implement a service, includes links to other endpoints, describes the chosen authentication scheme, and describes the lead, activity, and contextual data required by the service to operate.

Your service definition requires:

* _apiName_: A _string_ which is the default identifier for service and activity.  Users installing multiple service with the same apiName will be prompted to resolve collision by inputting a custom name during installation.  Values 'success', 'reason', and 'errorCode' are always included in activityData and may not be declared here, see '#components/schemas/callbackData'. 
* _i18n_: An _object_ (serviceI18nObject) used to provide localized user-friendly strings used in the UI
* _primaryAttribute_: A _string_ which is the API name of the attribute that describes the primary asset. This must match an attribute from the flow attribute list and *must not* match an attribute from the callback attribute list. 
* _invocationPayloadDef_: An _object_ used to describe user inputs, and data from leads and execution context, which is sent by Marketo to your service upon invocation
* _callbackPayloadDef_: An _object_ used to describe data which will be returned by your service in the callback to Marketo

##### invocationPayloadDef

* _globalAttributes_ : A _list_ of attributes (invocationAttributeObjects) describing expected global user inputs.  Global attributes can be set during installation or from the Service Provider admin menu.  Global attributes will be included in every invocation if set.
* _flowAttributes_ : A _list_ of attributes (invocationAttributeObjects) describing expected flow step inputs.  Flow attributes are set for each individual instance of a flow step and are sent per-lead in the flowStepContext object.
* _fields_ : A _list_ of field mappings (invocationFieldMapping) needed for invocation.  Fields which are mapped in Marketo are sent in the leadContext object.  If userDrivenMapping is 'true', the contents of this array will be ignored
* _headers_ : A _list_ of headers (headerAttributeObject) to be included in invocations of /async.  Headers can be set during installation or from the Service Provider admin menu.  Like global attributes, headers will be included in every invocation if set.
* _userDrivenMapping_ : A _boolean_ which indicates whether the service will provide a pre-defined list of [mappings](#field-mappings) for outgoing fields.  If 'true', 'fields' will be ignored, and mappings must be added manually by users in the UI, see [User Driven Mappings](#user-driven-mappings).
* _programContext_ : A _boolean_ indicating whether to send program context on invocation.
* _campaignContext_ : A _boolean_ indicating whether to send campaign context on invocation.
* _triggerContext_ : A _boolean_ indicating whether to send trigger context on invocation.
* _programMemberContext_ : A _boolean_ indicating whether to send program member context on invocation.
* _subscriptionContext_: A _boolean_ indicating whether to send subscription context on invocation.
* _myTokenContext_ : A _list_ of strings used to indicate which My Token values from the executing context should be sent upon invocation.  The list should be formatted without brackets or prefix.  e.g. A token from the UI called "{{my.Event Date}}" would be requested as "Event Date"

##### Flow and Global Parameters

Aside from field mappings, Flow and Global parameters are the primary means of parameterization when invoking a service.  If parameters have suggested values, then the 'picklistUrl' attribute should be populated with your /getPicklist URL.  If this parameter can only accept a fixed set of values then it should have both a picklistUrl and have enforcePicklistSelect set to true.

**Flow** parameters are assigned at the individual flow step level, meaning that these parameters may have completely different values from one campaign to another.  In our event-registration example, we would need to define an "Event" Flow parameter as a string to select the event to register for.  In most cases, it's easier for services to deal with IDs and users to deal with Names, so for cases like this, you should consider configuring the parameter as a picklist so that you can offer the Event Name to the user, but receive the submitted ID value.  See [/getPicklist](#getpicklist) for more information

**Flow Parameters and Activity Attributes must not have any overlapping field names**

**Global** parameters are assigned at the service level by an admin user.  Global params are submitted with every invocation request.  In our Lookup Table use case example, "Directory" would be an example of a global parameter, where in order to provide a reduced picklist of tables to the end user, the admin would give the value of the directory where the relevant lookup tables for their instance live on the service-side

Invocation attributes require:
* _apiName_ : A _string_ used as the key for the attribute during invocation
* _i18n_: An _object_ Used to provide localized, user-friendly attribute names in the UI.  Attributes are of the type _attributeI18nObject_.  en_US is always required, while other localizations may be provided using four letter language/locale keys, e.g. 'ca_FR'.
* _dataType_ : A _string_ matching a _fieldType_.  Any of: boolean, integer, date, datetime, email, float, score, string, url, or text.

##### Context Data

Various types of contexts may be requested to aid your service in processing lead data.  The following are boolean fields used to indicate your service should send context for that object if available.

* programContext
* campaignContext 
* triggerContext
* programMemberContext
* subscriptionContext

You may also send My Token context by giving an array of strings in the 'myTokenContext' parameter:

```"myTokenContext": ["Event Date", "Event Address"]```

##### callbackPayloadDefObject:

Your callbackPayloadDef is used to define what data may be returned by the service in the callback, and how that data can be mapped back to lead and activity records.

*[_attributes_](#activity-attributes) defines result fields for your callback, and will be logged as an activity related to the correponding lead when data is sent.
*[_fields_](#field-mappings) defines which fields you want to write lead data to.  Fields defined here may be mapped by admin users to send data to the correct fields for a particular Marketo instance.
*_userDrivenMapping_A _boolean_ which indicates whether the service will provide a pre-defined list of [mappings](#field-mappings) for incoming  fields.  If 'true', 'fields' will be ignored, and mappings must be added manually by users in the UI, see [User Driven Mappings](#user-driven-mappings), otherwise incoming fields will use [Service-Driven Mappings](#service-driven-mappings)

###### Field Mappings

In order for lead data to be sent to or received from a service, those fields must be mapped to an existing Marketo field.  Field mappings have two types, outgoing and incoming (relative to invocation by Marketo).  Outgoing fields are sent by Marketo to the service during invocation, while incoming fields are received by Marketo through the callback and have their values written back to the lead record.  There are also two usage modes for field mappings: Service-Driven Mappings for services that have a fixed and predetermined set of person-fields to complete data processing, like an event registration service, and User-Driven Mappings for services that have generic arguments, like a service for looking up data from tables uploaded by users.

Fields that have been mapped, where user or service-driven, are sent to the service when refreshing picklist choices in the fieldMappingContext object, so that mapped fields may be used to generate choices.  See [Picklists](#getpicklist)

###### Service-Driven Mappings

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



###### User-Driven Mappings

If your service has a flexible set of inputs and outputs, then user-driven mappings are likely the best choice for your service.  Using a lookup table flow step as an example, if we have a country code lookup table where we need to send a 'country' field and receive a 'countryCode' field, then an admin will need to manually add those fields during onboarding.

##### Activity Attributes

Activity attributes define the data that you can send back and write to an activity in the 'attributes' of your callbackPayloadDef in your service definition.  The full attribute list of your activity is the combination of your activity attributes and flow attributes defined in invocationPayloadDef.  Activities in Marketo serve two primary purposes: driving triggered events, and recording an event related to a person.  You may not use the names _success_, _reason_, or _errorCode_ as these are reserved created for all SSFS activity types and can be written to in the [selfServiceFlowComplete Callback](#selfserviceflowcomplete-callback).  When written, activities will log both the values submitted in the callback, and the parameter values of the executed flow step choice.

**Flow Parameters and Activity Attributes must not have any overlapping field names**

The **primaryAttribute** field must also be a flow parameter.

#### /async

This endpoint is invoked by Marketo when the flow action is invoked by a Marketo Smart Campaign.  Marketo sends lead data, execution context, flow parameters, and global parameters to this endpoint, as well as a callback URL and one-time use authentication token, so that the service can return data via the callback.  The invoker expects the service to return a 201 upon successful acceptance of the request.  Synchronous invocation is not supported.

##### selfServiceFlowComplete Callback

When processing of the invocation request has been completed, lead and activity data are returned via callback.  Data must be passed back to lead fields and activity attributes in the same manner as described by the service definition.  

When Data Value Change activities are recorded as the result of a callback, the "Source" and "Reason" attributes will be populated with the following data:
* Source: "{Service Name} ({Id})"
* Reason: "Smart Campaign: {Id}, Step Seq ID: {Id}"

###### Default Values

Lead and activity data have have default values set through the callback.  This can reduce the amount of data which needs to be sent over the wire, and can simplify mapping data back to Marketo if appropriate for your service.

###### Errors

Chunk-level errors not reported by the http response to invocation should be represented by errorCode and errorMessage in the callback payload.  errorCode is used to classify the error in Marketo service logs, and each instance will increment the error reporting count for the day.  errorMessage will be recorded to the logged event.  Error codes for individual activities and chunk-level failures should not have overlapping names to avoid complications in statistical reporting.

###### callbackData

callbackData is where record-specific values for the person and activity are written in leadData and activityData respectively.  Each callbackData must have a leadData with an _id_ property or it will be recorded as unsuccessful.  Other properties must be defined in the serviceDefinition and mapped by an admin of the invoking instance in order to be written.  In order to correctly report on failures to execute a job successfully for an individual record, in activityData, you should set success to false and populate errorCode with a string classifying the reason for failure, e.g. LOOKUP_VALUE_NOT_FOUND, and reason with a detailed message specific to the failure, e.g. "No value found for search parameters, Key: country Value: Cascadia."  Error codes for individual activities and chunk-level failures should not have overlapping names to avoid complications in statistical reporting.  If a record

#### /status

Status and health endpoint that the service may use to provide Informational, Warning, or Error notifications outside of the invocation/callback workflow.  This endpoint is invoked by Marketo in a nightly job.

#### /getPicklist - _Optional_

Endpoint to return picklist choices for flow of global parameters defined as picklists in the service definition.  A maximum of 1000 choices per field are supported at this time.  Supports separate display and picklist values.  A submittedValue and displayValue with an en_US default is required.  When invoked, Marketo will send a name and a type, either flow or global, which your service can use to determine which choices to respond with.

If implemented, Marketo will poll this endpoint in a nightly job for each parameter in your service definition with a populated picklistUrl parameter.

#### /brandIcon - _Optional_

Endpoint that returns an image which identifies your brand for use in the Marketo UI

#### /serviceIcon - _Optional_

Endpoint that returns an image which identifies your service for use in the Marketo UI.  This icon is used to represent your service's flow action in the Campaign Flow Palette in the UI

### components

Your API definition should reuse the schemas from the sample definition, CFA-swagger.yaml.  securitySchemes should be modified to reflect your authentication scheme 

## Errors and Logging

### Error Codes

**Error codes for individual activities and chunk-level failures should not have overlapping names to avoid complications in statistical reporting.**

Error codes are used to classify outcomes of failed chunks, and failed records.  Each error code has a daily count which is incremented for each instance of an error received through invocation HTTP Response, e.g. 429 Too Many Requests, in the callback at the chunk level, e.g. TABLE_FILE_NOT_FOUND, or at the record level, e.g LOOKUP_VALUE_NOT_FOUND.

## Data Types

Attributes and Fields you define must be of one of the following types:

* boolean
* integer
* date
* datetime
* email
* float
* score
* string
* url
* text

### Boolean

Returned values may have a value of _true_ or _false_.  Returning a primitive null will be treated as false

### Integer

Integers are signed 32-bit integers and may have values from -2147483648 to 2147483647

### Date

Accepts strings formatted with the full-date format described in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6), e.g. 2022-01-01

### Datetime

Any ISO 8601 datetime may be returned, but subsecond values are trimmed and are not stored.  For example: 2022-01-01T00:00:00.001 will be stored as 2022-01-01T00:00:00 without milliseconds

### Email

Accepts email-formatted strings, e.g. "test@example.com"

### Float

Accepts floating-point numbers

### Score

Scores are a special type of integer field in Marketo.  Two different types of values may be returned by services, relative score changes, and absolute score changes.  Relative score changes include either a + or - character, followed by an integer, e.g. +5 or -5.  When a relative score change is returned, the lead's value for that field will be increased or decreased by the given amount.  For example, if a lead has a score of 27, and a value of -5 is returned by your service, the resulting score will be 22.

If an absolute score change is returned, e.g. 5, then the lead's value for that field will be changed to the given value.  For example, if a lead has a score of 55 and your service returns a value of 0, then the resulting value will be 0.

In general, absolute score changes should only be used when resetting a lead's score.  For most day-to-day use cases, relative score changes should be employed

### String

Accepts any string up to 255 bytes.

### Url

Accepts any URL-formatted string up to 255 bytes.

### Text

Accepts a string up to 2000 bytes.

## FAQs

### How do I initiate installation of a Flow Step Service?

From the Admin -> Service Providers Menu, select Add New Service and input the URL of the Swagger Definition of your service.

### How can I validate my API definition?

After cloning the repository folder, in a terminal use the command:

```npm run validateFile ./schema.yaml <OpenAPI path>```

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
