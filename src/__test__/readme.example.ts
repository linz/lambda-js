import { S3Event } from 'aws-lambda';
import { lf } from '../function';
import { LambdaRequest } from '../request';
import { LambdaHttpResponse } from '../response.http';

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
export const handlerC = lf.http(async (req) => {
  if (req.method !== 'POST') throw new LambdaHttpResponse(400, 'Invalid method');
  return new LambdaHttpResponse(200, 'Ok');
});
