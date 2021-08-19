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
import { ApplicationJson, HttpHeader, HttpHeaderRequestId } from './header';
import { LogType } from './log';
import { LambdaHttpResponse } from './response';

export type HttpRequestEvent = ALBEvent | CloudFrontRequestEvent | APIGatewayProxyEvent;
export type HttpResponse = ALBResult | CloudFrontRequestResult | APIGatewayProxyResultV2;

export abstract class LambdaHttpRequest<
  Request extends HttpRequestEvent = HttpRequestEvent,
  Response extends HttpResponse = HttpResponse,
> {
  public event: Request;
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

    this.correlationId = this.header(HttpHeaderRequestId.CorrelationId) ?? ulid.ulid();
    this.set('correlationId', this.correlationId);
    this.log = log.child({ id: this.id });
  }

  /** Set a logging context, this will be logged at the end of the request */
  set(key: string, value: unknown): void {
    if (value == null) value = undefined;
    this.logContext[key] = value;
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

  /** Attempt to parse the body as JSON */
  json(): Record<string, unknown> {
    if (this.header(HttpHeader.ContentType) !== ApplicationJson) {
      throw new Error(`Invalid Content-Type: "${this.header('content-type')}"`);
    }

    if (this.body == null) throw new Error('Cannot parse empty body as JSONN');
    try {
      if (this.isBase64Encoded) return JSON.parse(Buffer.from(this.body ?? '', 'base64').toString());
      return JSON.parse(this.body);
    } catch (e) {
      throw new Error('Body is not a JSON object');
    }
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

  /** Body if provided null otherwise, this could be base64 encoded see @see this.isBase64Encoded */
  abstract body: string | null;

  /** Is the body base64 encoded */
  abstract isBase64Encoded: boolean;

  _query: URLSearchParams;
  /** Query string parameters */
  get query(): URLSearchParams {
    if (this._query == null) this._query = this.loadQueryString();
    return this._query;
  }
}
