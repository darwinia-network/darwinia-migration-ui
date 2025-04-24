import { Timeout } from 'node:timers';

declare global {
  // Make NodeJS.Timer compatible with clearInterval
  interface Timer extends Timeout {}

  // Add namespace for Node.js process environment
  namespace NodeJS {
    interface ProcessEnv {
      // Adding this to suppress findDOMNode deprecation warnings
      REACT_APP_SUPPRESS_DEPRECATED_WARNING?: string;
    }
  }
}

// This export is needed to make this a module
export {};
