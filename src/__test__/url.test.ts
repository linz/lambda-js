import { Context } from 'aws-lambda';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LambdaUrlRequest } from '../http/request.url.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample, UrlExample } from './examples.js';
import { fakeLog } from './log.js';

describe('FunctionUrl', () => {
  const fakeContext = {} as Context;

  it('should match the event', () => {
    assert.equal(LambdaUrlRequest.is(ApiGatewayExample), false);
    assert.equal(LambdaUrlRequest.is(CloudfrontExample), false);
    assert.equal(LambdaUrlRequest.is(AlbExample), false);
    assert.equal(LambdaUrlRequest.is(UrlExample), true);
  });

  it('should extract headers', () => {
    const req = new LambdaUrlRequest(UrlExample, fakeContext, fakeLog);

    assert.equal(req.header('accept-encoding'), 'br,gzip');
    assert.equal(req.header('Accept-Encoding'), 'br,gzip');
  });

  it('should extract methods', () => {
    const req = new LambdaUrlRequest(UrlExample, fakeContext, fakeLog);
    assert.equal(req.method, 'GET');
  });

  it('should upper case method', () => {
    const newReq = clone(UrlExample);
    newReq.requestContext.http.method = 'post';
    const req = new LambdaUrlRequest(newReq, fakeContext, fakeLog);
    assert.equal(req.method, 'POST');
  });

  it('should extract query parameters', () => {
    const newReq = clone(UrlExample);
    newReq.rawQueryString = 'api=abc123';

    const req = new LambdaUrlRequest(newReq, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('api'), 'abc123');
    assert.deepEqual(req.query.getAll('api'), ['abc123']);
  });

  it('should support utf8 paths and query', () => {
    const req = new LambdaUrlRequest(UrlExample, fakeContext, fakeLog);
    assert.equal(req.path, '/v1/%F0%9F%A6%84/%F0%9F%8C%88/%F0%9F%A6%84.json');
    assert.equal(req.query.get('🦄'), 'abc123');
    assert.equal(req.body, null);
  });

  it('should parse body', () => {
    const newReq = clone(UrlExample);
    newReq.body = JSON.stringify({ key: '🦄' });
    newReq.headers['content-type'] = 'application/json';
    newReq.requestContext.http.method = 'POST';

    const req = new LambdaUrlRequest(newReq, fakeContext, fakeLog);
    assert.equal(req.body, '{"key":"🦄"}');
    assert.deepEqual(req.json(), { key: '🦄' });
  });

  it('should not be case-insensitive query parameters', () => {
    const newReq = clone(UrlExample);
    newReq.rawQueryString = '?FoO=baR';

    const req = new LambdaUrlRequest(newReq, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), null);
    assert.deepEqual(req.query.getAll('foo'), []);

    assert.deepEqual(req.query.get('FoO'), 'baR');
    assert.deepEqual(req.query.getAll('FoO'), ['baR']);
  });
});
