import path from 'path';
import util from 'electron-util';

// Universal (x86_64 + arm64) helper binaries built from the Swift sources in `native/`.
// See `native/build.sh` for how to rebuild them.
const binDir = util.fixPathForAsarUnpack(path.join(__dirname, '..', '..', 'native', 'bin'));

export const nativeBinary = (name: string) => path.join(binDir, name);
