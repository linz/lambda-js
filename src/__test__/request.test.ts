import { LambdaAlbRequest } from '../request.alb';
import { AlbExample, clone } from './examples';
import { fakeLog } from './log';
import o from 'ospec';

o.spec('Request', () => {
  o('should parse base64 body as json', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeLog);
    const body = req.json();
    o(body).deepEquals({ status: 'ok' });
  });

  o('should parse body as json', () => {
    const obj = clone(AlbExample);
    obj.isBase64Encoded = false;
    obj.body = JSON.stringify({ status: 'ok' });

    const req = new LambdaAlbRequest(obj, fakeLog);
    const body = req.json();
    o(body).deepEquals({ status: 'ok' });
  });

  o('should throw if content-type is not application/json', () => {
    const obj = clone(AlbExample);
    obj.headers!['content-type'] = 'text/plain';

    const req = new LambdaAlbRequest(obj, fakeLog);
    o(() => req.json()).throws(Error);
  });

  o('should throw if body is empty', () => {
    const obj = clone(AlbExample);
    obj.body = null;

    const req = new LambdaAlbRequest(obj, fakeLog);
    o(() => req.json()).throws(Error);
  });

  o('should throw if body is not json', () => {
    const obj = clone(AlbExample);
    obj.body = 'text message';

    const req = new LambdaAlbRequest(obj, fakeLog);
    o(() => req.json()).throws(Error);
  });
});
