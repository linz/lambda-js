import { LambdaAlbRequest } from '../http/request.alb.js';
import { AlbExample, clone } from './examples.js';
import { fakeLog } from './log.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Context } from 'aws-lambda';

describe('Request', () => {
  const fakeContext = {} as unknown as Context;
  it('should parse base64 body as json', () => {
    const req = new LambdaAlbRequest(AlbExample, fakeContext, fakeLog);
    const body = req.json();
    assert.deepEqual(body, { status: 'ok' });
  });

  it('should parse body as json', () => {
    const obj = clone(AlbExample);
    obj.isBase64Encoded = false;
    obj.body = JSON.stringify({ status: 'ok' });

    const req = new LambdaAlbRequest(obj, fakeContext, fakeLog);
    const body = req.json();
    assert.deepEqual(body, { status: 'ok' });
  });

  it('should throw if content-type is not application/json', () => {
    const obj = clone(AlbExample);
    obj.headers!['content-type'] = 'text/plain';

    const req = new LambdaAlbRequest(obj, fakeContext, fakeLog);
    assert.throws(() => req.json(), Error);
  });

  it('should throw if body is empty', () => {
    const obj = clone(AlbExample);
    obj.body = null;

    const req = new LambdaAlbRequest(obj, fakeContext, fakeLog);
    assert.throws(() => req.json(), Error);
  });

  it('should throw if body is not json', () => {
    const obj = clone(AlbExample);
    obj.body = 'text message';

    const req = new LambdaAlbRequest(obj, fakeContext, fakeLog);
    assert.throws(() => req.json(), Error);
  });
});
