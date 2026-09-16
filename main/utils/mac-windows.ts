import execa from 'execa';
import {nativeBinary} from './native-binaries';

// Wrappers around the `mac-windows`, `activate-window` and `get-app-icon` helpers
// (native/*, formerly the `mac-windows` and `node-mac-app-icon` packages)

export interface MacWindow {
  pid: number;
  ownerName: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  number: number;
}

export const getWindows = async ({onScreenOnly = true, showAllWindows = false} = {}): Promise<MacWindow[]> => {
  try {
    const {stdout} = await execa(nativeBinary('mac-windows'), [String(onScreenOnly)]);
    const windows: MacWindow[] = JSON.parse(stdout);

    if (showAllWindows) {
      return windows;
    }

    // Keep one window per app, preferring the first one that has a title
    return windows.filter((win, index) => {
      const firstWithName = windows.findIndex(w => w.name && w.ownerName === win.ownerName);
      return firstWithName === -1 ? windows.findIndex(w => w.ownerName === win.ownerName) === index : firstWithName === index;
    });
  } catch {
    return [];
  }
};

export const activateWindow = async (ownerName: string) => {
  await execa(nativeBinary('activate-window'), [ownerName]);
};

const getAppIconByPid = async (pid: number, size: number) => {
  const {stdout} = await execa(nativeBinary('get-app-icon'), [String(pid), '--size', String(size), '--encoding', 'buffer'], {encoding: null});
  return stdout;
};

export const getAppIconListByPid = async (pids: number[], {size = 32} = {}) => Promise.all(
  pids.map(async pid => ({
    pid,
    icon: await getAppIconByPid(pid, size).catch(() => undefined)
  }))
);
