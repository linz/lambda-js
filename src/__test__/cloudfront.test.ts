import { CloudFrontRequestEvent, Context } from 'aws-lambda';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LambdaCloudFrontRequest } from '../http/request.cloudfront.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample, UrlExample } from './examples.js';
import { fakeLog } from './log.js';

describe('CloudFront', () => {
  const fakeContext = {} as Context;

  it('should match the event', () => {
    assert.equal(LambdaCloudFrontRequest.is(CloudfrontExample), true);
    assert.equal(LambdaCloudFrontRequest.is(AlbExample), false);
    assert.equal(LambdaCloudFrontRequest.is(ApiGatewayExample), false);
    assert.equal(LambdaCloudFrontRequest.is(UrlExample), false);
  });

  it('should extract headers', () => {
    const req = new LambdaCloudFrontRequest(CloudfrontExample, fakeContext, fakeLog);

    assert.equal(req.header('Host'), 'd123.cf.net');
    assert.equal(req.header('hOST'), 'd123.cf.net');
  });

  it('should extract methods', () => {
    const req = new LambdaCloudFrontRequest(CloudfrontExample, fakeContext, fakeLog);
    assert.equal(req.method, 'GET');
  });

  it('should upper case method', () => {
    const newReq = clone(CloudfrontExample) as CloudFrontRequestEvent;
    const cfReq = newReq.Records[0].cf.request as unknown as Record<string, unknown>;
    cfReq['method'] = 'post';
    const req = new LambdaCloudFrontRequest(newReq, fakeContext, fakeLog);
    assert.equal(req.method, 'POST');
  });

  it('should extract query parameters', () => {
    const req = new LambdaCloudFrontRequest(CloudfrontExample, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), 'bar');
    assert.deepEqual(req.query.getAll('foo'), ['bar']);
  });

  it('should not be case-insensitive query parameters', () => {
    const newReq = clone(CloudfrontExample);
    newReq.Records[0].cf.request.querystring = `?FoO=baR`;
    const req = new LambdaCloudFrontRequest(newReq, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), null);
    assert.deepEqual(req.query.getAll('foo'), []);
    assert.deepEqual(req.query.get('FoO'), 'baR');
    assert.deepEqual(req.query.getAll('FoO'), ['baR']);
  });

  it('should extract all query parameters', () => {
    const newReq = clone(CloudfrontExample);
    newReq.Records[0].cf.request.querystring = `?foo=foo&foo=bar`;
    const req = new LambdaCloudFrontRequest(newReq, fakeContext, fakeLog);
    assert.deepEqual(req.query.get('foo'), 'foo');
    assert.deepEqual(req.query.getAll('foo'), ['foo', 'bar']);
  });
});
