import { URLSearchParams } from 'url';
import { isRecord } from '../request.js';
import { LambdaApiGatewayRequest } from './request.api.gateway.js';
import { LambdaHttpRequest } from './request.http.js';
import { LambdaHttpResponse } from './response.http.js';

export interface UrlEvent {
  version: '2.0';
  routeKey: string;

  rawPath: string;
  /** Query string without '?' @example "api=abc123" */
  rawQueryString: string;
  headers: Record<string, string>;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    requestId: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  isBase64Encoded: boolean;
}

export interface UrlResult {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
}

export class LambdaUrlRequest<T extends Record<string, string>> extends LambdaHttpRequest<T, UrlEvent, UrlResult> {
  toResponse(res: LambdaHttpResponse): UrlResult {
    return {
      statusCode: res.status,
      body: res.body,
      headers: LambdaApiGatewayRequest.toHeaders(res),
      isBase64Encoded: res.isBase64Encoded,
    };
  }
  loadHeaders(): void {
    for (const [key, value] of Object.entries(this.event.headers)) {
      this.headers.set(key.toLowerCase(), value);
    }
  }

  loadQueryString(): URLSearchParams {
    return new URLSearchParams(this.event.rawQueryString);
  }

  get method(): string {
    return this.event.requestContext.http.method.toUpperCase();
  }
  get path(): string {
    return this.event.rawPath;
  }

  get isBase64Encoded(): boolean {
    return this.event.isBase64Encoded;
  }

  get body(): string | null {
    return null;
  }

  static is(x: unknown): x is UrlEvent {
    if (!isRecord(x)) return false;
    if (!isRecord(x['requestContext'])) return false;
    if (!isRecord(x['requestContext']['http'])) return false;
    return true;
  }
}
