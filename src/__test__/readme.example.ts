import { S3Event } from 'aws-lambda';
import { lf } from '../function.js';
import { LambdaRequest } from '../request.js';
import { LambdaHttpResponse } from '../http/response.http.js';

export async function main(req: LambdaRequest<S3Event>): Promise<void> {
  console.log('foo', req.id);
}

export const handlerA = lf.handler(main);

// Example B
export const handlerB = lf.handler<S3Event>(async (req) => {
  if (req.event.Records.length === 0) throw new LambdaHttpResponse(400, 'Invalid method');
  for (const evt of req.event.Records) {
    req.log.info({ key: evt.s3.object.key }, 'Request s3');
  }
});

// This works for Cloud front, ALB or API Gateway events
export const handler = lf.http();

handler.router.get('/v1/ping', () => new LambdaHttpResponse(200, 'Ok'));
handler.router.get<{ Params: { style: string } }>(
  '/v1/style/:style.json',
  (req) => new LambdaHttpResponse(200, 'Style: ' + req.params.style),
);

// Handle all requests
handler.router.all('*', () => new LambdaHttpResponse(404, 'Not found'));

function validateApiKey(s?: string | null): boolean {
  return s != null;
}
// create middleware to validate api key on all requests
handler.router.all('*', (req) => {
  const isApiValid = validateApiKey(req.query.get('api'));
  // Bail early
  if (!isApiValid) return new LambdaHttpResponse(400, 'Invalid api key');

  // Continue
  return;
});
