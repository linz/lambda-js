import { ApplicationJson, HttpHeader, RequestIdHeaders } from './header';

export class LambdaHttpResponse {
  /** Http status code */
  public status: number;
  /** Text description for the status code */
  public statusDescription: string;
  /** Raw body object */
  body: string | Buffer | null = null;

  headers: Map<string, string> = new Map();

  static is(x: unknown): x is LambdaHttpResponse {
    return x instanceof LambdaHttpResponse;
  }

  public constructor(status: number, description: string, headers?: Record<string, string>) {
    this.status = status;
    this.statusDescription = description;
    if (headers != null) {
      for (const key of Object.keys(headers)) this.header(key, headers[key]);
    }
  }

  /** Fetch a header (case insensitive) */
  header(key: string): string | undefined;
  header(key: string, value: string): void;
  header(key: string, value?: string): string | undefined | void {
    const headerKey = key.toLowerCase();
    if (value == null) return this.headers.get(headerKey);
    this.headers.set(headerKey, value);
  }

  /** Is the response base 64 encoded */
  public get isBase64Encoded(): boolean {
    return Buffer.isBuffer(this.body);
  }

  /** Set a JSON output */
  json(obj: Record<string, unknown>): void {
    this.buffer(JSON.stringify(obj), ApplicationJson);
  }

  /** Set the output type and the Content-Type header */
  buffer(buf: Buffer | string, contentType = ApplicationJson): void {
    this.header(HttpHeader.ContentType, contentType);
    this.body = buf;
  }

  getBody(): string {
    if (this.body == null) {
      this.header(HttpHeader.ContentType, ApplicationJson);
      return JSON.stringify({
        id: this.header(RequestIdHeaders.RequestId),
        status: this.status,
        message: this.statusDescription,
        correlationId: this.header(RequestIdHeaders.CorrelationId),
      });
    }

    if (Buffer.isBuffer(this.body)) return this.body.toString('base64');
    return this.body;
  }
}
