# Self-Service Flow Actions Service Provider Interface
Self-service Flow Actions is a framework for creating and publishing HTTP APIs for consumption by Marketo Smart Campaigns as flow actions. The accompanying OpenAPI/Swagger document is a Service-Provider Interface describing how an API must be implemented for automatic integration to Marketo instances.  Implementation of an API requires at least 3 and as many as 7 endpoints, definition of an authentication schema, and the compoenents and schemas required for implementation


[//]: # (Add Overview Diagram Here)

## Endpoints

### /getServiceDefinition

This endpoint is the entry point for Marketo to begin onboarding of your service into an individual instance.  It describes most of the configuration required to implement a service, includes links to other endpoints, describes the chosen authentication scheme, and describes the lead, activity, and contextual data required by the service to operate.

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

### Authentication

### Field Mappings

In order for lead data to be sent to or received from a service, those fields must be mapped to an existing Marketo field.  Field mappings have two types, outgoing and incoming (relative to invocation by Marketo).  Outgoing fields are sent by Marketo to the service during invocation, while incoming fields are received by Marketo through the callback and have their values written back to the lead record.  There are also two usage modes for field mappings: Service-Driven Mappings for services that have a fixed and predetermined set of person-fields to complete data processing, like an event registration service, and User-Driven Mappings for services that have generic arguments, like a service for looking up data from tables uploaded by users

#### Service-Driven Mapppings

#### User-Driven Mappings

### Activity Attributes

### Flow and Global Parameters

## Contextual Data


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