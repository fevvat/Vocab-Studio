declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare namespace React {
  type ReactNode = any;
}

declare module 'react' {
  export type ReactNode = any;
  export type ChangeEvent<T = any> = any;
  export function useState<T = any>(initialState: T): [T, (value: T | ((prev: T) => T)) => void];
  export function useMemo<T>(factory: () => T, deps: any[]): T;
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

declare module 'next' {
  export type Metadata = any;
  export type NextConfig = any;
}

declare module 'next/link' {
  const Link: any;
  export default Link;
}

declare module 'next/navigation' {
  export function notFound(): never;
}

declare module 'next/server' {
  export const NextResponse: any;
  export type NextRequest = any;
}

declare module 'tesseract.js' {
  export function createWorker(...args: any[]): Promise<any>;
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const version: string;
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(args: any): any;
}

declare module 'fs' {
  export const promises: any;
}

declare module 'path' {
  const path: any;
  export default path;
}

declare const process: any;
