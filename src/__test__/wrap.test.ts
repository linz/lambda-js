/* eslint-disable @typescript-eslint/no-empty-function */
import { ALBResult, APIGatewayProxyStructuredResultV2, CloudFrontResultResponse, Context } from 'aws-lambda';
import o from 'ospec';
import { lf } from '../function';
import { LambdaHttpRequest } from '../request.http';
import { LambdaHttpResponse } from '../response.http';
import { AlbExample, ApiGatewayExample, CloudfrontExample } from './examples';
import { fakeLog } from './log';

function assertAlbResult(x: unknown): asserts x is ALBResult {}
function assertCloudfrontResult(x: unknown): asserts x is CloudFrontResultResponse {}
function assertsApiGatewayResult(x: unknown): asserts x is APIGatewayProxyStructuredResultV2 {}

o.spec('LambdaWrap', () => {
  const fakeContext = {} as Context;

  const requests: LambdaHttpRequest[] = [];
  async function fakeLambda(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    requests.push(req);
    req.set('setTest', req.id);
    return new LambdaHttpResponse(200, 'ok');
  }
  o.beforeEach(() => {
    lf.Logger = fakeLog;
    requests.length = 0;
    fakeLog.logs = [];
  });

  o('should log a metalog at the end of the request', async () => {
    const fn = lf.http(fakeLambda, fakeLog);
    await new Promise((resolve) => fn(AlbExample, fakeContext, (a, b) => resolve(b)));

    o(fakeLog.logs.length).equals(1);

    const firstLog = fakeLog.logs[0];
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
    const fn = lf.http(fakeLambda, fakeLog);
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
    const fn = lf.http(fakeLambda);
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
    const fn = lf.http(fakeLambda);
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

  o('should handle http exceptions', async () => {
    const fn = lf.http(() => {
      throw new Error('Fake');
    });
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));

    assertsApiGatewayResult(ret);
    o(ret.statusCode).equals(500);
  });

  o('should handle exceptions', async () => {
    const fn = lf.handler(() => {
      throw new Error('Fake');
    });
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));
    o(ret).equals(JSON.stringify({ status: 500, message: 'Internal Server Error' }));

    o(fakeLog.logs.length).equals(1);

    const firstLog = fakeLog.logs[0];
    o(String(firstLog.err)).equals('Error: Fake');
    o(firstLog.status).equals(500);
    o(typeof firstLog.id).equals('string');
    o(firstLog['@type']).equals('report');
    o((firstLog.duration as number) >= 0).equals(true);
  });

  o('should pass body through', async () => {
    const fn = lf.handler(() => {
      return { body: 'fooBar' };
    });
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));
    o(ret).equals('fooBar');

    o(fakeLog.logs.length).equals(1);

    const firstLog = fakeLog.logs[0];
    o(firstLog.err).equals(undefined);
    o(firstLog.status).equals(200);
    o(typeof firstLog.id).equals('string');
    o(firstLog['@type']).equals('report');
    o((firstLog.duration as number) >= 0).equals(true);
  });

  o('should disable "server" header if no server name set', async () => {
    const serverName = lf.ServerName;
    lf.ServerName = null;
    const fn = lf.http(fakeLambda);
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));

    lf.ServerName = serverName;
    assertsApiGatewayResult(ret);
    o(ret.headers?.['server']).equals(undefined);
  });
});
