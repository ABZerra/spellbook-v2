/// <reference types="vite/client" />

declare const __STATIC_FALLBACK__: boolean;

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.svg?react' {
  import type { ComponentType, SVGProps } from 'react';
  const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
