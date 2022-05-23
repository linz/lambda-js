export const ApplicationJson = 'application/json';

/** Common http headers */
export enum HttpHeader {
  CacheControl = 'Cache-Control',
  ContentEncoding = 'Content-Encoding',
  ContentType = 'Content-Type',
  Cors = 'Access-Control-Allow-Origin',
  ETag = 'ETag',
  IfNoneMatch = 'If-None-Match',
  Server = 'Server',
  ServerTiming = 'Server-Timing',
}

/** Amazon specific headers */
export enum HttpHeaderAmazon {
  CloudfrontId = 'X-Amz-Cf-Id',
  TraceId = 'X-Amzn-Trace-Id',
}

export enum HttpHeaderRequestId {
  CorrelationId = 'X-LINZ-Correlation-Id',
  RequestId = 'X-LINZ-Request-Id',
}
