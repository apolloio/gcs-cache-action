/* eslint-disable sonarjs/no-duplicate-string */

import * as exec from '@actions/exec';
import * as semver from 'semver';

const ZSTD_WITHOUT_LONG_VERSION = '1.3.2';

export enum CompressionMethod {
  GZIP = 'gzip',
  ZSTD_WITHOUT_LONG = 'zstd (without long)',
  ZSTD = 'zstd',
}

async function getTarCompressionMethod(): Promise<CompressionMethod> {
  if (process.platform === 'win32') {
    return CompressionMethod.GZIP;
  }

  const [zstdOutput, zstdVersion] = await exec
    .getExecOutput('zstd', ['--version'], {
      ignoreReturnCode: true,
      silent: true,
    })
    .then((out) => out.stdout.trim())
    .then((out) => {
      const extractedVersion = /v(\d+(?:\.\d+){0,})/.exec(out);
      return [out, extractedVersion ? extractedVersion[1] : null];
    })
    .catch(() => ['', null]);

  if (!zstdOutput?.toLowerCase().includes('zstd command line interface')) {
    return CompressionMethod.GZIP;
  } else if (
    !zstdVersion ||
    semver.lt(zstdVersion, ZSTD_WITHOUT_LONG_VERSION)
  ) {
    return CompressionMethod.ZSTD_WITHOUT_LONG;
  } else {
    return CompressionMethod.ZSTD;
  }
}

async function getSizeInBytes(path: string): Promise<number> {
  const stats = await import('fs/promises').then((fs) => fs.stat(path));
  return stats.size;
}

function humanFileSize(size: number): string {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  return (size / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

export async function createTar(
  archivePath: string,
  paths: string[],
  cwd: string,
): Promise<CompressionMethod> {
  const compressionMethod = await getTarCompressionMethod();
  console.log(`🔹 Using '${compressionMethod}' compression method.`);

  const compressionArgs =
    compressionMethod === CompressionMethod.GZIP
      ? ['-z']
      : compressionMethod === CompressionMethod.ZSTD_WITHOUT_LONG
      ? ['--use-compress-program', 'zstd -T0']
      : ['--use-compress-program', 'zstd -T0 --long=30'];

  await exec.exec('tar', [
    '-c',
    ...compressionArgs,
    '--posix',
    '-P',
    '-f',
    archivePath,
    '-C',
    cwd,
    ...paths,
  ]);

  const archiveSize = await getSizeInBytes(archivePath);
  console.log(`🔹 Created archive size: ${humanFileSize(archiveSize)}.`);

  return compressionMethod;
}

export async function extractTar(
  archivePath: string,
  compressionMethod: CompressionMethod,
  cwd: string,
): Promise<void> {
  console.log(
    `🔹 Detected '${compressionMethod}' compression method from object metadata.`,
  );

  const archiveSize = await getSizeInBytes(archivePath);
  console.log(`🔹 Extracting archive size: ${humanFileSize(archiveSize)}.`);

  const compressionArgs =
    compressionMethod === CompressionMethod.GZIP
      ? ['-z']
      : compressionMethod === CompressionMethod.ZSTD_WITHOUT_LONG
      ? ['--use-compress-program', 'zstd -d']
      : ['--use-compress-program', 'zstd -d --long=30'];

  await exec.exec('tar', [
    '-x',
    ...compressionArgs,
    '-P',
    '-f',
    archivePath,
    '-C',
    cwd,
  ]);
}
