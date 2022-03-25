import { CloudFrontRequestEvent, Context } from 'aws-lambda';
import o from 'ospec';
import { LambdaCloudFrontRequest } from '../http/request.cloudfront.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample } from './examples.js';
import { fakeLog } from './log.js';

o.spec('CloudFront', () => {
  const fakeContext = {} as Context;
  o('should match the event', () => {
    o(LambdaCloudFrontRequest.is(CloudfrontExample)).equals(true);
    o(LambdaCloudFrontRequest.is(AlbExample)).equals(false);
    o(LambdaCloudFrontRequest.is(ApiGatewayExample)).equals(false);
  });

  o('should extract headers', () => {
    const req = new LambdaCloudFrontRequest(CloudfrontExample, fakeContext, fakeLog);

    o(req.header('Host')).equals('d123.cf.net');
    o(req.header('hOST')).equals('d123.cf.net');
  });

  o('should extract methods', () => {
    const req = new LambdaCloudFrontRequest(CloudfrontExample, fakeContext, fakeLog);
    o(req.method).equals('GET');
  });

  o('should upper case method', () => {
    const newReq = clone(CloudfrontExample) as CloudFrontRequestEvent;
    const cfReq = newReq.Records[0].cf.request as unknown as Record<string, unknown>;
    cfReq['method'] = 'post';
    const req = new LambdaCloudFrontRequest(newReq, fakeContext, fakeLog);
    o(req.method).equals('POST');
  });

  o('should extract query parameters', () => {
    const req = new LambdaCloudFrontRequest(CloudfrontExample, fakeContext, fakeLog);
    o(req.query.get('foo')).deepEquals('bar');
    o(req.query.getAll('foo')).deepEquals(['bar']);
  });

  o('should be case-insensitive query parameters', () => {
    const newReq = clone(CloudfrontExample);
    newReq.Records[0].cf.request.querystring = `?FoO=bar`;
    const req = new LambdaCloudFrontRequest(newReq, fakeContext, fakeLog);
    o(req.query.get('foo')).deepEquals('bar');
    o(req.query.getAll('foo')).deepEquals(['bar']);
  });

  o('should extract all query parameters', () => {
    const newReq = clone(CloudfrontExample);
    newReq.Records[0].cf.request.querystring = `?foo=foo&foo=bar`;
    const req = new LambdaCloudFrontRequest(newReq, fakeContext, fakeLog);
    o(req.query.get('foo')).deepEquals('foo');
    o(req.query.getAll('foo')).deepEquals(['foo', 'bar']);
  });
});
