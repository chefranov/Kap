#!/usr/bin/env bash
# Builds the Swift helper binaries in this directory as universal (x86_64 + arm64)
# executables and puts them into native/bin. Requires Xcode (or Command Line Tools).
#
#   ./native/build.sh          # build everything
#   ./native/build.sh open-with # build a single package
set -euo pipefail

cd "$(dirname "$0")"

# Minimum macOS version per slice. Newer SDKs refuse old deployment targets
# (the macOS 27 SDK requires >= 12.0); to keep the Intel slice at 10.14 build with
# an older SDK, e.g. DEVELOPER_DIR=/Library/Developer/CommandLineTools ./native/build.sh
X64_TRIPLE="x86_64-apple-macosx${MACOS_X64_MIN:-10.14}"
ARM64_TRIPLE="arm64-apple-macosx${MACOS_ARM64_MIN:-11.0}"

# <package dir>:<product name>
packages=(
  "open-with:open-with"
  "mac-windows:mac-windows"
  "activate-window:activate-window"
  "get-app-icon:get-app-icon"
  "audio-devices:audio-devices"
)

mkdir -p bin

for entry in "${packages[@]}"; do
  package="${entry%%:*}"
  product="${entry##*:}"

  if [[ $# -gt 0 && "$1" != "$package" ]]; then
    continue
  fi

  echo "▸ Building $package"
  (
    cd "$package"
    swift build -c release --triple "$X64_TRIPLE" >/dev/null
    swift build -c release --triple "$ARM64_TRIPLE" >/dev/null
    lipo -create \
      ".build/x86_64-apple-macosx/release/$product" \
      ".build/arm64-apple-macosx/release/$product" \
      -output "../bin/$product"
    strip -x "../bin/$product"
  )
  file "bin/$product"
done
