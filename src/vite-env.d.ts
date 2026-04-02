/// <reference types="vite/client" />

declare module '*.module.css' {
  const content: Record<string, string> 
}

declare module '*.css' {
  const content: string;
  export default content;
}
