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
  private lastEventTimestamp = 0;
  
  // Periodic health check to detect stale connections
  private healthCheckInterval: NodeJS.Timeout | undefined;
  private healthCheckPeriod = 60 * 1000; // Check every minute
  private deviceCheckPeriod = 5 * 60 * 1000; // Full reconnect every 5 minutes
  private lastReconnectTime = 0;
  
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
      this.startHealthCheck();
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      
      // If no more listeners, clean up the connection
      if (this.listeners.length === 0) {
        this.cleanup();
        this.stopHealthCheck();
      }
    };
  }

  private notifyListeners(event: HyperXEvent): void {
    // Update last event timestamp
    this.lastEventTimestamp = Date.now();
    
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
      
      // Create the hyperx instance with shorter updateDelay for more responsiveness
      this.hyperx = createHyperX();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Record the reconnect time
      this.lastReconnectTime = Date.now();
      
      streamDeck.logger.debug("HyperXService: Connected successfully");
      
    } catch (err) {
      streamDeck.logger.error("HyperXService: Connection error:", err);
      this.notifyListeners({ type: 'error', error: err });
    }
  }

  private setupEventListeners(): void {
    if (!this.hyperx) return;
    
    // Set up listeners for all event types
    const events = ["battery", "power", "muted", "volume", "charging", "unknown", "connected", "disconnected"];
    
    events.forEach(eventType => {
      try {
        this.hyperx.on(eventType, (...args: any[]) => {
          // Update timestamp for any event received
          this.lastEventTimestamp = Date.now();
          
          // Handle specific event types
          switch (eventType) {
            case "battery":
              streamDeck.logger.debug("HyperXService: Battery:", args[0]);
              this.notifyListeners({ type: 'battery', value: args[0] });
              break;
              
            case "power":
              streamDeck.logger.debug("HyperXService: Power:", args[0]);
              this.notifyListeners({ type: 'power', value: args[0] });
              break;
              
            case "muted":
              streamDeck.logger.debug("HyperXService: Muted:", args[0]);
              this.notifyListeners({ type: 'muted', value: args[0] });
              break;
              
            case "connected":
              streamDeck.logger.debug("HyperXService: Device connected");
              // If we were previously off, notify of power on
              if (this.lastKnownPowerState === 'off') {
                this.notifyListeners({ type: 'power', value: 'on' });
              }
              break;
              
            case "disconnected":
              streamDeck.logger.debug("HyperXService: Device disconnected", args[0]);
              break;
              
            default:
              // Just update timestamp for other events
              break;
          }
        });
      } catch (err) {
        streamDeck.logger.error(`HyperXService: Error setting up ${eventType} listener:`, err);
      }
    });
    
    // Error events handled separately
    try {
      this.hyperx.on("error", (err: any) => {
        streamDeck.logger.error("HyperXService: Error from library:", err);
        this.notifyListeners({ type: 'error', error: err });
      });
    } catch (err) {
      streamDeck.logger.error("HyperXService: Error setting up error listener:", err);
    }
  }
  
  // Start periodic health check
  private startHealthCheck(): void {
    this.stopHealthCheck(); // Clear existing interval if any
    
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastEvent = now - this.lastEventTimestamp;
      const timeSinceLastReconnect = now - this.lastReconnectTime;
      
      // If we haven't received events in a while, check device state more aggressively
      if (timeSinceLastEvent > this.healthCheckPeriod) {
        streamDeck.logger.debug(`HyperXService: Health check - No events for ${Math.round(timeSinceLastEvent/1000)}s`);
        
        // If it's been a while since our last full reconnect, do one now
        if (timeSinceLastReconnect > this.deviceCheckPeriod) {
          streamDeck.logger.debug("HyperXService: Performing periodic full reconnect");
          this.connect(); // This will recreate the connection
        }
      }
    }, this.healthCheckPeriod);
  }
  
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
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