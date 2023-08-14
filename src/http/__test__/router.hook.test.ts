import { ALBResult, Context } from 'aws-lambda';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AlbExample, UrlExample } from '../../__test__/examples.js';
import { fakeLog } from '../../__test__/log.js';
import { lf } from '../../function.js';
import { LambdaUrlRequest } from '../request.url.js';
import { LambdaHttpResponse } from '../response.http.js';
import { Router } from '../router.js';

describe('RouterHook', () => {
  const fakeContext = {} as Context;
  const req = new LambdaUrlRequest(UrlExample, fakeContext, fakeLog);

  describe('request', () => {
    it('should run before every request', async (t) => {
      const r = new Router();

      const hook = t.mock.fn();
      r.hook('request', hook);

      const res = await r.handle(req);

      assert.equal(res.status, 404);
      assert.equal(hook.mock.callCount(), 1);

      const resB = await r.handle(req);
      assert.equal(resB.status, 404);
      assert.equal(hook.mock.callCount(), 2);
    });

    it('should allow request hooks to make responses', async () => {
      const r = new Router();
      r.hook('request', () => {
        return new LambdaHttpResponse(200, 'ok');
      });

      const res = await r.handle(req);
      assert.equal(res.status, 200);
    });
    it('should allow request hooks to throw responses', async () => {
      const r = new Router();
      r.hook('request', () => {
        throw new LambdaHttpResponse(500, 'ok');
      });

      const res = await r.handle(req);
      assert.equal(res.status, 500);
      assert.equal(res.statusDescription, 'ok');
    });
    it('should catch unhandled exceptions', async () => {
      const r = new Router();
      r.hook('request', (req) => {
        req.path = ''; // Path is readonly
      });

      const res = await r.handle(req);
      assert.equal(res.status, 500);
      assert.equal(res.statusDescription, 'Internal Server Error');
    });
  });

  describe('response', () => {
    it('should allow overriding of response', async () => {
      const r = new Router();
      r.hook('response', (req, res) => {
        assert.equal(res.status, 404);
        res.status = 200;
      });

      const res = await r.handle(req);
      assert.equal(res.status, 200);
    });

    it('should allow throwing of errors', async () => {
      const r = new Router();
      r.hook('response', () => {
        throw new LambdaHttpResponse(400, 'ok');
      });

      const res = await r.handle(req);
      assert.equal(res.status, 400);
    });

    it('should catch unhandled exceptions', async () => {
      const r = new Router();
      r.hook('response', (req) => {
        req.path = ''; // Path is readonly
      });

      const res = await r.handle(req);
      assert.equal(res.status, 500);
      assert.equal(res.statusDescription, 'Internal Server Error');
    });

    it('should log after the response hook', async () => {
      fakeLog.logs = [];
      const http = lf.http(fakeLog);

      http.router.hook('response', (req, res) => {
        if (res.status !== 404) throw new Error('status should be 404');
        res.status = 200; // Convert the response to a 200!
        req.set('logParam', 'response'); // Add a new log parameter to be logged
      });

      const res = await http(AlbExample, fakeContext);

      assert.equal(fakeLog.logs.length, 1);
      const [firstLog] = fakeLog.logs;
      assert.equal(firstLog.logParam, 'response');
      assert.equal(firstLog['@type'], 'report');
      assert.equal(firstLog['status'], 200);

      assert.equal((res as ALBResult).statusCode, 200);
    });
  });
});
