import { ALBEvent, ALBResult } from 'aws-lambda';
import { URLSearchParams } from 'url';

import { isRecord } from '../request.js';
import { LambdaHttpRequest } from './request.http.js';
import { LambdaHttpResponse } from './response.http.js';

export class LambdaAlbRequest<T extends Record<string, string>> extends LambdaHttpRequest<T, ALBEvent, ALBResult> {
  static is(x: unknown): x is ALBEvent {
    return isRecord(x) && isRecord(x['requestContext']) && isRecord(x['requestContext']['elb']);
  }

  toResponse(res: LambdaHttpResponse): ALBResult {
    return {
      statusCode: res.status,
      statusDescription: res.statusDescription,
      body: res.body,
      headers: this.toHeaders(res.headers),
      isBase64Encoded: res.isBase64Encoded,
    };
  }

  toHeaders(headers: Map<string, string>): Record<string, string> | undefined {
    if (headers.size === 0) return undefined;

    const obj: Record<string, string> = {};
    for (const prop of headers) obj[prop[0]] = prop[1];
    return obj;
  }

  loadHeaders(): void {
    if (this.event.headers == null) return;
    for (const [key, value] of Object.entries(this.event.headers)) {
      if (value == null) continue;
      this.headers.set(key.toLowerCase(), value);
    }
  }

  loadQueryString(): URLSearchParams {
    const ret = new URLSearchParams();
    if (this.event.queryStringParameters == null) return ret;

    for (const [key, value] of Object.entries(this.event.queryStringParameters)) {
      ret.append(key, value ?? 'true');
    }
    return ret;
  }

  get method(): string {
    return this.event.httpMethod.toUpperCase();
  }

  get path(): string {
    return this.event.path;
  }

  get body(): string | null {
    return this.event.body;
  }

  get isBase64Encoded(): boolean {
    return this.event.isBase64Encoded;
  }
}
