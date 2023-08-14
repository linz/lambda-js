import { Context } from 'aws-lambda';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LambdaApiGatewayRequest } from '../http/request.api.gateway.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample, UrlExample } from './examples.js';
import { fakeLog } from './log.js';

describe('ApiGateway', () => {
  const fakeContext = {} as Context;

  it('should match the event', () => {
    assert.equal(LambdaApiGatewayRequest.is(CloudfrontExample), false);
    assert.equal(LambdaApiGatewayRequest.is(AlbExample), false);
    assert.equal(LambdaApiGatewayRequest.is(ApiGatewayExample), true);
    assert.equal(LambdaApiGatewayRequest.is(UrlExample), false);
  });

  it('should extract headers', () => {
    const req = new LambdaApiGatewayRequest(ApiGatewayExample, fakeContext, fakeLog);

    assert.equal(req.header('Cache-Control'), 'max-age=0');
    assert.equal(req.header('CaChE-CONTROL'), 'max-age=0');
  });

  it('should extract methods', () => {
    const req = new LambdaApiGatewayRequest(ApiGatewayExample, fakeContext, fakeLog);
    assert.equal(req.method, 'GET');
  });

  it('should upper case method', () => {
    const newReq = clone(ApiGatewayExample);
    newReq.httpMethod = 'post';
    const req = new LambdaApiGatewayRequest(newReq, fakeContext, fakeLog);
    assert.equal(req.method, 'POST');
  });

  it('should extract query parameters', () => {
    const req = new LambdaApiGatewayRequest(ApiGatewayExample, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), 'bar');
    assert.deepEqual(req.query.getAll('foo'), ['bar']);
  });

  it('should be case-insensitive query parameters', () => {
    const obj = clone(ApiGatewayExample);
    delete obj.multiValueQueryStringParameters!['foo'];
    obj.multiValueQueryStringParameters!['FoO'] = ['bar'];

    const req = new LambdaApiGatewayRequest(ApiGatewayExample, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), 'bar');
    assert.deepEqual(req.query.getAll('foo'), ['bar']);
  });

  it('should extract all query parameters', () => {
    const newReq = clone(ApiGatewayExample);
    newReq.multiValueQueryStringParameters!['foo'] = ['foo', 'bar'];
    const req = new LambdaApiGatewayRequest(newReq, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), 'foo');
    assert.deepEqual(req.query.getAll('foo'), ['foo', 'bar']);
  });

  it('should not be case-insensitive query parameters', () => {
    const newReq = clone(ApiGatewayExample);
    delete newReq.queryStringParameters!['foo'];
    delete newReq.multiValueQueryStringParameters!['foo'];

    newReq.queryStringParameters!['FoO'] = 'baR';
    newReq.multiValueQueryStringParameters!['FoO'] = ['baR'];

    const req = new LambdaApiGatewayRequest(newReq, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), null);
    assert.deepEqual(req.query.getAll('foo'), []);

    assert.deepEqual(req.query.get('FoO'), 'baR');
    assert.deepEqual(req.query.getAll('FoO'), ['baR']);
  });
});
