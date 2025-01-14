import * as core from '@actions/core';
import * as fs from 'fs';

export type CacheHitKindState = 'exact' | 'partial' | 'none';

function readStateFile() {
  const path = process.env['GITHUB_STATE'];
  if (!path) {
    core.debug('readStateFile path is empty');
    return;
  }
  core.info(`readFile path ${path}`);
  try {
    const data = fs.readFileSync(path, 'utf8');
    core.info(`readFile data: ${data}`);
  } catch (err) {
    console.error(err);
  }
  [
    'STATE_path',
    'STATE_bucket',
    'STATE_cache-hit-kind',
    'STATE_skip-upload-on-hit',
    'STATE_target-file-name',
    'STATE_root-dir',
  ].forEach((name) => {
    core.info(`process.env[${name}]: ${process.env[name] || ''}`);
  });
}

export interface State {
  path: string;
  bucket: string;
  cacheHitKind: CacheHitKindState;
  skipUploadOnHit: string;
  targetFileName: string;
  rootDir: string;
}

export function saveState(state: State): void {
  core.info(`[state.ts] Saving state: ${JSON.stringify(state)}.`);

  core.saveState('bucket', state.bucket);
  core.saveState('path', state.path);
  core.saveState('cache-hit-kind', state.cacheHitKind);
  core.saveState('skip-upload-on-hit', state.skipUploadOnHit);
  core.saveState('target-file-name', state.targetFileName);
  core.saveState('root-dir', state.rootDir);

  core.info(`[state.ts saveState] readStateFile`);
  readStateFile();
}

export function getState(): State {
  const state = {
    path: core.getState('path'),
    bucket: core.getState('bucket'),
    cacheHitKind: core.getState('cache-hit-kind') as CacheHitKindState,
    skipUploadOnHit: core.getState('skip-upload-on-hit'),
    targetFileName: core.getState('target-file-name'),
    rootDir: core.getState('root-dir'),
  };

  core.info(`[state.ts getState] readStateFile`);
  readStateFile();

  return state;
}
