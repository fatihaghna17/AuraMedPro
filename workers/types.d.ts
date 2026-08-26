// Global types for Cloudflare Pages Functions and R2
declare interface R2Bucket {
  put(key: string, value: any, options?: any): Promise<any>;
  get(key: string, options?: any): Promise<any>;
  delete(key: string | string[]): Promise<any>;
}

declare type PagesFunction<
  Env = unknown,
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (
  context: {
    request: Request;
    functionPath: string;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    params: Record<Params, string | string[]>;
    data: Data;
    env: Env;
    waitUntil: (promise: Promise<any>) => void;
    passThroughOnException: () => void;
  }
) => Response | Promise<Response>;
