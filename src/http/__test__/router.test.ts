import o from 'ospec';
import { newRequestAlb, newRequestApi, newRequestCloudFront, newRequestUrl } from '../../__test__/examples.js';
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

  o('should route rainbows and unicorns LambdaUrl', async () => {
    const urlRoute = newRequestUrl('/v1/🦄/🌈/🦄.json', '🌈=🦄');
    const res = await router.handle(urlRoute);
    o(res.status).equals(200);
    o(res.body).deepEquals(JSON.stringify(expectedResult));

    const resb = await router.handle(newRequestUrl('/v2/🦄/🌈/🦄.json', '🌈=🦄'));
    o(resb.status).equals(404);
  });

  o('should route rainbows and unicorns LambdaAlb', async () => {
    const urlRoute = newRequestAlb('/v1/🦄/🌈/🦄.json', '🌈=🦄');
    const res = await router.handle(urlRoute);
    o(res.status).equals(200);
    o(res.body).deepEquals(JSON.stringify(expectedResult));

    const resb = await router.handle(newRequestUrl('/v2/🦄/🌈/🦄.json', '🌈=🦄'));
    o(resb.status).equals(404);
  });

  o('should route rainbows and unicorns LambdaApi', async () => {
    const urlRoute = newRequestApi('/v1/🦄/🌈/🦄.json', '🌈=🦄');
    const res = await router.handle(urlRoute);
    o(res.status).equals(200);
    o(res.body).deepEquals(JSON.stringify(expectedResult));

    const resb = await router.handle(newRequestUrl('/v2/🦄/🌈/🦄.json', '🌈=🦄'));
    o(resb.status).equals(404);
  });

  o('should route rainbows and unicorns LambdaCloudFront', async () => {
    const urlRoute = newRequestCloudFront('/v1/🦄/🌈/🦄.json', '🌈=🦄');
    const res = await router.handle(urlRoute);
    o(res.status).equals(200);
    o(res.body).deepEquals(JSON.stringify(expectedResult));

    const resb = await router.handle(newRequestUrl('/v2/🦄/🌈/🦄.json', '🌈=🦄'));
    o(resb.status).equals(404);
  });
});
