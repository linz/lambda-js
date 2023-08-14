import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RequestTypes } from '../../__test__/examples.js';
import { LambdaHttpRequest } from '../request.http.js';
import { LambdaHttpResponse } from '../response.http.js';
import { Router } from '../router.js';

describe('Router', () => {
  const router = new Router();
  router.get('/v1/🦄/🌈/:fileName', (req: LambdaHttpRequest<{ Params: { fileName: string } }>) => {
    return LambdaHttpResponse.ok().json({
      fileName: req.params.fileName,
      path: req.path,
      query: [...req.query.entries()],
    });
  });
  const expectedResult = { fileName: '🦄.json', path: encodeURI('/v1/🦄/🌈/🦄.json'), query: [['🌈', '🦄']] };

  for (const rt of RequestTypes) {
    describe(rt.type, () => {
      it(`should route rainbows and unicorns`, async () => {
        const urlRoute = rt.create('/v1/🦄/🌈/🦄.json', '🌈=🦄');
        const res = await router.handle(urlRoute);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, JSON.stringify(expectedResult));
      });

      it('path should be url encoded', () => {
        const req = rt.create('/v1/🦄/🌈/🦄.json', '');
        assert.equal(req.path, '/v1/%F0%9F%A6%84/%F0%9F%8C%88/%F0%9F%A6%84.json');
      });

      it('should 404 on invalid routes', async () => {
        const res = await router.handle(rt.create('/v1/🦄/🦄/🦄.json', '🌈=🦄'));
        assert.equal(res.status, 404);
      });
    });
  }
});
