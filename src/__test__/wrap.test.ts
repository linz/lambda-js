/* eslint-disable @typescript-eslint/no-empty-function */
import { ALBResult, APIGatewayProxyStructuredResultV2, CloudFrontResultResponse, Context } from 'aws-lambda';
import o from 'ospec';
import { LambdaFunction } from '../function';
import { LambdaHttpRequest } from '../request';
import { LambdaHttpResponse } from '../response';
import { AlbExample, ApiGatewayExample, CloudfrontExample } from './examples';
import { FakeLog, fakeLog } from './log';

function assertAlbResult(x: unknown): asserts x is ALBResult {}
function assertCloudfrontResult(x: unknown): asserts x is CloudFrontResultResponse {}
function assertsApiGatewayResult(x: unknown): asserts x is APIGatewayProxyStructuredResultV2 {}

o.spec('LambdaWrap', () => {
  const fakeContext = {} as any as Context;

  const requests: LambdaHttpRequest[] = [];
  async function fakeLambda(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    requests.push(req);
    req.set('setTest', req.id);
    return new LambdaHttpResponse(200, 'ok');
  }
  o.beforeEach(() => {
    requests.length = 0;
  });

  o('should log a metalog at the end of the request', async () => {
    const log = new FakeLog();
    const fn = LambdaFunction.wrap(fakeLambda, log);
    await new Promise((resolve) => fn(AlbExample, fakeContext, (a, b) => resolve(b)));

    o(log.logs.length).equals(1);

    const firstLog = log.logs[0];
    o(firstLog['@type']).equals('report');
    o(typeof firstLog['duration'] === 'number').equals(true);
    o(firstLog['status']).equals(200);
    o(firstLog['method']).equals('POST');
    o(firstLog['path']).equals('/v1/tiles/aerial/EPSG:3857/6/3/41.json');
    o(firstLog['id']).equals(requests[0].id);
    o(firstLog['setTest']).equals(requests[0].id);
    o(firstLog['correlationId']).equals(requests[0].correlationId);
  });

  o('should respond to alb events', async () => {
    const fn = LambdaFunction.wrap(fakeLambda, fakeLog);
    const ret = await new Promise((resolve) => fn(AlbExample, fakeContext, (a, b) => resolve(b)));

    assertAlbResult(ret);
    o(ret.statusCode).equals(200);
    o(ret.headers?.['content-type']).equals('application/json');
    o(ret.headers?.['x-linz-request-id']).equals(requests[0].id);
    o(ret.headers?.['x-linz-correlation-id']).equals(requests[0].correlationId);
    o(ret.isBase64Encoded).equals(false);

    const body = JSON.parse(ret.body ?? '');
    o(body.message).equals('ok');
    o(body.status).equals(200);
    o(body.id).equals(requests[0].id);
  });

  o('should respond to cloudfront events', async () => {
    const fn = LambdaFunction.wrap(fakeLambda, fakeLog);
    const ret = await new Promise((resolve) => fn(CloudfrontExample, fakeContext, (a, b) => resolve(b)));

    assertCloudfrontResult(ret);
    o(ret.status).equals('200');
    o(ret.statusDescription).equals('ok');
    o(ret.headers?.['content-type']).deepEquals([{ key: 'content-type', value: 'application/json' }]);

    const body = JSON.parse(ret.body ?? '');
    o(body.message).equals('ok');
    o(body.status).equals(200);
    o(body.id).equals(requests[0].id);
  });

  o('should respond to api gateway events', async () => {
    const fn = LambdaFunction.wrap(fakeLambda, fakeLog);
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));

    assertsApiGatewayResult(ret);
    o(ret.statusCode).equals(200);
    o(ret.isBase64Encoded).equals(false);
    o(ret.headers?.['content-type']).deepEquals('application/json');

    const body = JSON.parse(ret.body ?? '');
    o(body.message).equals('ok');
    o(body.status).equals(200);
    o(body.id).equals(requests[0].id);
  });

  o('should handle exceptions', async () => {
    const fn = LambdaFunction.wrap(() => {
      throw new Error('Fake');
    }, fakeLog);
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));

    assertsApiGatewayResult(ret);
    o(ret.statusCode).equals(500);
  });

  o('should disable "server" header if no server name set', async () => {
    const serverName = LambdaFunction.ServerName;
    LambdaFunction.ServerName = null;
    const fn = LambdaFunction.wrap(fakeLambda, fakeLog);
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));

    LambdaFunction.ServerName = serverName;
    assertsApiGatewayResult(ret);
    o(ret.headers?.['server']).equals(undefined);
  });
});
