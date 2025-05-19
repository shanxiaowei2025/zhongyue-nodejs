declare module 'json2csv' {
  export interface Options<T = any> {
    fields?: Array<string | { label: string; value: string }>;
    ndjson?: boolean;
    delimiter?: string;
    eol?: string;
    header?: boolean;
    includeEmptyRows?: boolean;
    withBOM?: boolean;
    transforms?: Array<(item: T) => any>;
  }

  export class Parser<T = any> {
    constructor(options?: Options<T>);
    parse(data: T[] | T): string;
    parseAsync(data: T[] | T): Promise<string>;
  }

  export function parse<T = any>(data: T[] | T, options?: Options<T>): string;
  export function parseAsync<T = any>(data: T[] | T, options?: Options<T>): Promise<string>;
} 