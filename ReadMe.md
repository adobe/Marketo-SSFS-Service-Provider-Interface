# Self-Service Flow Actions Service Provider Interface
Self-service Flow Actions is a framework for creating and publishing HTTP APIs for consumption by Marketo Smart Campaigns as flow actions. The accompanying OpenAPI/Swagger document is a Service-Provider Interface describing how an API must be implemented for automatic integration to Marketo instances.  Implementation of an API requires at least 3 and as many as 7 endpoints, definition of an authentication schema, and the compoenents and schemas required for implementation


[//]: # (Add Overview Diagram Here)

## Endpoints

### /getServiceDefinition

This endpoint is the entry point for Marketo to begin onboarding of your service into an individual instance.  It describes most of the configuration required to implement a service, includes links to other endpoints, describes the chosen authentication scheme, and describes the lead, activity, and contextual data required by the service to operate.

#### Authentication

Currently, only Basic and API-Key based authentication are supported.  Support for OAuth2 Client Credentials, Refresh Token, and Authorization Code grant types, as well as JWT authentication are planned.


#### Field Mappings

In order for lead data to be sent to or received from a service, those fields must be mapped to an existing Marketo field.  Field mappings have two types, outgoing and incoming (relative to invocation by Marketo).  Outgoing fields are sent by Marketo to the service during invocation, while incoming fields are received by Marketo through the callback and have their values written back to the lead record.  There are also two usage modes for field mappings: Service-Driven Mappings for services that have a fixed and predetermined set of person-fields to complete data processing, like an event registration service, and User-Driven Mappings for services that have generic arguments, like a service for looking up data from tables uploaded by users.

Fields that have been mapped, where user or service-driven, are sent to the service when refreshing picklist choices in the fieldMappingContext object, so that mapped fields may be used to generate choices.  See [Picklists](#picklists)

##### Service-Driven Mapppings

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

#### Activity Attributes



#### Flow and Global Parameters





#### Context Data

### /async

This endpoint is invoked by Marketo when the flow action is invoked by a Marketo Smart Campaign.  Marketo sends lead data, execution context, flow parameters, and global parameters to this endpoint, as well as a callback URL and one-time use authentication token, so that the service can return data via the callback.  The invoker expects the service to return a 201 upon successful acceptance of the request.  Synchronous invocation is not supported.

#### selfServiceFlowComplete Callback

When processing fro the invocation request has been completed, lead and activity data are returned via callback.  Data must be passed back to lead fields and activity attributes in the same manner as described by the service definition.

##### Default Values

Lead and activity data have have default values set through the callback.  This can reduce the amount of data which needs to be sent over the wire, and can simplify mapping data back to Marketo if appropriate for your service.

### /status

Status and health endpoint that the service may use to provide Informational, Warning, or Error notifications outside of the invocation/callback workflow.  This endpoint is invoked by Marketo in a nightly job.

### /getPicklist - _Optional_

Endpoint to return picklist choices for flow of global parameters defined as picklists in the service definition.  A maximum of 1000 choices per field are supported at this time.  Supports separate display and picklist values

### /brandIcon - _Optional_

Endpoint that returns an image which identifies your brand for use in the Marketo UI

### /serviceIcon - _Optional_

Endpoint that returns an image which identifies your service for use in the Marketo UI.  This icon is used to represent your service's flow action in the Campaign Flow Pallette in the UI


## Configuration



### Picklists

## FAQs

### What types of Marketo Subscriptions have access to this feature?

As of writing, September 2021, Self-Service Flow actions are planned for inclusion in all Marketo Engage packages

### What kind of data can I send and receive with this feature?

You can send any lead field, flow step or global parameters, and execution context

## Useful Links

* [Marketo Developer Documentation](https://developers.marketo.com)
* [Marketo Engage Documentation](https://docs.marketo.com)
* [IO Runtime Documentation](https://www.adobe.io/apis/experienceplatform/runtime/docs.html)
* [Project Firefly Documentation](https://www.adobe.io/project-firefly/docs/overview/)