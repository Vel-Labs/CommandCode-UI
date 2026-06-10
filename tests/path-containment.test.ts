import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { isPathUnderRoot, resolveBoundaryPath } from '../src/shared/pathContainment'

const tempDirs: string[] = []

function tempDir(prefix = 'ccgui-path-'): string {
  const dir = mkdtempSync(path.join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true })
  }
})

describe('path containment helpers', () => {
  it('normalizes existing paths and allows the root itself', () => {
    const root = tempDir()

    expect(resolveBoundaryPath(root)).toBe(realpathSync(root))
    expect(isPathUnderRoot(root, root)).toBe(true)
  })

  it('allows existing and non-existent leaves under the root', () => {
    const root = tempDir()
    const existing = path.join(root, 'existing.txt')
    const missingLeaf = path.join(root, 'missing.txt')
    writeFileSync(existing, 'ok', 'utf8')

    expect(isPathUnderRoot(existing, root)).toBe(true)
    expect(isPathUnderRoot(missingLeaf, root)).toBe(true)
  })

  it('allows paths with non-existent intermediate directories under the root', () => {
    const root = tempDir()

    expect(isPathUnderRoot(path.join(root, 'missing', 'nested', 'file.txt'), root)).toBe(true)
  })

  it('rejects sibling-prefix paths', () => {
    const root = tempDir('ccgui-root-')
    const sibling = `${root}2`
    mkdirSync(sibling)
    tempDirs.push(sibling)

    expect(isPathUnderRoot(path.join(sibling, 'file.txt'), root)).toBe(false)
  })

  it('allows symlinks that resolve inside the root', () => {
    const root = tempDir()
    const target = path.join(root, 'target.txt')
    const link = path.join(root, 'link.txt')
    writeFileSync(target, 'ok', 'utf8')
    symlinkSync(target, link)

    expect(isPathUnderRoot(link, root)).toBe(true)
  })

  it('rejects symlinks that escape the root', () => {
    const root = tempDir()
    const outside = tempDir()
    const target = path.join(outside, 'secret.txt')
    const link = path.join(root, 'escape.txt')
    writeFileSync(target, 'secret', 'utf8')
    symlinkSync(target, link)

    expect(isPathUnderRoot(link, root)).toBe(false)
  })
})
