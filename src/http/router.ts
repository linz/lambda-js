import { execute } from '../function.js';
import { LambdaHttpRequest, RequestTypes } from './request.http.js';
import { LambdaHttpResponse } from './response.http.js';

export type Route<T extends RequestTypes> = (
  req: LambdaHttpRequest<T>,
) => Promise<LambdaHttpResponse> | LambdaHttpResponse | void;
export type HttpMethods = 'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'OPTIONS' | 'ALL';
export class Router {
  routes: {
    path: RegExp;
    method: HttpMethods;
    // TODO is there a better way to model this route list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: Route<any>;
  }[] = [];

  register<T extends RequestTypes>(method: HttpMethods, path: string, fn: Route<T>): void {
    // Stolen from https://github.com/kwhitley/itty-router
    const regex = RegExp(
      `^${
        path
          .replace(/(\/?)\*/g, '($1.*)?')
          .replace(/\/$/, '')
          .replace(/:(\w+)(\?)?(\.)?/g, '$2(?<$1>[^/]+)$2$3')
          .replace(/\.(?=[\w(])/, '\\.')
          .replace(/\)\.\?\(([^\[]+)\[\^/g, '?)\\.?($1(?<=\\.)[^\\.') // RIP all the bytes lost :'(
      }/*$`,
    );
    this.routes.push({ path: regex, method, fn });
  }

  all<T extends RequestTypes>(path: string, fn: Route<T>): void {
    return this.register('ALL', path, fn);
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

  async handle(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    for (const r of this.routes) {
      if (r.method !== 'ALL' && req.method !== r.method) continue;
      const m = req.path.match(r.path);
      if (m) {
        // TODO this should ideally be validated
        req.params = m.groups;
        const ret = await execute(req, r.fn);
        if (ret) return ret;
      }
    }

    return new LambdaHttpResponse(404, 'Not found');
  }
}
