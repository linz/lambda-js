import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { URLSearchParams } from 'url';
import { LambdaHttpRequest, HttpRequestEvent } from './request';
import { LambdaHttpResponse } from './response';

export class LambdaApiGatewayRequest extends LambdaHttpRequest<APIGatewayEvent, APIGatewayProxyResultV2> {
  static is(x: HttpRequestEvent): x is APIGatewayEvent {
    return 'requestContext' in x && 'apiId' in x['requestContext'];
  }

  toResponse(res: LambdaHttpResponse): APIGatewayProxyResultV2 {
    return {
      statusCode: res.status,
      body: res.getBody(),
      headers: this.toHeaders(res),
      isBase64Encoded: res.isBase64Encoded,
    };
  }

  toHeaders(res: LambdaHttpResponse): Record<string, string> | undefined {
    if (res.headers.size === 0) return undefined;

    const obj: Record<string, string> = {};
    for (const prop of res.headers) obj[prop[0]] = prop[1];
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
    const query = new URLSearchParams();
    if (this.event.multiValueQueryStringParameters == null) return query;
    for (const [key, values] of Object.entries(this.event.multiValueQueryStringParameters)) {
      if (values == null) continue;
      for (const value of values) query.append(key, value);
    }
    return query;
  }

  get path(): string {
    return this.event.path;
  }

  get method(): string {
    return this.event.httpMethod.toUpperCase();
  }
}
