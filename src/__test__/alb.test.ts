import o from 'ospec';
import { LambdaAlbRequest } from '../request.alb';
import { AlbExample, ApiGatewayExample, clone, CloudfrontExample } from './examples';
import { fakeLog } from './log';

o.spec('AlbGateway', () => {
  o('should match the event', () => {
    o(LambdaAlbRequest.is(ApiGatewayExample)).equals(false);
    o(LambdaAlbRequest.is(CloudfrontExample)).equals(false);

    o(LambdaAlbRequest.is(AlbExample)).equals(true);
  });

  o('should extract headers', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeLog);

    o(req.header('accept-encoding')).equals('gzip');
    o(req.header('Accept-Encoding')).equals('gzip');
  });

  o('should extract methods', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeLog);
    o(req.method).equals('GET');
  });

  o('should upper case method', () => {
    const newReq = clone(AlbExample);
    newReq.httpMethod = 'post';
    const req = new LambdaAlbRequest(newReq, fakeLog);
    o(req.method).equals('POST');
  });

  o('should extract query parameters', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeLog);
    o(req.query.get('api')).deepEquals('abc123');
    o(req.query.getAll('api')).deepEquals(['abc123']);
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
