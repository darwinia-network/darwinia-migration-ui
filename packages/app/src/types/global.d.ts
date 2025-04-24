import { Timeout } from "node:timers";

declare global {
  // Make NodeJS.Timer compatible with clearInterval
  interface Timer extends Timeout {}
}

// This export is needed to make this a module
export {};
