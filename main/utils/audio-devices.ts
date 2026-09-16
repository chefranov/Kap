import execa from 'execa';
import {nativeBinary} from './native-binaries';

// Wrapper around the `audio-devices` helper (native/audio-devices, formerly the `macos-audio-devices` package)
const binary = nativeBinary('audio-devices');

export interface AudioDevice {
  id: number;
  uid: string;
  name: string;
  isInput: boolean;
  isOutput: boolean;
  transportType: string;
}

const parseStdout = ({stdout, stderr}: {stdout: string; stderr: string}) => {
  if (stderr) {
    throw new Error(stderr);
  }

  return JSON.parse(stdout);
};

export const getInputDevices = async (): Promise<AudioDevice[]> => parseStdout(await execa(binary, ['list', '--input', '--json']));

export const getDefaultInputDeviceSync = (): AudioDevice => parseStdout(execa.sync(binary, ['input', 'get', '--json']));
