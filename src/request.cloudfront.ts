import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';
import { LambdaHttpRequest, HttpRequestEvent } from './request';
import { LambdaHttpResponse } from './response';
import { URLSearchParams } from 'url';

export class LambdaCloudFrontRequest extends LambdaHttpRequest<CloudFrontRequestEvent, CloudFrontRequestResult> {
  static is(x: HttpRequestEvent): x is CloudFrontRequestEvent {
    return 'Records' in x && Array.isArray(x['Records']);
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
      body: res.getBody(),
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
}
