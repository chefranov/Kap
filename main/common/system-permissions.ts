import {systemPreferences, shell, dialog, app, desktopCapturer} from 'electron';
import {existsSync, mkdirSync, writeFileSync} from 'fs';
import path from 'path';
import macosVersion from 'macos-version';
const {ensureDockIsShowing} = require('../utils/dock');

let isDialogShowing = false;

const promptSystemPreferences = (options: {message: string; detail: string; systemPreferencesPath: string}) => async ({hasAsked}: {hasAsked?: boolean} = {}) => {
  if (hasAsked || isDialogShowing) {
    return false;
  }

  isDialogShowing = true;
  await ensureDockIsShowing(async () => {
    const {response} = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Open System Preferences', 'Cancel'],
      defaultId: 0,
      message: options.message,
      detail: options.detail,
      cancelId: 1
    });
    isDialogShowing = false;

    if (response === 0) {
      await openSystemPreferences(options.systemPreferencesPath);
      app.quit();
    }
  });

  return false;
};

export const openSystemPreferences = async (path: string) => shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?${path}`);

// Microphone

const getMicrophoneAccess = () => systemPreferences.getMediaAccessStatus('microphone');

const microphoneFallback = promptSystemPreferences({
  message: 'Kap cannot access the microphone.',
  detail: 'Kap requires microphone access to be able to record audio. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.',
  systemPreferencesPath: 'Privacy_Microphone'
});

export const ensureMicrophonePermissions = async (fallback = microphoneFallback) => {
  const access = getMicrophoneAccess();

  if (access === 'granted') {
    return true;
  }

  if (access !== 'denied') {
    const granted = await systemPreferences.askForMediaAccess('microphone');

    if (granted) {
      return true;
    }

    return fallback({hasAsked: true});
  }

  return fallback();
};

export const hasMicrophoneAccess = () => getMicrophoneAccess() === 'granted';

// Screen Capture (10.15 and newer)

const screenCapturePermissionExists = macosVersion.isGreaterThanOrEqualTo('10.15');

// Same marker file the `mac-screen-capture-permissions` package used, so existing installs don't get prompted twice
const hasPromptedFilePath = path.join(app.getPath('userData'), '.has-app-requested-screen-capture-permissions');

const hasPromptedForScreenCapturePermission = () => existsSync(hasPromptedFilePath);

const markScreenCapturePermissionPrompted = () => {
  mkdirSync(path.dirname(hasPromptedFilePath), {recursive: true});
  writeFileSync(hasPromptedFilePath, '');
};

// The system prompt is only shown once per app by macOS; afterwards the user has to enable Kap in System Preferences manually.
// Electron has no `askForMediaAccess('screen')`, but enumerating screen sources triggers the prompt.
const requestScreenCaptureAccess = () => {
  desktopCapturer.getSources({types: ['screen'], thumbnailSize: {width: 1, height: 1}}).catch(() => {
    // Ignore, we only care about the side effect of macOS showing the prompt
  });
};

const screenCaptureFallback = promptSystemPreferences({
  message: 'Kap cannot record the screen.',
  detail: 'Kap requires screen capture access to be able to record the screen. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.',
  systemPreferencesPath: 'Privacy_ScreenCapture'
});

export const hasScreenCaptureAccess = () => !screenCapturePermissionExists || systemPreferences.getMediaAccessStatus('screen') === 'granted';

export const ensureScreenCapturePermissions = (fallback = screenCaptureFallback) => {
  if (hasScreenCaptureAccess()) {
    return true;
  }

  const hadAsked = hasPromptedForScreenCapturePermission();

  if (!hadAsked) {
    requestScreenCaptureAccess();
    markScreenCapturePermissionPrompted();
  }

  fallback({hasAsked: !hadAsked});
  return false;
};
