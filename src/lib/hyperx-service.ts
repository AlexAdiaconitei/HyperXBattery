import { createRequire } from 'module';
import streamDeck from "@elgato/streamdeck";

const require = createRequire(import.meta.url);

// Event types
export type BatteryEvent = { type: 'battery'; value: number };
export type PowerEvent = { type: 'power'; value: 'on' | 'off' };
export type MutedEvent = { type: 'muted'; value: boolean };
export type ErrorEvent = { type: 'error'; error: any };
export type HyperXEvent = BatteryEvent | PowerEvent | MutedEvent | ErrorEvent;

export class HyperXService {
  private static instance: HyperXService;
  private hyperx: any | undefined;
  private listeners: ((event: HyperXEvent) => void)[] = [];
  private lastKnownPowerState: 'on' | 'off' | null = null;
  private lastKnownMuteState: boolean | null = null;
  private debug = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): HyperXService {
    if (!HyperXService.instance) {
      HyperXService.instance = new HyperXService();
    }
    return HyperXService.instance;
  }

  public subscribe(listener: (event: HyperXEvent) => void): () => void {
    this.listeners.push(listener);
    
    // If not connected, attempt to connect
    if (!this.hyperx) {
      this.connect();
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      
      // If no more listeners, clean up the connection
      if (this.listeners.length === 0) {
        this.cleanup();
      }
    };
  }

  private notifyListeners(event: HyperXEvent): void {
    // Update state tracking
    if (event.type === 'power') {
      this.lastKnownPowerState = event.value;
    } else if (event.type === 'muted') {
      this.lastKnownMuteState = event.value;
    }
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        streamDeck.logger.error("HyperXService: Error in listener callback:", err);
      }
    });
  }

  private connect(): void {
    streamDeck.logger.debug("HyperXService: Connecting to headset...");
    
    try {
      // Ensure we clean up any existing connection first
      this.cleanup();
      
      // Import the library (which now handles reconnection internally)
      const createHyperX = require('hyperx-cloud-flight-wireless');
      
      // Create the hyperx instance with default options
      this.hyperx = createHyperX();
      
      // Set up event listeners
      this.setupEventListeners();
      
      streamDeck.logger.debug("HyperXService: Connected successfully");
      
    } catch (err) {
      streamDeck.logger.error("HyperXService: Connection error:", err);
      this.notifyListeners({ type: 'error', error: err });
    }
  }

  private setupEventListeners(): void {
    if (!this.hyperx) return;
    
    // Battery events
    this.hyperx.on("battery", (pct: number) => {
      streamDeck.logger.debug("HyperXService: Battery:", pct);
      this.notifyListeners({ type: 'battery', value: pct });
    });

    // Power events
    this.hyperx.on("power", (state: "on" | "off") => {
      streamDeck.logger.debug("HyperXService: Power:", state);
      this.notifyListeners({ type: 'power', value: state });
    });

    // Mute events
    this.hyperx.on("muted", (isMuted: boolean) => {
      streamDeck.logger.debug("HyperXService: Muted:", isMuted);
      this.notifyListeners({ type: 'muted', value: isMuted });
    });

    // Error events
    this.hyperx.on("error", (err: any) => {
      streamDeck.logger.error("HyperXService: Error from library:", err);
      this.notifyListeners({ type: 'error', error: err });
    });
    
    // Connected events - can be useful for UI updates
    this.hyperx.on("connected", () => {
      streamDeck.logger.debug("HyperXService: Device connected");
    });
    
    // Disconnected events - can be useful for UI updates
    this.hyperx.on("disconnected", (err: any) => {
      streamDeck.logger.debug("HyperXService: Device disconnected", err);
    });
  }

  private cleanup(): void {
    if (this.hyperx) {
      streamDeck.logger.debug("HyperXService: Cleaning up connection");
      
      try {
        // Call the close method which should clean up everything
        if (typeof this.hyperx.close === 'function') {
          this.hyperx.close();
        }
      } catch (err) {
        streamDeck.logger.error("HyperXService: Error during close:", err);
      }
      
      this.hyperx = undefined;
    }
  }
}