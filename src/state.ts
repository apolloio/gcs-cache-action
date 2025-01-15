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

export function saveState(state: State): void {
  core.debug(`[state.ts] Saving state: ${JSON.stringify(state)}.`);

  core.saveState('bucket', state.bucket);
  core.saveState('path', state.path);
  core.saveState('cache-hit-kind', state.cacheHitKind);
  core.saveState('skip-upload-on-hit', state.skipUploadOnHit);
  core.saveState('target-file-name', state.targetFileName);
  core.saveState('root-dir', state.rootDir);
}

// Action state is empty on post tasks sometimes, when that happens we'll use
// existing values from inputs
function stateOrInput(name: string): string {
  return core.getState(name) || core.getInput(name, { required: false });
}

export function getState(): State {
  return {
    path: stateOrInput('path'),
    bucket: stateOrInput('bucket'),
    cacheHitKind: stateOrInput('cache-hit-kind') as CacheHitKindState,
    skipUploadOnHit: stateOrInput('skip-upload-on-hit'),
    targetFileName: stateOrInput('target-file-name'),
    rootDir: stateOrInput('root-dir'),
  };
}
