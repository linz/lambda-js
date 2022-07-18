import o from 'ospec';
import { RequestTypes } from '../../__test__/examples.js';
import { LambdaHttpRequest } from '../request.http.js';
import { LambdaHttpResponse } from '../response.http.js';
import { Router } from '../router.js';

o.spec('Router', () => {
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
    o.spec(rt.type, () => {
      o(`should route rainbows and unicorns`, async () => {
        const urlRoute = rt.create('/v1/🦄/🌈/🦄.json', '🌈=🦄');
        const res = await router.handle(urlRoute);
        o(res.status).equals(200);
        o(res.body).deepEquals(JSON.stringify(expectedResult));
      });

      o('path should be url encoded', () => {
        const req = rt.create('/v1/🦄/🌈/🦄.json', '');
        o(req.path).equals('/v1/%F0%9F%A6%84/%F0%9F%8C%88/%F0%9F%A6%84.json');
      });

      o('should 404 on invalid routes', async () => {
        const res = await router.handle(rt.create('/v1/🦄/🦄/🦄.json', '🌈=🦄'));
        o(res.status).equals(404);
      });
    });
  }
});
