declare module 'hyperx-cloud-flight-wireless' {
  import { EventEmitter } from 'events';

  interface HyperXDevice extends EventEmitter {
    on(event: 'battery', listener: (level: number) => void): this;
    on(event: 'power', listener: (state: 'on' | 'off') => void): this;
    on(event: 'muted', listener: (muted: boolean) => void): this;
    on(event: 'volume', listener: (volume: number) => void): this;
    on(event: 'charging', listener: (charging: boolean) => void): this;
    on(event: 'connected', listener: () => void): this;
    on(event: 'disconnected', listener: (reason?: string) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    close(): void;
  }

  interface HyperXOptions {
    debug?: boolean;
    updateDelay?: number;
  }

  function createHyperX(options?: HyperXOptions): HyperXDevice;

  export = createHyperX;
}
