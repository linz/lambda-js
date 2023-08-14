import { Callback, Context, Handler } from 'aws-lambda';
import pino from 'pino';
import { ApplicationJson, HttpHeader, HttpHeaderRequestId } from './header.js';
import { LambdaAlbRequest } from './http/request.alb.js';
import { LambdaApiGatewayRequest } from './http/request.api.gateway.js';
import { LambdaCloudFrontRequest } from './http/request.cloudfront.js';
import { HttpRequestEvent, HttpResponse, LambdaHttpRequest } from './http/request.http.js';
import { LambdaUrlRequest } from './http/request.url.js';
import { LambdaHttpResponse } from './http/response.http.js';
import { Router } from './http/router.js';
import { LogType } from './log.js';
import { LambdaRequest } from './request.js';
import { LambdaResponse } from './response.js';

export interface HttpStatus {
  statusCode: string;
  statusDescription: string;
}
export type LambdaHandlerAsync<TEvent = unknown, TResult = unknown> = (
  event: TEvent,
  context: Context,
) => Promise<TResult>;

export type LambdaHandler<TEvent = unknown, TResult = unknown> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>,
) => void;
export interface LambdaWrappedFunction<T, K = LambdaResponse | void> {
  (req: LambdaRequest<T>): K | Promise<K>;
}
export type LambdaWrappedFunctionHttp = (req: LambdaHttpRequest) => LambdaHttpResponse | Promise<LambdaHttpResponse>;
export type LambdaHttpFunc = Handler<HttpRequestEvent, HttpResponse>;

const version = process.env.GIT_VERSION;
const hash = process.env.GIT_HASH;
const buildId = process.env.BUILD_ID;
const versionInfo = { version, hash, buildId };

/** Run the request catching any errors */
export async function runFunction<T extends LambdaRequest, K>(
  req: T,
  fn: (req: T) => K | Promise<K>,
): Promise<K | LambdaHttpResponse> {
  if (!req.timer.timers.has('lambda')) req.timer.start('lambda');

  try {
    return await fn(req);
  } catch (error) {
    // If a LambdaHttpResponse was thrown, just reuse it as a response
    if (LambdaHttpResponse.is(error)) return error;

    // Unhandled exception was thrown
    req.set('err', error);
    return new LambdaHttpResponse(500, 'Internal Server Error');
  }
}

export function finalize<T extends LambdaRequest, K>(req: T, res: K): K {
  const duration = req.timer.timers.has('lambda') ? req.timer.end('lambda') : 0;

  let status = 200;
  if (res instanceof LambdaHttpResponse) {
    // Do not cache 5xx errors
    if (res.status >= 500) res.header(HttpHeader.CacheControl, 'no-store');

    res.header(HttpHeader.ServerTiming, `total;dur=${duration}`);

    if (!res.isBase64Encoded && res.header(HttpHeader.ContentType) == null) {
      res.header(HttpHeader.ContentType, ApplicationJson);
    }
    status = res.status;
    req.set('description', res.statusDescription);
    res.header(HttpHeaderRequestId.RequestId, req.id);
    if (req instanceof LambdaHttpRequest) {
      res.header(HttpHeaderRequestId.CorrelationId, req.correlationId);
    }
  }

  req.set('status', status);
  if (req.timer.timers.size > 0) req.set('metrics', req.timer.metrics);
  if (versionInfo.hash) req.set('package', versionInfo);

  req.set('requestCount', req.requestCount);
  req.set('unfinished', req.timer.unfinished);
  req.set('duration', duration);

  // Log a "Report" or "Metalog" full of information at the end of every request
  req.set('@type', 'report');

  if (status > 499) req.log.error(req.logContext, 'Lambda:Done');
  else if (status > 399) req.log.warn(req.logContext, 'Lambda:Done');
  else req.log.info(req.logContext, 'Lambda:Done');
  return res;
}

interface LambdaHandlerOptions {
  /**
   * Should errors be handled and logged or reject the callback
   * @default true
   */
  rejectOnError: boolean;

  /**
   * Percentage of requests to be set to `trace` level logging.
   * Number between 0 and 1, 1 meaning all requests are traced
   * @default 0
   */
  tracePercent: number;
}

