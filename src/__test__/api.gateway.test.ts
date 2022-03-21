import { Context } from 'aws-lambda';
import o from 'ospec';
import { LambdaApiGatewayRequest } from '../request.api.gateway.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample } from './examples.js';
import { fakeLog } from './log.js';

o.spec('ApiGateway', () => {
  const fakeContext = {} as Context;
  o('should match the event', () => {
    o(LambdaApiGatewayRequest.is(CloudfrontExample)).equals(false);
    o(LambdaApiGatewayRequest.is(AlbExample)).equals(false);
    o(LambdaApiGatewayRequest.is(ApiGatewayExample)).equals(true);
  });

  o('should extract headers', () => {
    const req = new LambdaApiGatewayRequest(ApiGatewayExample, fakeContext, fakeLog);

    o(req.header('Cache-Control')).equals('max-age=0');
    o(req.header('CaChE-CONTROL')).equals('max-age=0');
  });

  o('should extract methods', () => {
    const req = new LambdaApiGatewayRequest(ApiGatewayExample, fakeContext, fakeLog);
    o(req.method).equals('GET');
  });

  o('should upper case method', () => {
    const newReq = clone(ApiGatewayExample);
    newReq.httpMethod = 'post';
    const req = new LambdaApiGatewayRequest(newReq, fakeContext, fakeLog);
    o(req.method).equals('POST');
  });

  o('should extract query parameters', () => {
    const req = new LambdaApiGatewayRequest(ApiGatewayExample, fakeContext, fakeLog);
    o(req.query.get('foo')).deepEquals('bar');
    o(req.query.getAll('foo')).deepEquals(['bar']);
  });

  o('should be case-insensitive query parameters', () => {
    const obj = clone(ApiGatewayExample);
    delete obj.multiValueQueryStringParameters!['foo'];
    obj.multiValueQueryStringParameters!['FoO'] = ['bar'];

    const req = new LambdaApiGatewayRequest(ApiGatewayExample, fakeContext, fakeLog);
    o(req.query.get('foo')).deepEquals('bar');
    o(req.query.getAll('foo')).deepEquals(['bar']);
  });

  o('should extract all query parameters', () => {
    const newReq = clone(ApiGatewayExample);
    newReq.multiValueQueryStringParameters!.foo = ['foo', 'bar'];
    const req = new LambdaApiGatewayRequest(newReq, fakeContext, fakeLog);
    o(req.query.get('foo')).deepEquals('foo');
    o(req.query.getAll('foo')).deepEquals(['foo', 'bar']);
  });
});
