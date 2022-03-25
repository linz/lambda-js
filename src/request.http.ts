import {
  ALBEvent,
  ALBResult,
  APIGatewayProxyEvent,
  APIGatewayProxyResultV2,
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
  Context,
} from 'aws-lambda';
import * as ulid from 'ulid';
import { URLSearchParams } from 'url';
import { ApplicationJson, HttpHeader, HttpHeaderRequestId } from './header.js';
import { LogType } from './log.js';
import { LambdaRequest } from './request.js';
import { LambdaHttpResponse } from './response.http.js';

export type HttpRequestEvent = ALBEvent | CloudFrontRequestEvent | APIGatewayProxyEvent;
export type HttpResponse = ALBResult | CloudFrontRequestResult | APIGatewayProxyResultV2;

// TODO these should ideally be validated before being given to the api, should this force a ZOD validation step
export interface RequestTypes {
  Params?: unknown;
  // Body?: unknown;
  // Querystring?: unknown;
  // Headers?: unknown;
}
export abstract class LambdaHttpRequest<
  Rt extends RequestTypes = RequestTypes,
  Request extends HttpRequestEvent = HttpRequestEvent,
  Response extends HttpResponse = HttpResponse,
> extends LambdaRequest<Request, Response> {
  public headers = new Map<string, string>();
  public correlationId: string;
  public params: Rt['Params'];

  private _isHeadersLoaded: boolean;

  constructor(request: Request, ctx: Context, log: LogType) {
    super(request, ctx, log);
    this.correlationId = this.header(HttpHeaderRequestId.CorrelationId) ?? ulid.ulid();
    this.set('correlationId', this.correlationId);
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

    if (this.body == null) throw new Error('Cannot parse empty body as JSON');
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
   * Upper cased HTTP method
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
  /**
   * Query string parameters
   *
   * All query parameters have been normalized into lowercase
   */
  get query(): URLSearchParams {
    if (this._query == null) this._query = this.loadQueryString();
    return this._query;
  }
}
