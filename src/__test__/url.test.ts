import { Context } from 'aws-lambda';
import o from 'ospec';
import { LambdaUrlRequest } from '../http/request.url.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample, UrlExample } from './examples.js';
import { fakeLog } from './log.js';

o.spec('FunctionUrl', () => {
  const fakeContext = {} as Context;

  o('should match the event', () => {
    o(LambdaUrlRequest.is(ApiGatewayExample)).equals(false);
    o(LambdaUrlRequest.is(CloudfrontExample)).equals(false);
    o(LambdaUrlRequest.is(AlbExample)).equals(false);
    o(LambdaUrlRequest.is(UrlExample)).equals(true);
  });

  o('should extract headers', () => {
    const req = new LambdaUrlRequest(UrlExample, fakeContext, fakeLog);

    o(req.header('accept-encoding')).equals('br,gzip');
    o(req.header('Accept-Encoding')).equals('br,gzip');
  });

  o('should extract methods', () => {
    const req = new LambdaUrlRequest(UrlExample, fakeContext, fakeLog);
    o(req.method).equals('GET');
  });

  o('should upper case method', () => {
    const newReq = clone(UrlExample);
    newReq.requestContext.http.method = 'post';
    const req = new LambdaUrlRequest(newReq, fakeContext, fakeLog);
    o(req.method).equals('POST');
  });

  o('should extract query parameters', () => {
    const newReq = clone(UrlExample);
    newReq.rawQueryString = 'api=abc123';

    const req = new LambdaUrlRequest(newReq, fakeContext, fakeLog);
    o(req.query.get('api')).deepEquals('abc123');
    o(req.query.getAll('api')).deepEquals(['abc123']);
  });

  o('should support utf8 paths and query', () => {
    const req = new LambdaUrlRequest(UrlExample, fakeContext, fakeLog);
    o(req.path).equals('/v1/%F0%9F%A6%84/%F0%9F%8C%88/%F0%9F%A6%84.json');
    o(req.query.get('🦄')).equals('abc123');
    o(req.body).equals(null);
  });

  o('should parse body', () => {
    const newReq = clone(UrlExample);
    newReq.body = JSON.stringify({ key: '🦄' });
    newReq.headers['content-type'] = 'application/json';
    newReq.requestContext.http.method = 'POST';

    const req = new LambdaUrlRequest(newReq, fakeContext, fakeLog);
    o(req.body).equals('{"key":"🦄"}');
    o(req.json()).deepEquals({ key: '🦄' });
  });

  o('should not be case-insensitive query parameters', () => {
    const newReq = clone(UrlExample);
    newReq.rawQueryString = '?FoO=baR';

    const req = new LambdaUrlRequest(newReq, fakeContext, fakeLog);
    o(req.query.get('foo')).deepEquals(null);
    o(req.query.getAll('foo')).deepEquals([]);

    o(req.query.get('FoO')).deepEquals('baR');
    o(req.query.getAll('FoO')).deepEquals(['baR']);
  });
});
