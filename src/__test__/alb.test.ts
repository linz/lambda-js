import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Context } from 'aws-lambda';

import { LambdaAlbRequest } from '../http/request.alb.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample, UrlExample } from './examples.js';
import { fakeLog } from './log.js';

describe('AlbGateway', () => {
  const fakeContext = {} as Context;

  it('should match the event', () => {
    assert.equal(LambdaAlbRequest.is(ApiGatewayExample), false);
    assert.equal(LambdaAlbRequest.is(CloudfrontExample), false);
    assert.equal(LambdaAlbRequest.is(AlbExample), true);
    assert.equal(LambdaAlbRequest.is(UrlExample), false);
  });

  it('should extract headers', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeContext, fakeLog);

    assert.equal(req.header('accept-encoding'), 'gzip');
    assert.equal(req.header('Accept-Encoding'), 'gzip');
  });

  it('should extract methods', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeContext, fakeLog);
    assert.equal(req.method, 'GET');
  });

  it('should upper case method', () => {
    const newReq = clone(AlbExample);
    newReq.httpMethod = 'post';
    const req = new LambdaAlbRequest(newReq, fakeContext, fakeLog);
    assert.equal(req.method, 'POST');
  });

  it('should extract query parameters', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('api'), 'abc123');
    assert.deepEqual(req.query.getAll('api'), ['abc123']);
  });

  it('should not be case-insensitive query parameters', () => {
    const newReq = clone(AlbExample);
    delete newReq.queryStringParameters!['foo'];
    newReq.queryStringParameters!['FoO'] = 'baR';

    const req = new LambdaAlbRequest(newReq, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), null);
    assert.deepEqual(req.query.getAll('foo'), []);

    assert.deepEqual(req.query.get('FoO'), 'baR');
    assert.deepEqual(req.query.getAll('FoO'), ['baR']);
  });

  // ALB events don't seem to handle multiple query parameters
  //   o('should extract all query parameters', () => {
  //     const newReq = clone(ApiGatewayExample);
  //     newReq.multiValueQueryStringParameters!.foo = ['foo', 'bar'];
  //     const req = new LambdaApiRequest(newReq, fakeLog);
  //     o(req.query.get('foo')).deepEquals('foo');
  //     o(req.query.getAll('foo')).deepEquals(['foo', 'bar']);
  //   });
});
