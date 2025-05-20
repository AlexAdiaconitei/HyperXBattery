// battery-status-action.ts
import path from "path";
import { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { HyperXService, HyperXEvent } from "../lib/hyperx-service";

const __dirname = import.meta.dirname;

const icons: { [k: string]: string } = {
  disconnected: "disconnected.png",
  empty:        "empty.png",
  low:          "low.png",
  half:         "half.png",
  high:         "high.png",
  full:         "full.png",
  charging:     "charging.png",
};

@action({ UUID: "com.alexadiaconitei.hyperxbattery.battery" })
export class BatteryStatusAction extends SingletonAction {
  private unsubscribe: (() => void) | undefined;
  private currentEvent: WillAppearEvent | undefined;

  override onWillAppear(ev: WillAppearEvent): void {
    this.currentEvent = ev;
    
    // Set initial state
    ev.action.setImage(path.join(__dirname, "..", "imgs/actions/battery-status", icons.disconnected));
    ev.action.setTitle("?");
    
    // Subscribe to HyperX service events
    this.unsubscribe = HyperXService.getInstance().subscribe(this.handleEvent.bind(this));
  }
  
  override onWillDisappear(_ev: WillDisappearEvent): void {
    // Clean up subscription when key is no longer visible
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.currentEvent = undefined;
  }
  
  private handleEvent(event: HyperXEvent): void {
    if (!this.currentEvent) return;
    
    const ev = this.currentEvent;
    
    switch (event.type) {
      case 'battery':
        const pct = event.value;
        // choose appropriate icon
        let key = pct < 5   ? "empty"
                : pct < 45  ? "low"
                : pct < 55  ? "half"
                : pct < 95  ? "high"
                :             "full";

        // update Stream Deck key image & title
        ev.action.setImage(path.join(__dirname, "..", "imgs/actions/battery-status", icons[key]));
        ev.action.setTitle(`${pct}%`);
        break;
        
      case 'power':
        if (event.value === "off") {
          ev.action.setImage(path.join(__dirname, "..", "imgs/actions/battery-status", icons.disconnected));
          ev.action.setTitle("");
        } else if (event.value === "on") {
          // When power is restored, set an intermediate state until we receive a battery event
          // Use a generic "connecting" state
          ev.action.setImage(path.join(__dirname, "..", "imgs/actions/battery-status", icons.half)); // Using half as a neutral indicator
          ev.action.setTitle("...");
          
          // The battery status should be updated shortly after power is restored
          // via the 'battery' event, but this provides immediate feedback
        }
        break;
        
      case 'error':
        ev.action.setImage(path.join(__dirname, "..", "imgs/actions/battery-status", icons.disconnected));
        ev.action.setTitle("");
        break;
    }
  }
}