import { Callback, Context } from 'aws-lambda';
import { ApplicationJson, HttpHeader, HttpHeaderAmazon, RequestIdHeaders } from './header';
import { LogType } from './log';
import { HttpRequestEvent, HttpResponse, LambdaHttpRequest } from './request';
import { LambdaAlbRequest } from './request.alb';
import { LambdaApiGatewayRequest } from './request.api.gateway';
import { LambdaCloudFrontRequest } from './request.cloudfront';
import { LambdaHttpResponse } from './response';
import pino from 'pino';

export interface HttpStatus {
  statusCode: string;
  statusDescription: string;
}

export type LambdaFunc = (req: LambdaHttpRequest) => Promise<LambdaHttpResponse>;
export type LambdaHttpFunc = (
  event: HttpRequestEvent,
  context: Context,
  callback: Callback<HttpResponse>,
) => Promise<void>;

const version = process.env.GIT_VERSION;
const hash = process.env.GIT_HASH ?? '';
const versionInfo = { version, hash };

export class LambdaFunction {
  /** Default logger to use if one is not provided */
  static Logger = pino();
  /**
   * Set the http "Server" header to include this name
   * Setting to null or '' will not set the Server
   */
  static ServerName: string | null = 'linz';

  static request(req: HttpRequestEvent, log: LogType): LambdaHttpRequest {
    if (LambdaAlbRequest.is(req)) return new LambdaAlbRequest(req, log);
    if (LambdaApiGatewayRequest.is(req)) return new LambdaApiGatewayRequest(req, log);
    if (LambdaCloudFrontRequest.is(req)) return new LambdaCloudFrontRequest(req, log);
    throw new Error('Unknown request event');
  }
  /**
   *  Wrap a lambda function to provide extra functionality
   *
   * - Log metadata about the call on every request
   * - Catch errors and log them before exiting
   */
  public static wrap(fn: LambdaFunc, logger?: LogType): LambdaHttpFunc {
    return async (event: HttpRequestEvent, context: Context, callback: Callback<HttpResponse>): Promise<void> => {
      const req = LambdaFunction.request(event, logger ?? LambdaFunction.Logger);
      req.timer.start('lambda');

      // Log the lambda event for debugging
      if (process.env.DEBUG) req.log?.debug({ event }, 'LambdaDebug');

      // Trace cloudfront requests back to the cloudfront logs
      const cloudFrontId = req.header(HttpHeaderAmazon.CloudfrontId);
      const traceId = req.header(HttpHeaderAmazon.TraceId);
      const lambdaId = context.awsRequestId;
      req.set('aws', { cloudFrontId, traceId, lambdaId });

      if (versionInfo.hash !== '') req.set('package', versionInfo);
      req.set('method', req.method);
      req.set('path', req.path);

      let res: LambdaHttpResponse;
      try {
        res = await fn(req);
      } catch (error) {
        // If a LambdaHttpResponse was thrown, just reuse it as a response
        if (LambdaHttpResponse.is(error)) {
          res = error;
        } else {
          // Unhandled exception was thrown
          req.set('err', error);
          res = new LambdaHttpResponse(500, 'Internal Server Error');
          res.header(HttpHeader.CacheControl, 'no-store');
        }
      }

      req.set('status', res.status);
      req.set('description', res.statusDescription);
      req.set('metrics', req.timer.metrics);

      res.header(RequestIdHeaders.RequestId, req.id);
      res.header(RequestIdHeaders.CorrelationId, req.correlationId);

      const duration = req.timer.end('lambda');
      req.set('unfinished', req.timer.unfinished);
      req.set('duration', duration);
      res.header(HttpHeader.ServerTiming, `total;dur=${duration}`);

      // Log a "Report" or "Metalog" full of information at the end of every request
      req.set('@type', 'report');

      req.log.info(req.logContext, 'LambdaDone');

      if (!res.isBase64Encoded && res.header(HttpHeader.ContentType) == null) {
        res.header(HttpHeader.ContentType, ApplicationJson);
      }

      if (LambdaFunction.ServerName) res.header(HttpHeader.Server, `${LambdaFunction.ServerName}-${version}`);

      callback(null, req.toResponse(res));
    };
  }
}
