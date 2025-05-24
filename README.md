# 🎧 HyperX Battery & Mic Status for Stream Deck 🎮

A Stream Deck plugin that displays the battery level and microphone status of your HyperX Cloud Flight headset directly on your Stream Deck.

![GitHub repo](https://img.shields.io/badge/GitHub-AlexAdiaconitei%2FHyperXBattery-blue?logo=github)
![Current Status](https://img.shields.io/badge/status-working-brightgreen)
![Supported Device](https://img.shields.io/badge/supports-HyperX%20Cloud%20Flight-red)

## ✨ Features

- 🔋 **Real-time battery monitoring** - See your headset's battery percentage at a glance
- 🎤 **Microphone status** - Instantly know if your mic is muted or active
- 🔌 **Connection status** - Visual indicator when your headset is disconnected
- 🎨 **Intuitive visuals** - Different icons for various battery levels and microphone states

## 📥 Installation

1. Download the latest release from the [GitHub repository](https://github.com/AlexAdiaconitei/HyperXBattery/releases)
2. Double-click the downloaded file to install it on your Stream Deck
3. Drag the Battery Status and/or Microphone Status actions to your desired keys

## 🎯 Usage

### Battery Status Action

This action displays your HyperX Cloud Flight's current battery level with both a visual icon and percentage text.

#### Battery States:

| State | Icon | Description |
|-------|------|-------------|
| Full | ![Full](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/battery-status/full.png) | Battery level is 95% or higher |
| High | ![High](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/battery-status/high.png) | Battery level between 55% and 94% |
| Half | ![Half](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/battery-status/half.png) | Battery level between 45% and 54% |
| Low | ![Low](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/battery-status/low.png) | Battery level between 5% and 44% |
| Empty | ![Empty](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/battery-status/empty.png) | Battery level below 5% |
| Disconnected | ![Disconnected](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/battery-status/disconnected.png) | Headset is disconnected or powered off |

### Microphone Status Action

This action displays whether your headset's microphone is currently muted or active.

#### Microphone States:

| State | Icon | Description |
|-------|------|-------------|
| Unmuted | ![Unmuted](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/microphone-status/unmuted.png) | Microphone is active and transmitting audio |
| Muted | ![Muted](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/microphone-status/muted.png) | Microphone is muted |
| Disconnected | ![Disconnected](com.alexadiaconitei.hyperxbattery.sdPlugin/imgs/actions/microphone-status/disconnected.png) | Headset is disconnected or powered off |

## 🔧 Technical Details

The plugin connects to your HyperX Cloud Flight headset through a custom service that monitors its status. Key technical components:

- Written in TypeScript using the Elgato Stream Deck SDK
- Uses a singleton pattern for the HyperX service to maintain a single connection
- Updates icons and text in real-time as events are received
- Properly cleans up resources when actions are no longer visible
- Uses [AlexAdiaconitei/hyperx-cloud-flight-wireless](https://github.com/AlexAdiaconitei/hyperx-cloud-flight-wireless) to connect to the device.

## ⚠️ Compatibility

**Currently only supports the HyperX Cloud Flight headset.** Support for additional HyperX models may be added in future updates.

## 🤝 Contributing

Contributions are welcome! If you have a HyperX headset model that isn't currently supported, you can help by:

1. Forking the repository
2. Adding support for your headset model
3. Submitting a pull request

## 📜 License

This project is licensed under the [MIT License](LICENSE)

## 📫 Support & Contact

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/AlexAdiaconitei/HyperXBattery/issues)
- Contact me through GitHub

---

Made with ❤️ by [Alex Adiaconitei](https://github.com/AlexAdiaconitei)