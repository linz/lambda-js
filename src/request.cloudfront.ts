import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';
import { URLSearchParams } from 'url';
import { isRecord } from './request';
import { LambdaHttpRequest } from './request.http';
import { LambdaHttpResponse } from './response.http';

export class LambdaCloudFrontRequest extends LambdaHttpRequest<CloudFrontRequestEvent, CloudFrontRequestResult> {
  static is(x: unknown): x is CloudFrontRequestEvent {
    if (!isRecord(x)) return false;
    if (!Array.isArray(x['Records'])) return false;
    const firstRecord = x['Records'][0];
    if (!isRecord(firstRecord)) return false;
    return isRecord(firstRecord['cf']);
  }

  toResponse(res: LambdaHttpResponse): CloudFrontRequestResult {
    // Continue
    if (res.status === 100 && this.event != null) {
      const outRequest = this.event.Records[0].cf.request;
      for (const [key, value] of res.headers) {
        outRequest.headers[key.toLowerCase()] = [{ key, value: String(value) }];
      }
      return this.event.Records[0].cf.request;
    }

    return {
      status: String(res.status),
      statusDescription: res.statusDescription,
      body: res.body,
      headers: this.toHeaders(res),
      bodyEncoding: 'text',
    };
  }

  toHeaders(res: LambdaHttpResponse): Record<string, { key: string; value: string }[]> | undefined {
    if (res.headers.size === 0) return {};
    const obj: Record<string, { key: string; value: string }[]> = {};
    for (const prop of res.headers) obj[prop[0]] = [{ key: prop[0], value: String(prop[1]) }];
    return obj;
  }

  loadHeaders(): void {
    for (const [key, value] of Object.entries(this.event.Records[0].cf.request.headers)) {
      this.headers.set(key.toLowerCase(), value[0]?.value);
    }
  }

  loadQueryString(): URLSearchParams {
    const query = this.event.Records[0].cf.request.querystring;
    if (query == null || query[0] == null) return new URLSearchParams();
    return new URLSearchParams(query[0] === '?' ? query.substr(1) : query);
  }

  get path(): string {
    return this.event.Records[0].cf.request.uri;
  }

  get method(): string {
    return this.event.Records[0].cf.request.method.toUpperCase();
  }

  get body(): string | null {
    const body = this.event.Records[0].cf.request.body;
    if (body == null) return null;
    return body.data;
  }

  get isBase64Encoded(): boolean {
    return this.event.Records[0].cf.request.body?.encoding === 'base64';
  }
}
