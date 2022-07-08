import { execute, runFunction } from '../function.js';
import { LambdaHttpRequest, RequestTypes } from './request.http.js';
import { LambdaHttpResponse } from './response.http.js';
import FindMyWay from 'find-my-way';

export type Route<T extends RequestTypes = RequestTypes> = (
  req: LambdaHttpRequest<T>,
) => Promise<LambdaHttpResponse> | LambdaHttpResponse | void;

export type RouteResponse<T extends RequestTypes> = (
  req: LambdaHttpRequest<T>,
  res: LambdaHttpResponse,
) => Promise<void> | void;

export type RouteHooks = {
  /** Before the request is executed */
  request: Route<RequestTypes>;
  /** Before the response is returned to the lambda */
  response: RouteResponse<RequestTypes>;
};

export type HookRecord<T extends RouteHooks> = {
  [K in keyof T]: T[K][];
};

export type HttpMethods = 'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'OPTIONS';
export class Router {
  hooks: HookRecord<RouteHooks> = {
    /** Hooks to be run before every request */
    request: [],
    /** Hooks to be run after every request */
    response: [],
  };
  router: FindMyWay.Instance<FindMyWay.HTTPVersion.V1>;

  constructor() {
    this.router = FindMyWay();
  }

  register<T extends RequestTypes>(method: HttpMethods, path: string, fn: Route<T>): void {
    this.router.on(method, path, async (req: unknown, res, params) => {
      if (req instanceof LambdaHttpRequest) {
        req.params = params;
        console.log({ params: req.params, query: [...req.query.entries()] });
        const ret = await fn(req);
        if (ret != null) {
          res.statusCode = ret.status;
          res.end(ret);
        }
      }
    });
  }

  /**
   * Attach a hook to the router
   * @param name hook to attach too
   * @param cb Function to call on hook
   */
  hook<K extends keyof RouteHooks>(name: K, cb: RouteHooks[K]): void {
    this.hooks[name].push(cb);
  }

  /** Register a route for all HTTP types, GET, POST, HEAD, etc... */
  all<T extends RequestTypes>(path: string, fn: Route<T>): void {
    // return this.register('ALL', path, fn);
  }
  get<T extends RequestTypes>(path: string, fn: Route<T>): void {
    return this.register('GET', path, fn);
  }
  post<T extends RequestTypes>(path: string, fn: Route<T>): void {
    return this.register('POST', path, fn);
  }
  delete<T extends RequestTypes>(path: string, fn: Route<T>): void {
    return this.register('DELETE', path, fn);
  }
  options<T extends RequestTypes>(path: string, fn: Route<T>): void {
    return this.register('OPTIONS', path, fn);
  }
  patch<T extends RequestTypes>(path: string, fn: Route<T>): void {
    return this.register('PATCH', path, fn);
  }
  head<T extends RequestTypes>(path: string, fn: Route<T>): void {
    return this.register('HEAD', path, fn);
  }
  put<T extends RequestTypes>(path: string, fn: Route<T>): void {
    return this.register('PUT', path, fn);
  }

  /** After a route has finished processing run the response hooks on the request/response pair */
  async after(req: LambdaHttpRequest, response: LambdaHttpResponse): Promise<LambdaHttpResponse> {
    try {
      for (const hook of this.hooks.response) await hook(req, response);
    } catch (e) {
      if (LambdaHttpResponse.is(e)) return e;
      req.set('err', e);
      return new LambdaHttpResponse(500, 'Internal Server Error');
    }
    return response;
  }

  /**
   * Handle a incoming request
   *
   * Request flow: hook.request(req) -> requestHandler(req) -> hook.response(req, res)
   */
  async handle(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    // On before request
    for (const hook of this.hooks.request) {
      const res = await runFunction(req, hook);
      // If a hook returns a response return the response to the user
      if (res) return this.after(req, res);
    }

    const routeRes = {
      end(value: unknown): unknown {
        return null;
      },
    };
    const routePromise = new Promise<LambdaHttpResponse | null>((resolve) => (routeRes.end = resolve));
    this.router.lookup(req as any, routeRes as any);

    const result = await routePromise;
    if (result) return this.after(req, result);

    return this.after(req, new LambdaHttpResponse(404, 'Not found'));
  }
}
