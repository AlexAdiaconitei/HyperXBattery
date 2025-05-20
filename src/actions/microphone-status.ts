// microphone-status-action.ts
import path from "path";
import { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { HyperXService, HyperXEvent } from "../lib/hyperx-service";

const __dirname = import.meta.dirname;

const icons: { [k: string]: string } = {
  disconnected: "disconnected.png",
  muted:        "muted.png",
  unmuted:      "unmuted.png",
};

@action({ UUID: "com.alexadiaconitei.hyperxbattery.microphone" })
export class MicrophoneStatusAction extends SingletonAction {
  private unsubscribe: (() => void) | undefined;
  private currentEvent: WillAppearEvent | undefined;
  private isMuted: boolean = false;

  override onWillAppear(ev: WillAppearEvent): void {
    this.currentEvent = ev;
    
    // Set initial state
    ev.action.setImage(path.join(__dirname, "..", "imgs/actions/microphone-status", icons.unmuted));
    
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
      case 'muted':
        this.isMuted = event.value;
        const key = this.isMuted ? "muted" : "unmuted";
        ev.action.setImage(path.join(__dirname, "..", "imgs/actions/microphone-status", icons[key]));
        break;
        
      case 'power':
        if (event.value === "off") {
          ev.action.setImage(path.join(__dirname, "..", "imgs/actions/microphone-status", icons.disconnected));
        } else if (event.value === "on") {
          // When power is restored, set an intermediate state until we receive a muted event
          ev.action.setImage(path.join(__dirname, "..", "imgs/actions/microphone-status", icons.unmuted));
          
          // The muted status should be updated shortly after power is restored
          // via the 'muted' event, but this provides immediate feedback
        }
        break;
        
      case 'error':
        ev.action.setImage(path.join(__dirname, "..", "imgs/actions/microphone-status", icons.disconnected));
        break;
    }
  }
}