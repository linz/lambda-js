import { Context } from 'aws-lambda';
import o from 'ospec';
import { LambdaAlbRequest } from '../http/request.alb.js';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample, UrlExample } from './examples.js';
import { fakeLog } from './log.js';

o.spec('AlbGateway', () => {
  const fakeContext = {} as Context;

  o('should match the event', () => {
    o(LambdaAlbRequest.is(ApiGatewayExample)).equals(false);
    o(LambdaAlbRequest.is(CloudfrontExample)).equals(false);
    o(LambdaAlbRequest.is(AlbExample)).equals(true);
    o(LambdaAlbRequest.is(UrlExample)).equals(false);
  });

  o('should extract headers', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeContext, fakeLog);

    o(req.header('accept-encoding')).equals('gzip');
    o(req.header('Accept-Encoding')).equals('gzip');
  });

  o('should extract methods', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeContext, fakeLog);
    o(req.method).equals('GET');
  });

  o('should upper case method', () => {
    const newReq = clone(AlbExample);
    newReq.httpMethod = 'post';
    const req = new LambdaAlbRequest(newReq, fakeContext, fakeLog);
    o(req.method).equals('POST');
  });

  o('should extract query parameters', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeContext, fakeLog);
    o(req.query.get('api')).deepEquals('abc123');
    o(req.query.getAll('api')).deepEquals(['abc123']);
  });

  o('should not be case-insensitive query parameters', () => {
    const newReq = clone(AlbExample);
    delete newReq.queryStringParameters!['foo'];
    newReq.queryStringParameters!['FoO'] = 'baR';

    const req = new LambdaAlbRequest(newReq, fakeContext, fakeLog);
    o(req.query.get('foo')).deepEquals(null);
    o(req.query.getAll('foo')).deepEquals([]);

    o(req.query.get('FoO')).deepEquals('baR');
    o(req.query.getAll('FoO')).deepEquals(['baR']);
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
