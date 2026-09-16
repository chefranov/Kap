# Native helpers

Small Swift command-line helpers used by the main process, shipped as universal (x86_64 + arm64) binaries in `bin/`. They replace npm packages that only shipped x86_64 binaries and no longer run on Apple Silicon without Rosetta:

| Helper | Replaces | Used by |
| --- | --- | --- |
| `open-with` | [mac-open-with](https://github.com/karaggeorge/mac-open-with) | `main/utils/open-with.ts` |
| `mac-windows`, `activate-window` | [mac-windows](https://github.com/karaggeorge/mac-windows) | `main/utils/mac-windows.ts` |
| `get-app-icon` | [node-mac-app-icon](https://github.com/sallar/node-mac-app-icon) ([GetAppIcon](https://github.com/sallar/GetAppIcon)) | `main/utils/mac-windows.ts` |
| `audio-devices` | [macos-audio-devices](https://github.com/karaggeorge/macos-audio-devices) | `main/utils/audio-devices.ts` |

All of them are MIT licensed; the original license files are kept next to the sources.

## Rebuilding

```sh
./native/build.sh              # all helpers
./native/build.sh open-with    # a single one
```

Requires Xcode or the Command Line Tools. The binaries are built once per architecture and merged with `lipo`. Newer SDKs refuse old deployment targets (the macOS 27 SDK needs >= 12.0), so to keep the Intel slice at 10.14 build with an older SDK, e.g.:

```sh
DEVELOPER_DIR=/Library/Developer/CommandLineTools ./native/build.sh
```

The minimum versions can be overridden with `MACOS_X64_MIN` and `MACOS_ARM64_MIN`.

The binaries are resolved through `main/utils/native-binaries.ts` and unpacked from the asar by the `asarUnpack` rule in `package.json`.
