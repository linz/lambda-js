/* eslint-disable @typescript-eslint/no-empty-function */
import {
  ALBResult,
  APIGatewayProxyStructuredResultV2,
  CloudFrontResultResponse,
  Context,
  KinesisStreamBatchResponse,
  KinesisStreamEvent,
} from 'aws-lambda';
import { describe, beforeEach, it } from 'node:test';
import assert from 'node:assert';
import { lf } from '../function.js';
import { LambdaRequest } from '../request.js';
import { LambdaHttpRequest } from '../http/request.http.js';
import { LambdaHttpResponse } from '../http/response.http.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample, UrlExample } from './examples.js';
import { fakeLog } from './log.js';
import { HttpMethods } from '../http/router.js';
import { UrlResult } from '../http/request.url.js';

function assertAlbResult(_x: unknown): asserts _x is ALBResult {}
function assertCloudfrontResult(_x: unknown): asserts _x is CloudFrontResultResponse {}
function assertsApiGatewayResult(_x: unknown): asserts _x is APIGatewayProxyStructuredResultV2 {}
function assertsUrlResult(_x: unknown): asserts _x is UrlResult {}

describe('LambdaWrap', () => {
  const fakeContext = {} as Context;

  const requests: LambdaHttpRequest[] = [];
  async function fakeLambda(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    requests.push(req);
    req.set('setTest', req.id);
    return new LambdaHttpResponse(200, 'ok');
  }
  beforeEach(() => {
    lf.Logger = fakeLog;
    requests.length = 0;
    fakeLog.logs = [];
  });

  it('should handle middleware', async () => {
    const fn = lf.http(fakeLog);
    fn.router.hook('request', (req): LambdaHttpResponse | void => {
      if (req.path.includes('fail')) return new LambdaHttpResponse(500, 'Failed');
    });
    fn.router.get('/v1/ping/:message', () => new LambdaHttpResponse(200, 'Ok'));

    const newReq = clone(ApiGatewayExample);
    newReq.path = '/v1/ping/ok';
    const ret = await fn(newReq, fakeContext);
    assertAlbResult(ret);

    assert.equal(ret.statusCode, 200);

    newReq.path = '/v1/ping/fail';
    const retB = await fn(newReq, fakeContext);
    assertAlbResult(retB);
    assert.equal(retB.statusCode, 500);
  });

  it('should wrap all http methods', async () => {
    const fn = lf.http(fakeLog);
    const methods: string[] = [];

    function bind(r: string) {
      return (): LambdaHttpResponse => {
        methods.push(r.toUpperCase());
        return new LambdaHttpResponse(200, 'Ok');
      };
    }
    fn.router.get('*', bind('get'));
    fn.router.delete('*', bind('delete'));
    fn.router.head('*', bind('head'));
    fn.router.options('*', bind('options'));
    fn.router.post('*', bind('post'));
    fn.router.patch('*', bind('patch'));
    fn.router.put('*', bind('put'));

    const headers: Record<HttpMethods, number> = {
      DELETE: 1,
      GET: 1,
      OPTIONS: 1,
      HEAD: 1,
      POST: 1,
      PATCH: 1,
      PUT: 1,
    };

    const requests = Object.entries(headers)
      .filter((f) => f[1] === 1)
      .map((f) => f[0]);

    for (const req of requests) {
      const newReq = clone(ApiGatewayExample);
      newReq.httpMethod = req;
      await fn(newReq, fakeContext);
    }

    assert.deepEqual(methods, requests);
  });

  it('should log a metalog at the end of the request', async () => {
    const fn = lf.http(fakeLog);
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
    await fn(AlbExample, fakeContext);
    assert.equal(fakeLog.logs.length, 1);

    const firstLog = fakeLog.logs[0];
    assert.ok(firstLog)
    assert.ok(requests[0])
    assert.equal(firstLog['@type'], 'report');
    assert.equal(typeof firstLog['duration'] === 'number', true);
    assert.equal(firstLog['status'], 200);
    assert.equal(firstLog['method'], 'GET');
    assert.equal(firstLog['path'], '/v1/tiles/aerial/EPSG:3857/6/3/41.json');
    assert.equal(firstLog['id'], requests[0].id);
    assert.equal(firstLog['setTest'], requests[0].id);
    assert.equal(firstLog['correlationId'], requests[0].correlationId);
  });

  it('should respond to alb events', async () => {
    const fn = lf.http(fakeLog);
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
    const ret = await fn(AlbExample, fakeContext);

    assertAlbResult(ret);
    assert.ok(requests[0])
    assert.equal(ret.statusCode, 200);
    assert.equal(ret.headers?.['content-type'], 'application/json');
    assert.equal(ret.headers?.['x-linz-request-id'], requests[0].id);
    assert.equal(ret.headers?.['x-linz-correlation-id'], requests[0].correlationId);
    assert.equal(ret.isBase64Encoded, false);

    const body = JSON.parse(ret.body ?? '');
    assert.equal(body.message, 'ok');
    assert.equal(body.status, 200);
    assert.equal(body.id, requests[0].id);
  });

  it('should respond to cloudfront events', async () => {
    const fn = lf.http(fakeLog);
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
    const ret = await fn(CloudfrontExample, fakeContext);

    assertCloudfrontResult(ret);
    assert.equal(ret.status, '200');
    assert.equal(ret.statusDescription, 'ok');
    assert.deepEqual(ret.headers?.['content-type'], [{ key: 'content-type', value: 'application/json' }]);

    const body = JSON.parse(ret.body ?? '');
    assert.equal(body.message, 'ok');
    assert.equal(body.status, 200);
    assert.equal(body.id, requests[0]?.id);
  });

  it('should respond to api gateway events', async () => {
    const fn = lf.http(fakeLog);
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
    const ret = await fn(ApiGatewayExample, fakeContext);

    assertsApiGatewayResult(ret);
    assert.equal(ret.statusCode, 200);
    assert.equal(ret.isBase64Encoded, false);
    assert.deepEqual(ret.headers?.['content-type'], 'application/json');

    const body = JSON.parse(ret.body ?? '');
    assert.equal(body.message, 'ok');
    assert.equal(body.status, 200);
    assert.equal(body.id, requests[0]?.id);
  });

  it('should respond to function url events', async () => {
    const fn = lf.http(fakeLog);
    const req = clone(UrlExample);
    req.rawPath = '/v1/tiles/aerial/EPSG:3857/6/3/41.json';
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
    const ret = await fn(req, fakeContext);

    assertsUrlResult(ret);
    assert.equal(ret.statusCode, 200);
    assert.equal(ret.isBase64Encoded, false);
    assert.deepEqual(ret.headers?.['content-type'], 'application/json');

    const body = JSON.parse(ret.body ?? '');
    assert.equal(body.message, 'ok');
    assert.equal(body.status, 200);
    assert.equal(body.id, requests[0]?.id);
  });

  it('should handle thrown http responses', async () => {
    const fn = lf.http(fakeLog);
    fn.router.get('*', () => {
      throw new LambdaHttpResponse(400, 'Error');
    });
    const ret = await fn(ApiGatewayExample, fakeContext);

    assertsUrlResult(ret);
    assert.equal(ret.statusCode, 400);
  });

  it('should handle http exceptions', async () => {
    const fn = lf.http(fakeLog);
    fn.router.get('*', () => {
      throw new Error('Error');
    });
    const ret = await fn(ApiGatewayExample, fakeContext);

    assertsApiGatewayResult(ret);
    assert.equal(ret.statusCode, 500);
  });

  it('should handle exceptions', async () => {
    const fn = lf.handler(() => {
      throw new Error('Fake');
    });
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a) => resolve(a)));
    assert.deepEqual(String(ret), 'Error: Fake');

    assert.equal(fakeLog.logs.length, 2);

    const firstLog = fakeLog.logs[1];
    assert.ok(firstLog)
    assert.equal(firstLog['level'], 'error');
    assert.equal(String(firstLog['err']), 'Error: Fake');
    assert.equal(firstLog['status'], 500);
    assert.equal(typeof firstLog['id'], 'string');
    assert.equal(firstLog['@type'], 'report');
    assert.equal((firstLog['duration'] as number) >= 0, true);
  });

  it('should handle exceptions and resolve', async () => {
    let requestId = 'shouldHaveAValue';
    const fn = lf.handler(
      (req) => {
        requestId = req.id;
        throw new Error('Fake');
      },
      { rejectOnError: false },
    );
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve({ a, b })));
    assert.deepEqual(ret, {
      a: null,
      b: JSON.stringify({ id: requestId, status: 500, message: 'Internal Server Error' }),
    });
  });

  it('should pass body through', async () => {
    const fn = lf.handler(() => {
      return 'fooBar';
    });
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (_err, b) => resolve(b)));
    assert.equal(ret, 'fooBar');

    assert.equal(fakeLog.logs.length, 2);

    const firstLog = fakeLog.logs[1];
    assert.ok(firstLog);
    assert.equal(firstLog['err'], undefined);
    assert.equal(firstLog['status'], 200);
    assert.equal(typeof firstLog['id'], 'string');
    assert.equal(firstLog['@type'], 'report');
    assert.equal((firstLog['duration'] as number) >= 0, true);
  });

  it('should disable "server" header if no server name set', async () => {
    const serverName = lf.ServerName;
    lf.ServerName = null;
    const fn = lf.http();
    fn.router.get('*', fakeLambda);
    const ret = await fn(ApiGatewayExample, fakeContext);

    lf.ServerName = serverName;
    assertsApiGatewayResult(ret);
    assert.equal(ret.headers?.['server'], undefined);
  });

  it('should trace some requests', async (t) => {
    const logLevels = new Map<string, number>();
    function fakeFn(req: LambdaRequest): void {
      logLevels.set(req.log.level, (logLevels.get(req.log.level) ?? 0) + 1);
    }
    let random = 0;
    t.mock.method(Math, 'random', () => {
      const ret = random;
      random += 0.01;
      return ret;
    });

    const fn = lf.handler(fakeFn, { tracePercent: 0.5 });
    for (let i = 0; i < 100; i++) {
      await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (_err, b) => resolve(b)));
    }
    assert.equal(logLevels.get('debug'), 50);
    assert.equal(logLevels.get('trace'), 50);
  });

  it('should trace all requests', async () => {
    process.env['TRACE_LAMBDA'] = 'true';
    const logLevels = new Map<string, number>();
    function fakeFn(req: LambdaRequest): void {
      logLevels.set(req.log.level, (logLevels.get(req.log.level) ?? 0) + 1);
    }

    const fn = lf.handler(fakeFn, { tracePercent: 0.1 });
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (_err, b) => resolve(b)));
    }
    assert.equal(logLevels.get('debug'), undefined);
    assert.equal(logLevels.get('trace'), 10);

    delete process.env['TRACE_LAMBDA'];
  });

  it('should allow straight responses', async () => {
    function fakeFn(req: LambdaRequest<KinesisStreamEvent>): KinesisStreamBatchResponse | void {
      if (req.event.Records.length === 0) return;

      return {
        batchItemFailures: req.event.Records.map((f) => {
          return { itemIdentifier: f.kinesis.sequenceNumber };
        }),
      };
    }

    const fn = lf.handler<KinesisStreamEvent, KinesisStreamBatchResponse | void>(fakeFn);

    const emptyResponse = await new Promise((resolve) => fn({ Records: [] }, fakeContext, (_err, b) => resolve(b)));
    assert.deepEqual(emptyResponse, undefined);

    const actualResponse = await new Promise((resolve) =>
      fn({ Records: [{ kinesis: { sequenceNumber: '123' } }] } as KinesisStreamEvent, fakeContext, (_err, b) =>
        resolve(b),
      ),
    );
    assert.deepEqual(actualResponse, { batchItemFailures: [{ itemIdentifier: '123' }] });
  });
});
