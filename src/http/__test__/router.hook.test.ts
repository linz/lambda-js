import { ALBResult, Context } from 'aws-lambda';
import o from 'ospec';
import sinon from 'sinon';
import { lf } from '../../function.js';
import { AlbExample, UrlExample } from '../../__test__/examples.js';
import { fakeLog } from '../../__test__/log.js';
import { LambdaUrlRequest } from '../request.url.js';
import { LambdaHttpResponse } from '../response.http.js';
import { Router } from '../router.js';

o.spec('RouterHook', () => {
  const fakeContext = {} as Context;
  const sandbox = sinon.createSandbox();
  const req = new LambdaUrlRequest(UrlExample, fakeContext, fakeLog);

  o.afterEach(() => sandbox.restore());

  o.spec('request', () => {
    o('should run before every request', async () => {
      const r = new Router();

      const hook = sandbox.stub();
      r.hook('request', hook);

      const res = await r.handle(req);

      o(res.status).equals(404);
      o(hook.calledOnce).equals(true);

      const resB = await r.handle(req);
      o(resB.status).equals(404);
      o(hook.calledTwice).equals(true);
    });

    o('should allow request hooks to make responses', async () => {
      const r = new Router();
      r.hook('request', () => {
        return new LambdaHttpResponse(200, 'ok');
      });

      const res = await r.handle(req);
      o(res.status).equals(200);
    });
    o('should allow request hooks to throw responses', async () => {
      const r = new Router();
      r.hook('request', () => {
        throw new LambdaHttpResponse(500, 'ok');
      });

      const res = await r.handle(req);
      o(res.status).equals(500);
      o(res.statusDescription).equals('ok');
    });
    o('should catch unhandled exceptions', async () => {
      const r = new Router();
      r.hook('request', (req) => {
        req.path = ''; // Path is readonly
      });

      const res = await r.handle(req);
      o(res.status).equals(500);
      o(res.statusDescription).equals('Internal Server Error');
    });
  });

  o.spec('response', () => {
    o('should allow overriding of response', async () => {
      const r = new Router();
      r.hook('response', (req, res) => {
        o(res.status).equals(404);
        res.status = 200;
      });

      const res = await r.handle(req);
      o(res.status).equals(200);
    });

    o('should allow throwing of errors', async () => {
      const r = new Router();
      r.hook('response', () => {
        throw new LambdaHttpResponse(400, 'ok');
      });

      const res = await r.handle(req);
      o(res.status).equals(400);
    });

    o('should catch unhandled exceptions', async () => {
      const r = new Router();
      r.hook('response', (req) => {
        req.path = ''; // Path is readonly
      });

      const res = await r.handle(req);
      o(res.status).equals(500);
      o(res.statusDescription).equals('Internal Server Error');
    });

    o('should log after the response hook', async () => {
      fakeLog.logs = [];
      const http = lf.http(fakeLog);

      http.router.hook('response', (req, res) => {
        if (res.status !== 404) throw new Error('status should be 404');
        res.status = 200; // Convert the response to a 200!
        req.set('logParam', 'response'); // Add a new log parameter to be logged
      });

      const res = await new Promise<ALBResult>((r) => http(AlbExample, fakeContext, (err, res) => r(res as ALBResult)));

      o(fakeLog.logs.length).equals(1);
      const [firstLog] = fakeLog.logs;
      o(firstLog.logParam).equals('response');
      o(firstLog['@type']).equals('report');
      o(firstLog['status']).equals(200);

      o(res.statusCode).equals(200);
    });
  });
});
