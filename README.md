# Lambda HTTP wrapper @linzjs/lambda
### _A minimal lambda wrapper for LINZ Javascript development_

* Automatically chooses the correct output event format based on input event (API Gateway, ALB or Cloudfront)
* Generates a request id for every request using a [ULID](https://github.com/ulid/spec) (LINZ standard)
* Automatically Logs the correlationId if one is provided to the function.
* Logs a metadata log of context at the end of the request
* Tracks performance and logs a `duration` meta using [@linzjs/metrics](https://www.npmjs.com/package/@linzjs/metrics)

## Why?

This repository wraps the default lambda handler so it can be invoked by ALB, API Gateway or Cloudfront without requiring code changes, 
while also apply the LINZ lambda defaults


```typescript
import {LambdaFunction, LambdaHttpResponse} from '@linzjs/lambda';

export const handler = LambdaFunction.wrap(async (req) => {
    if (req.method !== 'POST') throw new LambdaHttpResponse(400, 'Invalid method');
    return LambdaHttpResponse(200, 'Ok)
});
```

### Request ID generation



### Pino logging

Automatically includes a configured [pino](https://github.com/pinojs/pino) logger

```typescript
function doRequest(req) {
    req.log.info('Some Log line'); // Includes useful information like requestId
}
```

This can be overwridden at either the wrapper
```typescript
export const handler = LambdaFunction.wrap(doRequest, myOwnLogger)
```

of set a differnt default
```typescript
LambdaFunction.logger = myOwnLogger;
export const handler = LambdaFunction.wrap(doRequest, myOwnLogger)
```
