import * as core from '@actions/core';

export type CacheHitKindState = 'exact' | 'partial' | 'none';

export interface State {
  path: string;
  bucket: string;
  cacheHitKind: CacheHitKindState;
  skipUploadOnHit: string;
  targetFileName: string;
  rootDir: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export function saveState(state: State): void {
  core.debug(`[state.ts] Saving state: ${JSON.stringify(state)}.`);

  core.saveState('bucket', state.bucket);
  core.saveState('path', state.path);
  core.saveState('cache-hit-kind', state.cacheHitKind);
  core.saveState('skip-upload-on-hit', state.skipUploadOnHit);
  core.saveState('target-file-name', state.targetFileName);
  core.saveState('root-dir', state.rootDir);
}

export async function getState(): Promise<State> {
  const state: State = {
    path: '',
    bucket: '',
    cacheHitKind: 'none',
    skipUploadOnHit: '',
    targetFileName: '',
    rootDir: '',
  };

  // Action state is empty on post tasks sometimes, so we're retrying to see
  // see if it's an environment synchronization issue
  for (let attempt = 1; attempt < 5; attempt++) {
    state.path = core.getState('path');
    state.bucket = core.getState('bucket');
    state.cacheHitKind = core.getState('cache-hit-kind') as CacheHitKindState;
    state.skipUploadOnHit = core.getState('skip-upload-on-hit');
    state.targetFileName = core.getState('target-file-name');
    state.rootDir = core.getState('root-dir');

    if (state.rootDir) {
      break;
    }
    core.warning(`[state.ts] Failed to get state on attempt ${attempt}/5`);
    await sleep(attempt * 100);
  }

  return state;
}
