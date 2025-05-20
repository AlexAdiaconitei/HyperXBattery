import path from "path";
import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
const __dirname  = import.meta.dirname;

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const icons: { [k: string]: string } = {
  disconnected: "disconnected.png",
  empty:        "empty.png",
  low:          "low.png",
  half:         "half.png",
  high:         "high.png",
  full:         "full.png",
  charging:     "charging.png",
};

@action({ UUID: "com.alexadiaconitei.hyperxbattery.status" })
export class BatteryStatusAction extends SingletonAction {
  private hyperx: any | undefined;

  override onWillAppear(ev: WillAppearEvent): void {
    streamDeck.logger.debug("HyperX:", this.hyperx);
    if (this.hyperx) return; // already running

    // instantiate HyperX monitor
    try {
      let createHyperX = require('hyperx-cloud-flight-wireless');
      this.hyperx = createHyperX({ debug: false, updateDelay: 3 * 1000 });
    } catch (err) {
      this.errorHandler(err, ev);
      return;
    }
    // battery updates
    this.hyperx.on("battery", (pct: number) => {
      streamDeck.logger.debug("Battery:", pct);
      // choose appropriate icon
      let key = pct < 5   ? "empty"
              : pct < 45  ? "low"
              : pct < 55  ? "half"
              : pct < 95  ? "high"
              :              "full";

      // update Stream Deck key image & title
      ev.action.setImage(path.join(__dirname, "..", "imgs/actions/battery-status", icons[key]));
      ev.action.setTitle(`${pct}%`);
    });

    this.hyperx.on("power", (state: "on" | "off") => {
      if (state === "off") {
        ev.action.setImage(path.join(__dirname, "..", "imgs/actions/battery-status", icons.disconnected));
        ev.action.setTitle("Off");
        this.hyperx!.clearListeners();
        this.hyperx = undefined;
        // re-invoke onWillAppear after a delay to pick up reconnect
        setTimeout(() => this.onWillAppear(ev), 3_000);
      } else {
        streamDeck.logger.debug("HyperX reconnected");
      }
    });

    // error handling
    this.hyperx.on("error", (err: any) => {
      this.errorHandler(err, ev);
    });
  }

  errorHandler(err: any, ev: WillAppearEvent) {
    streamDeck.logger.error("HyperX error:", err);
      ev.action.setImage(path.join(__dirname, "..", "imgs/actions/battery-status", icons.disconnected));
      ev.action.setTitle("");
      this.hyperx?.clearListeners();
      this.hyperx = undefined;
      // re-invoke onWillAppear after a delay to pick up reconnect
      setTimeout(() => this.onWillAppear(ev), 3_000);
  }
}
