/* eslint-disable @typescript-eslint/no-empty-function */
import { ALBResult, APIGatewayProxyStructuredResultV2, CloudFrontResultResponse, Context } from 'aws-lambda';
import o from 'ospec';
import sinon from 'sinon';
import { lf } from '../function.js';
import { LambdaRequest } from '../request.js';
import { LambdaHttpRequest } from '../request.http.js';
import { LambdaHttpResponse } from '../response.http.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample } from './examples.js';
import { fakeLog } from './log.js';
import { HttpMethods } from '../router.js';

function assertAlbResult(x: unknown): asserts x is ALBResult {}
function assertCloudfrontResult(x: unknown): asserts x is CloudFrontResultResponse {}
function assertsApiGatewayResult(x: unknown): asserts x is APIGatewayProxyStructuredResultV2 {}

o.spec('LambdaWrap', () => {
  const fakeContext = {} as Context;
  const sandbox = sinon.createSandbox();

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

  o('should handle middleware', async () => {
    const fn = lf.http(fakeLog);
    fn.router.all('*', (req): LambdaHttpResponse | void => {
      if (req.path.includes('fail')) return new LambdaHttpResponse(500, 'Failed');
    });
    fn.router.get('/v1/ping', () => new LambdaHttpResponse(200, 'Ok'));

    const newReq = clone(ApiGatewayExample);
    newReq.path = '/v1/ping';
    const ret = await new Promise((resolve) => fn(newReq, fakeContext, (a, b) => resolve(b)));
    assertAlbResult(ret);

    o(ret.statusCode).equals(200);

    newReq.path = '/v1/ping/fail';
    const retB = await new Promise((resolve) => fn(newReq, fakeContext, (a, b) => resolve(b)));
    assertAlbResult(retB);
    o(retB.statusCode).equals(500);
  });

  o('should wrap all http methods', async () => {
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
      ALL: 0,
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
      await new Promise((resolve) => fn(newReq, fakeContext, (a, b) => resolve(b)));
    }

    o(methods).deepEquals(requests);
  });

  o('should log a metalog at the end of the request', async () => {
    const fn = lf.http(fakeLog);
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
    await new Promise((resolve) => fn(AlbExample, fakeContext, (a, b) => resolve(b)));

    o(fakeLog.logs.length).equals(1);

    const firstLog = fakeLog.logs[0];
    o(firstLog['@type']).equals('report');
    o(typeof firstLog['duration'] === 'number').equals(true);
    o(firstLog['status']).equals(200);
    o(firstLog['method']).equals('GET');
    o(firstLog['path']).equals('/v1/tiles/aerial/EPSG:3857/6/3/41.json');
    o(firstLog['id']).equals(requests[0].id);
    o(firstLog['setTest']).equals(requests[0].id);
    o(firstLog['correlationId']).equals(requests[0].correlationId);
  });

  o('should respond to alb events', async () => {
    const fn = lf.http(fakeLog);
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
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
    const fn = lf.http(fakeLog);
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
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
    const fn = lf.http(fakeLog);
    fn.router.get('/v1/tiles/:tileSet/:projection/:z/:x/:y.json', fakeLambda);
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
    const fn = lf.http(fakeLog);
    fn.router.all('*', () => {
      throw new Error('Error');
    });
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));

    assertsApiGatewayResult(ret);
    o(ret.statusCode).equals(500);
  });

  o('should handle exceptions', async () => {
    const fn = lf.handler(() => {
      throw new Error('Fake');
    });
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a) => resolve(a)));
    o(String(ret)).deepEquals('Error: Fake');

    o(fakeLog.logs.length).equals(2);

    const firstLog = fakeLog.logs[1];
    o(firstLog.level).equals('error');
    o(String(firstLog.err)).equals('Error: Fake');
    o(firstLog.status).equals(500);
    o(typeof firstLog.id).equals('string');
    o(firstLog['@type']).equals('report');
    o((firstLog.duration as number) >= 0).equals(true);
  });

  o('should handle exceptions and resolve', async () => {
    const fn = lf.handler(
      () => {
        throw new Error('Fake');
      },
      { rejectOnError: false },
    );
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve({ a, b })));
    o(ret).deepEquals({ a: null, b: JSON.stringify({ status: 500, message: 'Internal Server Error' }) });
  });

  o('should pass body through', async () => {
    const fn = lf.handler(() => {
      return { body: 'fooBar' };
    });
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));
    o(ret).equals('fooBar');

    o(fakeLog.logs.length).equals(2);

    const firstLog = fakeLog.logs[1];
    o(firstLog.err).equals(undefined);
    o(firstLog.status).equals(200);
    o(typeof firstLog.id).equals('string');
    o(firstLog['@type']).equals('report');
    o((firstLog.duration as number) >= 0).equals(true);
  });

  o('should disable "server" header if no server name set', async () => {
    const serverName = lf.ServerName;
    lf.ServerName = null;
    const fn = lf.http();
    fn.router.all('*', fakeLambda);
    const ret = await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));

    lf.ServerName = serverName;
    assertsApiGatewayResult(ret);
    o(ret.headers?.['server']).equals(undefined);
  });

  o('should trace some requests', async () => {
    const logLevels = new Map<string, number>();
    function fakeFn(req: LambdaRequest): void {
      logLevels.set(req.log.level, (logLevels.get(req.log.level) ?? 0) + 1);
    }
    let random = 0;
    sandbox.stub(Math, 'random').callsFake(() => {
      const ret = random;
      random += 0.01;
      return ret;
    });

    const fn = lf.handler(fakeFn, { tracePercent: 0.5 });
    for (let i = 0; i < 100; i++) {
      await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));
    }
    o(logLevels.get('debug')).equals(50);
    o(logLevels.get('trace')).equals(50);
  });

  o('should trace all requests', async () => {
    process.env['TRACE_LAMBDA'] = 'true';
    const logLevels = new Map<string, number>();
    function fakeFn(req: LambdaRequest): void {
      logLevels.set(req.log.level, (logLevels.get(req.log.level) ?? 0) + 1);
    }

    const fn = lf.handler(fakeFn, { tracePercent: 0.1 });
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => fn(ApiGatewayExample, fakeContext, (a, b) => resolve(b)));
    }
    o(logLevels.get('debug')).equals(undefined);
    o(logLevels.get('trace')).equals(10);

    delete process.env['TRACE_LAMBDA'];
  });
});
