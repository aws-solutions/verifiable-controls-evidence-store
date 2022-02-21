<a name="top"></a>
# AGS Evidence Store v1.0.0

AGS Evidence Store API Documentation

# Table of contents

- [Evidences](#Evidences)
  - [Create a new evidence](#Create-a-new-evidence)
  - [Get all revisions for an evidence](#Get-all-revisions-for-an-evidence)
  - [Get an evidence revision by id](#Get-an-evidence-revision-by-id)
  - [Get attachment download url](#Get-attachment-download-url)
  - [Get evidence by id](#Get-evidence-by-id)
  - [Get evidence verification status](#Get-evidence-verification-status)
  - [Query evidences](#Query-evidences)
- [Provider](#Provider)
  - [Get evidence schema by id](#Get-evidence-schema-by-id)
- [Providers](#Providers)
  - [Add a new evidence schema](#Add-a-new-evidence-schema)
  - [Create new provider](#Create-new-provider)
  - [Enable/disable provider](#Enable/disable-provider)
  - [Get provider by id](#Get-provider-by-id)
  - [List providers](#List-providers)

___


# <a name='Evidences'></a> Evidences

## <a name='Create-a-new-evidence'></a> Create a new evidence
[Back to top](#top)

```
POST /evidences
```

### Headers - `Header`

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| X-API-Key | `UUID` | <p>The evidence provider's api key.</p> |

### Header examples
Header-Example:

```json
{
    "X-API-Key": "eaa54921-d77b-46e1-af1c-1ab92c7209f7"
}
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| providerId | `UUID` | <p>The evidence provider's id.</p> |
| targetId | `string` | <p>The evidence's target's id.</p> |
| additionalTargetIds | `string[]` | **optional** <p>The evidence's additional target ids.</p> |
| correlationId | `string` | **optional** <p>The evidence's correlation id.</p> |
| schemaId | `string` | <p>The evidence's content's schema id.</p> |
| content | `Object` | <p>The evidence's content.</p> |
| attachments | `Object[]` | **optional** <p>The evidence's attachments.</p> |
| attachments.objectKey | `string` | <p>The attachment's S3 object key.</p>_Size range: ...128_<br> |

### Parameters examples
`json` - Request-Example:

```json
{
    "providerId": "my-test-provider",
       "targetId": "my-app-2.1",
       "content": {
           "codeCoverage": "80%",
           "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
       },
       "schemaId": "code-coverage-1.0"
}
```

### Success response

#### Success response - `Success 201`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| evidenceId | `UUID` | <p>The evidence's id.</p> |
| providerId | `UUID` | <p>The issuing evidence provider's id.</p> |
| targetId | `string` | <p>The evidence's target's id.</p> |
| correlationId | `string` | **optional**<p>The evidence's correlation id.</p> |
| createdTimestamp | `string` | <p>The evidence's created timestamp.</p> |
| schemaId | `string` | <p>The evidence's schema's id.</p> |
| content | `Object` | <p>The evidence's content.</p> |
| attachments | `Object[]` | **optional**<p>The evidence's attachments.</p> |
| attachments.objectKey | `string` | <p>The attachment's S3 object key.</p> |
| attachments.hash | `string` | <p>The attachment's hash value in base64url encoded format.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 201 Created
{
       "evidenceId": "e8176aff-afc1-4936-8935-19d922ca98a6",
       "providerId": "my-test-authority",
       "targetId": "my-app-2.1",
       "createdTimestamp": "2021-05-07T08:39:49.304Z",
       "content": {
           "codeCoverage": "80%",
           "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
       },
       "schemaId": "code-coverage-1.0"
   }
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Get-all-revisions-for-an-evidence'></a> Get all revisions for an evidence
[Back to top](#top)

```
GET /evidences/{id}/revisions
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `UUID` | <p>The evidence's id.</p> |

### Parameters - `Optional Query Parameters`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| nextToken | `string` | **optional** <p>The pagination token.</p> |

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| total | `number` | <p>The total number of matched items.</p> |
| results | `Object[]` | <p>The search result.</p> |
| results.evidenceId | `UUID` | <p>The evidence's id.</p> |
| results.providerId | `UUID` | <p>The issuing evidence provider's id.</p> |
| results.targetId | `string` | <p>The evidence's target's id.</p> |
| results.[correlationId] | `string` | <p>The evidence's correlation id.</p> |
| results.createdTimestamp | `string` | <p>The evidence's created timestamp.</p> |
| results.schemaId | `string` | <p>The evidence's schema's id.</p> |
| results.content | `Object` | <p>The evidence's content.</p> |
| results.attachments | `Object[]` | **optional**<p>The evidence's attachments.</p> |
| results.attachments.url | `string` | <p>The attachment's S3 pre-signed url.</p> |
| results.attachments.hash | `string` | <p>The attachment's hash value in</p> |
| results.version | `number` | <p>The revision's version.</p> |
| nextToken | `string` | **optional**<p>The pagination token.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
   {
   "total": 20,
   "results": [
       {
       "evidenceId": "e8176aff-afc1-4936-8935-19d922ca98a6",
       "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
       "targetId": "toolkit-2.1",
       "createdTimestamp": "2021-05-07T08:39:49.304Z",
       "content": {
           "codeCoverage": "80%",
           "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
       },
       "schemaId": "code-coverage-1.0"
       },
       {
       "evidenceId": "14f840ff-65a6-4f5b-a878-427a8f87ba5d",
       "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
       "targetId": "release-2.3",
       "createdTimestamp": "2021-05-07T06:34:41.429Z",
       "content": {
           "codeCoverage": "80%",
           "executionId": "12cd7e84-c6a2-4f93-96fd-6dc9247a0777"
       },
       "schemaId": "code-coverage-1.0"
       },
       "version": 1
   ],
   "nextToken": "Mnwy"
   }
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Get-an-evidence-revision-by-id'></a> Get an evidence revision by id
[Back to top](#top)

```
GET /evidences/{id}/revisions/{revisionId}
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `UUID` | <p>The evidence's id.</p> |
| revisionid | `string` | <p>The revision's id.</p> |

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| evidenceId | `UUID` | <p>The evidence's id.</p> |
| providerId | `UUID` | <p>The issuing evidence provider's id.</p> |
| targetId | `string` | <p>The evidence's target's id.</p> |
| correlationId | `string` | **optional**<p>The evidence's correlation id.</p> |
| createdTimestamp | `string` | <p>The evidence's created timestamp.</p> |
| schemaId | `string` | <p>The evidence's schema's id.</p> |
| content | `Object` | <p>The evidence's content.</p> |
| attachments | `Object[]` | **optional**<p>The evidence's attachments.</p> |
| attachments.url | `string` | <p>The attachment's S3 pre-signed url.</p> |
| attachments.hash | `string` | <p>The attachment's hash value in</p> |
| version | `number` | <p>The revision's version.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
   {
   "total": 20,
   "results": [
       {
       "evidenceId": "e8176aff-afc1-4936-8935-19d922ca98a6",
       "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
       "targetId": "toolkit-2.1",
       "createdTimestamp": "2021-05-07T08:39:49.304Z",
       "content": {
           "codeCoverage": "80%",
           "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
       },
       "schemaId": "code-coverage-1.0"
       },
       {
       "evidenceId": "14f840ff-65a6-4f5b-a878-427a8f87ba5d",
       "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
       "targetId": "release-2.3",
       "createdTimestamp": "2021-05-07T06:34:41.429Z",
       "content": {
           "codeCoverage": "80%",
           "executionId": "12cd7e84-c6a2-4f93-96fd-6dc9247a0777"
       },
       "schemaId": "code-coverage-1.0"
       },
       "version": 1
   ],
   "nextToken": "Mnwy"
   }
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Get-attachment-download-url'></a> Get attachment download url
[Back to top](#top)

```
GET /evidences/{id}/attachments/{attachmentHash}
```

### Parameters - `Path parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `UUID` | <p>The evidence's id.</p> |
| attachmentHash | `string` | <p>The evidence attachment's hash value.</p> |

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| url | `string` | <p>The pre-signed S3 url to download the attachment</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
{
    "url": "https://sample-bucket.s3.ap-southeast-2.amazonaws.com/attachment.doc"
}
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 404 - Not Found`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-404`

```json
HTTP/1.1 404 Not Found
{
    "error": "The requested resource cannot be found.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Get-evidence-by-id'></a> Get evidence by id
[Back to top](#top)

```
GET /evidences/{id}
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `UUID` | <p>The evidence's id.</p> |

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| evidenceId | `UUID` | <p>The evidence's id.</p> |
| providerId | `UUID` | <p>The issuing evidence authority's id.</p> |
| targetId | `string` | <p>The evidence's target's id.</p> |
| correlationId | `string` | **optional**<p>The evidence's correlation id.</p> |
| createdTimestamp | `string` | <p>The evidence's created timestamp.</p> |
| schemaId | `string` | <p>The evidence's schema's id.</p> |
| content | `Object` | <p>The evidence's content.</p> |
| attachments | `Object[]` | **optional**<p>The evidence's attachments.</p> |
| attachments.objectKey | `string` | <p>The attachment's S3 object key.</p> |
| attachments.attachmentId | `string` | <p>The attachment's id.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
{
       "evidenceId": "e8176aff-afc1-4936-8935-19d922ca98a6",
       "providerId": "my-test-authority",
       "targetId": "my-app-2.1",
       "createdTimestamp": "2021-05-07T08:39:49.304Z",
       "content": {
           "codeCoverage": "80%",
           "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
       },
       "schemaId": "code-coverage-1.0"
   }
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 404 - Not Found`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-404`

```json
HTTP/1.1 404 Not Found
{
    "error": "The requested resource cannot be found.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Get-evidence-verification-status'></a> Get evidence verification status
[Back to top](#top)

```
GET /evidences/{id}/verificationstatus
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `UUID` | <p>The evidence's id.</p> |

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| verificationStatus | `Verified|Unverified` |  |
| evidence | `Object` | **optional**<p>The evidence data.</p> |
| evidence.evidenceId | `UUID` | <p>The evidence's id.</p> |
| evidence.providerId | `UUID` | <p>The issuing evidence provider's id.</p> |
| evidence.targetId | `string` | <p>The evidence's target's id.</p> |
| evidence.correlationId | `string` | **optional**<p>The evidence's correlation id.</p> |
| evidence.createdTimestamp | `string` | <p>The evidence's created timestamp in ISO format.</p> |
| evidence.schemaId | `string` | <p>The evidence's schema's id.</p> |
| evidence.content | `Object` | <p>The evidence's content.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
   {
       "verificationStatus": "Verified",
       "evidence": {
           "evidenceId": "34e8e89a-3e5d-4add-b435-c052081309dc",
           "providerId": "canary-authority",
           "targetId": "canary",
           "createdTimestamp": "2021-06-02T03:02:44.472Z",
           "content": {
               "codeCoverage": "80%",
               "executionId": "ac25a528-7e21-48d1-a8a0-2d3437a04062"
           },
           "schemaId": "canary-test-schema"
       }
   }
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 404 - Not Found`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-404`

```json
HTTP/1.1 404 Not Found
{
    "error": "The requested resource cannot be found.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Query-evidences'></a> Query evidences
[Back to top](#top)

```
POST /evidences/search
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| targetIds | `string[]` | **optional** <p>The list of target ids.</p> |
| providerId | `string` | **optional** <p>The evidence's provider id search term.</p> |
| providerIds | `string[]` | **optional** <p>The list of evidence provider ids.</p> |
| schemaId | `string` | **optional** <p>The evidence's schema id search term.</p> |
| content | `string` | **optional** <p>The content search term.</p> |
| limit | `number` | **optional** <p>The number of evidences per page.</p>_Default value: 10_<br>_Size range: 1-20_<br> |
| nextToken | `string` | **optional** <p>The pagination token.</p> |
| fromTimestamp | `string` | **optional** <p>The start time stamp value in ISO format.</p> |
| toTimestamp | `string` | **optional** <p>The end time stamp value in ISO format.</p> |

### Parameters examples
`json` - Request-Example:

```json
{
    "targetIds": ["my-app-1.0", "toolkit-2.1", "release-2.3"],
    "limit": 2,
    "nextToken": "MTAwfDEwMA"
}
```

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| total | `number` | <p>The total number of matched items.</p> |
| results | `Object[]` | <p>The search result.</p> |
| results.evidenceId | `UUID` | <p>The evidence's id.</p> |
| results.providerId | `UUID` | <p>The issuing evidence provider's id.</p> |
| results.targetId | `string` | <p>The evidence's target's id.</p> |
| results.[correlationId] | `string` | <p>The evidence's correlation id.</p> |
| results.createdTimestamp | `string` | <p>The evidence's created timestamp in ISO format.</p> |
| results.schemaId | `string` | <p>The evidence's schema's id.</p> |
| results.content | `Object` | <p>The evidence's content.</p> |
| attachments | `Object[]` | **optional**<p>The evidence's attachments.</p> |
| attachments.objectKey | `string` | <p>The attachment's S3 object key.</p> |
| attachments.attachmentId | `string` | <p>The attachment's id.</p> |
| nextToken | `string` | **optional**<p>The pagination token.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
   {
   "total": 3076,
   "results": [
       {
       "evidenceId": "e8176aff-afc1-4936-8935-19d922ca98a6",
       "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
       "targetId": "toolkit-2.1",
       "createdTimestamp": "2021-05-07T08:39:49.304Z",
       "content": {
           "codeCoverage": "80%",
           "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
       },
       "schemaId": "code-coverage-1.0"
       },
       {
       "evidenceId": "14f840ff-65a6-4f5b-a878-427a8f87ba5d",
       "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
       "targetId": "release-2.3",
       "createdTimestamp": "2021-05-07T06:34:41.429Z",
       "content": {
           "codeCoverage": "80%",
           "executionId": "12cd7e84-c6a2-4f93-96fd-6dc9247a0777"
       },
       "schemaId": "code-coverage-1.0"
       }
   ],
   "nextToken": "Mnwy"
   }
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

# <a name='Provider'></a> Provider

## <a name='Get-evidence-schema-by-id'></a> Get evidence schema by id
[Back to top](#top)

```
GET /providers/:id/schemas/:schemaId
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `UUID` | <p>The evidence provider's id.</p> |
| schemaId | `string` | <p>The evidence schema's id.</p> |

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| providerId | `UUID` | <p>The attestatiton authority's id.</p> |
| schemaId | `string` | <p>The evidence schema's id.</p> |
| createdTimestamp | `string` | <p>The evidence schema's created timestamp in ISO format.</p> |
| description | `string` | **optional**<p>The evidence schema's description.</p> |
| content | `Object` | <p>The JSON schema content.</p> |

### Success response example

#### Success response example - `Response-Example:`

```json
HTTP/1.1 OK
{
    "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
    "schemaId": "test-coverage-1.0",
    "createdTimestamp": "2021-05-07T08:39:49.304Z",
    "content": {
           "$schema": "https://json-schema.org/draft/2020-12/schema",
           "$id": "https://example.com/product.schema.json",
           "title": "Product",
           "description": "A product in the catalog",
           "type": "object"
    }
}
```

# <a name='Providers'></a> Providers

## <a name='Add-a-new-evidence-schema'></a> Add a new evidence schema
[Back to top](#top)

```
POST /providers/:id/schemas
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `UUID` | <p>The evidence provider's id.</p> |
| providerId | `UUID` | <p>The evidence provider's id.</p> |
| schemaId | `string` | <p>The schema's id.</p> |
| description | `string` | **optional** <p>The schema's description.</p> |
| content | `Object` | <p>the JSON schema.</p> |

### Parameters examples
`json` - Request-Example:

```json
{
    "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
    "schemaId": "test-coverage-1.0",
    "description": "Test coverage schema",
    "content": {
           "$schema": "https://json-schema.org/draft/2020-12/schema",
           "$id": "https://example.com/product.schema.json",
           "title": "Product",
           "description": "A product in the catalog",
           "type": "object"
    }
}
```

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 201 Created
{}
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 404 - Not Found`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-404`

```json
HTTP/1.1 404 Not Found
{
    "error": "The requested resource cannot be found.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Create-new-provider'></a> Create new provider
[Back to top](#top)

```
POST /providers
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| providerId | `string` | **optional** <p>The evidence provider's id.</p>_Size range: ..36_<br> |
| name | `string` | <p>The evidence provider's name.</p>_Size range: ..128_<br> |
| description | `String` | **optional** <p>The evidence provider's description.</p>_Size range: ..128_<br> |
| schemas | `Object[]` | **optional** <p>The evidence provider's schema.</p> |
| schemas.schemaId | `string` | <p>The schema's id.</p>_Size range: ..128_<br> |
| schemas.description | `string` | **optional** <p>The schema's description.</p>_Size range: ..128_<br> |
| schemas.content | `Object` | <p>the JSON schema.</p> |

### Parameters examples
`json` - Request-Example:

```json
{
    "name": "my evidence provider",
    "description": "a new evidence provider"
}
```

### Success response

#### Success response - `Success 201`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| providerId | `string` | <p>The evidence provider's id.</p> |
| name | `string` | <p>The evidence provider's name.</p> |
| createdTimestamp | `string` | <p>The evidence provider's created timestemp in ISO format.</p> |
| description | `string` | **optional**<p>The evidence provider's description.</p> |
| enabled | `boolean` | <p>Flag indicating whether the evidence provider is enabled.</p> |
| apiKey | `string` | <p>The api key assigned to the evidence provider.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 201 Created
{
    "name": "my evidence provider",
    "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
    "createdTimestamp": "2021-05-07T08:39:49.304Z",
    "description": "A new evidence provider",
    "enabled": true,
    "apiKey": "my-new-api-key"
}
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Enable/disable-provider'></a> Enable/disable provider
[Back to top](#top)

```
PUT /providers/:id
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `UUID` | <p>The evidence provider's id.</p> |
| providerId | `UUID` | <p>The evidence provider's id.</p> |
| enabled | `boolean` | <p>The flag indicating whether the evidence provider is enabled.</p> |

### Parameters examples
`json` - Request-Example:

```json
{
    "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
    "enabled": true
}
```

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| providerId | `UUID` | <p>The evidence provider's id.</p> |
| name | `string` | <p>The evidence provider's name.</p> |
| createdTimestamp | `string` | <p>The evidence provider's created timestemp in ISO format.</p> |
| description | `string` | **optional**<p>The evidence provider's description.</p> |
| enabled | `boolean` | <p>Flag indicating whether the attesation authority is enabled.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
{
    "name": "my attetastation authority",
    "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
    "createdTimestamp": "2021-05-07T08:39:49.304Z",
    "description": "A new evidence provider",
    "enabled": true,
}
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 404 - Not Found`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-404`

```json
HTTP/1.1 404 Not Found
{
    "error": "The requested resource cannot be found.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='Get-provider-by-id'></a> Get provider by id
[Back to top](#top)

```
GET /providers/{id}
```

### Parameters - `Parameter`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| id | `string` | <p>The evidence provider's id.</p> |

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| providerId | `string` | <p>The evidence provider's id.</p> |
| name | `string` | <p>The evidence provider's name.</p> |
| createdTimestamp | `string` | <p>The evidence provider's created timestemp in ISO format.</p> |
| description | `string` | **optional**<p>The evidence provider's description.</p> |
| enabled | `boolean` | <p>Flag indicating whether the attesation authority is enabled.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
{
    "name": "my attetastation authority",
    "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
    "createdTimestamp": "2021-05-07T08:39:49.304Z",
    "description": "A new evidence provider",
    "enabled": true,
}
```

### Error response

#### Error response - `Error 400 - Bad Request`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 404 - Not Found`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-400`

```json
HTTP/1.1 400 Bad Request
{
    "error": "The field cannot be null or empty.",
    "retryable": false
}
```

#### Error response example - `Error-Response-404`

```json
HTTP/1.1 404 Not Found
{
    "error": "The requested resource cannot be found.",
    "retryable": false
}
```

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

## <a name='List-providers'></a> List providers
[Back to top](#top)

```
GET /providers
```

### Parameters - `Optional Query Parameters`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| limit | `number` | **optional** <p>The number of authorities per page.</p>_Default value: 50_<br>_Size range: 1-50_<br> |
| nextToken | `string` | **optional** <p>The pagination token.</p> |
| providerId | `string` | **optional** <p>The evidence provider id search query.</p> |
| name | `string` | **optional** <p>The evidence provider name search query.</p> |
| description | `string` | **optional** <p>The evidence provider description search query.</p> |
| schemaId | `string` | **optional** <p>The evidence schema id search query.</p> |

### Success response

#### Success response - `Success 200`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| results | `Object[]` | <p>The list of evidence providers.</p> |
| results.providerId | `string` | <p>The evidence provider's id.</p> |
| results.name | `string` | <p>The evidence provider's name.</p> |
| results.description | `string` | **optional**<p>The evidence provider's description.</p> |
| results.createdTimestamp | `string` | <p>The evidence provider's created timestamp in ISO format.</p> |
| results.enabled | `boolean` | <p>The flag indicating whether the evidence provider is enabled.</p> |
| results.schemas | `Object[]` | **optional**<p>The list of schemas associated with the evidence provider.</p> |
| results.schemas.schemaId | `string` | **optional**<p>The schema's id.</p> |

### Success response example

#### Success response example - `Success-Response:`

```json
HTTP/1.1 200 OK
{
    "results": [
        {
           "providerId": "my-authority",
            "createdTimestamp": "2021-07-15T11:07:56.018Z",
            "enabled": true,
            "name": "my-authority-name",
            "schemas": [
                {
                    "schemaId": "schema-1.0"
                }
            ]
        }
    ]
}
```

### Error response

#### Error response - `Error 500 - Internal Server Error`

| Name     | Type       | Description                           |
|----------|------------|---------------------------------------|
| error | `String` | <p>Error message.</p> |
| retryable | `Boolean` | <p>Flag indicating whether the request can be retried.</p> |

### Error response example

#### Error response example - `Error-Response-500`

```json
HTTP/1.1 500 Internal Server Error
{
    "error": "Connection refused.",
    "retryable": true
}
```

