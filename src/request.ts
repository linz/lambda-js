import { Metrics } from '@linzjs/metrics';
import {
  ALBEvent,
  ALBResult,
  APIGatewayProxyEvent,
  APIGatewayProxyResultV2,
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
} from 'aws-lambda';
import * as ulid from 'ulid';
import { URLSearchParams } from 'url';
import { RequestIdHeaders } from './header';
import { LogType } from './log';
import { LambdaHttpResponse } from './response';

export type HttpRequestEvent = ALBEvent | CloudFrontRequestEvent | APIGatewayProxyEvent;
export type HttpResponse = ALBResult | CloudFrontRequestResult | APIGatewayProxyResultV2;

export abstract class LambdaHttpRequest<
  Request extends HttpRequestEvent = HttpRequestEvent,
  Response extends HttpResponse = HttpResponse,
> {
  event: Request;
  logCtx: Record<string, unknown> = {};

  public id: string;
  public correlationId: string;
  public logContext: Record<string, unknown> = {};
  public timer: Metrics = new Metrics();
  public headers = new Map<string, string>();

  public log: LogType;
  private _isHeadersLoaded: boolean;

  constructor(request: Request, log: LogType) {
    this.id = ulid.ulid();
    this.log = log;
    this.event = request;
    this.timer = new Metrics();

    this.correlationId = this.header(RequestIdHeaders.CorrelationId) ?? ulid.ulid();
    this.set('correlationId', this.correlationId);
    this.log = log.child({ id: this.id });
  }

  /** Set a logging context, this will be logged at the end of the request */
  set(key: string, value: unknown): void {
    if (value == null) value = undefined;
    this.logCtx[key] = value;
  }

  /**
   * Read a header from the event object
   * @param key header to read
   */
  header(key: string): string | undefined {
    if (this._isHeadersLoaded !== true) {
      this.loadHeaders();
      this._isHeadersLoaded = true;
    }
    return this.headers.get(key.toLowerCase());
  }

  abstract toResponse(res: LambdaHttpResponse): Response;
  abstract loadHeaders(): void;
  abstract loadQueryString(): URLSearchParams;

  /**
   * Lower cased HTTP method
   * @example 'GET'
   * @example 'POST'
   */
  abstract method: string;
  /**  */
  abstract path: string;

  _query: URLSearchParams;
  /** Query string parameters */
  get query(): URLSearchParams {
    if (this._query == null) this._query = this.loadQueryString();
    return this._query;
  }
}
