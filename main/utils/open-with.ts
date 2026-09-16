import path from 'path';
import execa from 'execa';
import macosVersion from 'macos-version';
import {nativeBinary} from './native-binaries';

// Wrapper around the `open-with` helper (native/open-with, formerly the `mac-open-with` package)
const binary = nativeBinary('open-with');

// Launch Services returns the apps already sorted by relevance on 10.15+
const isAlreadySorted = macosVersion.isGreaterThanOrEqualTo('10.15');
const isSupported = macosVersion.isGreaterThanOrEqualTo('10.14.4');

export interface OpenWithApp {
  url: string;
  isDefault: boolean;
  icon: string;
}

const formatApps = (apps: OpenWithApp[]) => apps.filter(app => Boolean(app.url)).sort((a, b) => {
  if (a.isDefault !== b.isDefault) {
    return Number(b.isDefault) - Number(a.isDefault);
  }

  if (isAlreadySorted) {
    return 0;
  }

  if (a.url.includes('Applications') !== b.url.includes('Applications')) {
    return Number(b.url.includes('Applications')) - Number(a.url.includes('Applications'));
  }

  return path.parse(a.url).name.localeCompare(path.parse(b.url).name);
});

export const getAppsThatOpenExtensionSync = (extension: string): OpenWithApp[] => {
  if (!isSupported) {
    return [];
  }

  try {
    const {stdout} = execa.sync(binary, ['apps-for-extension', extension]);
    return formatApps(JSON.parse(stdout));
  } catch {
    return [];
  }
};

export const openFileWithApp = (filePath: string, appUrl: string) => {
  if (!isSupported) {
    return false;
  }

  try {
    execa.sync(binary, ['open', filePath, appUrl]);
    return true;
  } catch {
    return false;
  }
};
