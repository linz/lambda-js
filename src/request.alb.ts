import { ALBEvent, ALBResult } from 'aws-lambda';
import { URLSearchParams } from 'url';
import { HttpRequestEvent, LambdaHttpRequest } from './request';
import { LambdaHttpResponse } from './response';

export class LambdaAlbRequest extends LambdaHttpRequest<ALBEvent, ALBResult> {
  static is(x: HttpRequestEvent): x is ALBEvent {
    return 'requestContext' in x && 'elb' in x['requestContext'];
  }

  toResponse(res: LambdaHttpResponse): ALBResult {
    return {
      statusCode: res.status,
      statusDescription: res.statusDescription,
      body: res.getBody(),
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

  get method(): string {
    return this.event.httpMethod.toUpperCase();
  }

  get path(): string {
    return this.event.path;
  }

  loadQueryString(): URLSearchParams {
    return new URLSearchParams(this.event.queryStringParameters);
  }
}