function addDefaultOptions(o?: Partial<LambdaHandlerOptions>): LambdaHandlerOptions {
  const opts = {
    rejectOnError: true,
    tracePercent: 0,
    ...o,
  };
  if (isNaN(opts.tracePercent) || opts.tracePercent > 1) {
    throw new Error('tracePercent is not between 0-1 :' + opts.tracePercent);
  }
  return opts;
}

export class lf {
  /** Default logger to use if one is not provided */
  static Logger: LogType = pino();
  /**
   * Set the http "Server" header to include this name
   * Setting to null or '' will not set the Server
   */
  static ServerName: string | null = 'linz';

  /** Number of requests served by this lambda function */
  static requestCount = 0;

  static request(req: HttpRequestEvent, ctx: Context, log: LogType): LambdaHttpRequest {
    if (LambdaAlbRequest.is(req)) return new LambdaAlbRequest(req, ctx, log);
    if (LambdaUrlRequest.is(req)) return new LambdaUrlRequest(req, ctx, log);
    if (LambdaApiGatewayRequest.is(req)) return new LambdaApiGatewayRequest(req, ctx, log);
    if (LambdaCloudFrontRequest.is(req)) return new LambdaCloudFrontRequest(req, ctx, log);
    throw new Error('Request is not a a ALB, ApiGateway or Cloudfront event');
  }

  /**
   *  Wrap a lambda function to provide extra functionality
   *
   * - Log metadata about the call on every request
   * - Catch errors and log them before exiting
   *
   * @param fn Function to wrap
   * @param options Configuration options
   * @param logger optional logger to use for the request @see lf.Logger
   */
  public static handler<TEvent, TResult = unknown>(
    fn: LambdaWrappedFunction<TEvent, TResult>,
    options?: Partial<LambdaHandlerOptions>,
    logger?: LogType,
  ): LambdaHandler<TEvent, TResult> {
    const opts = addDefaultOptions(options);
    function handler(event: TEvent, context: Context, callback: Callback<TResult>): void {
      const req = new LambdaRequest<TEvent, TResult>(event, context, logger ?? lf.Logger);
      req.requestCount = lf.requestCount++;
      if (opts.tracePercent > 0 && Math.random() < opts.tracePercent) req.log.level = 'trace';
      if (process.env.TRACE_LAMBDA) req.log.level = 'trace';

      req.log.trace({ event }, 'Lambda:Start');

      const lambdaId = context.awsRequestId;
      req.set('aws', { lambdaId });

      runFunction(req, fn).then((res) => {
        finalize(req, res);

        if (LambdaHttpResponse.is(res)) {
          if (opts.rejectOnError) {
            if (req.logContext['err']) return callback(req.logContext['err'] as Error);
            if (res.status > 399) return callback(req.toResponse(res) as unknown as string);
          }
          return callback(null, req.toResponse(res));
        }

        return callback(null, res);
      });
    }
    return handler;
  }
  /**
   *  Create a route lambda function to provide extra functionality
   *
   * - Log metadata about the call on every request
   * - Catch errors and log them before exiting
   *
   * @param logger optional logger to use for the request @see lf.Logger
   */
  public static http(logger?: LogType): LambdaHandlerAsync<HttpRequestEvent, HttpResponse> & HttpHandlerOptions {
    const router = new Router();

    async function httpHandler(event: HttpRequestEvent, context: Context): Promise<HttpResponse> {
      const req = lf.request(event, context, logger ?? lf.Logger);
      try {
        const res = await router.handle(req);
        return req.toResponse(res);
      } catch (err) {
        req.log.fatal({ err: err }, 'Lambda:Failed');
        const res = new LambdaHttpResponse(500, 'Internal Server Error');
        req.set('err', err);
        res.header(HttpHeaderRequestId.RequestId, req.id);
        res.header(HttpHeaderRequestId.CorrelationId, req.correlationId);
        return req.toResponse(res);
      }
    }
    httpHandler.router = router;
    return httpHandler;
  }
}

export interface HttpHandlerOptions {
  router: Router;
}
