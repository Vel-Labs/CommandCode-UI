import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { detectArtifactsInText } from '../src/core/artifactDetection'

const tempDirs: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccgui-artifacts-'))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true })
  }
})

describe('detectArtifactsInText', () => {
  it('finds relative and absolute file paths inside allowed roots', () => {
    const root = tempDir()
    const realRoot = realpathSync(root)
    mkdirSync(path.join(root, 'docs'), { recursive: true })
    mkdirSync(path.join(root, 'out'), { recursive: true })
    const reportPath = path.join(root, 'docs', 'report.md')
    const htmlPath = path.join(root, 'out', 'index.html')
    writeFileSync(reportPath, '# Report\n', 'utf8')
    writeFileSync(htmlPath, '<h1>Preview</h1>\n', 'utf8')

    const result = detectArtifactsInText(
      `Wrote docs/report.md and ${htmlPath}.`,
      { cwd: root, allowedRoots: [root] }
    )

    expect(result.rejected).toEqual([])
    expect(result.artifacts).toEqual([
      {
        raw: 'docs/report.md',
        path: reportPath,
        kind: 'markdown',
        exists: true,
        root: realRoot
      },
      {
        raw: htmlPath,
        path: htmlPath,
        kind: 'html',
        exists: true,
        root: realRoot
      }
    ])
  })

  it('rejects paths outside allowed roots', () => {
    const root = tempDir()
    const outside = tempDir()
    const outsideFile = path.join(outside, 'secret.txt')
    writeFileSync(outsideFile, 'secret\n', 'utf8')

    const result = detectArtifactsInText(
      `Do not preview ${outsideFile}.`,
      { cwd: root, allowedRoots: [root] }
    )

    expect(result.artifacts).toEqual([])
    expect(result.rejected).toMatchObject([
      {
        raw: outsideFile,
        path: outsideFile,
        kind: 'text',
        exists: true,
        reason: 'outside-allowed-roots'
      }
    ])
  })

  it('rejects symlink escapes even when the symlink itself is under the workspace root', () => {
    const root = tempDir()
    const outside = tempDir()
    const outsideFile = path.join(outside, 'escape.md')
    const linkPath = path.join(root, 'linked.md')
    writeFileSync(outsideFile, '# outside\n', 'utf8')
    symlinkSync(outsideFile, linkPath)

    const result = detectArtifactsInText(
      'Potential artifact: ./linked.md',
      { cwd: root, allowedRoots: [root] }
    )

    expect(result.artifacts).toEqual([])
    expect(result.rejected).toMatchObject([
      {
        raw: './linked.md',
        path: linkPath,
        kind: 'markdown',
        exists: true,
        reason: 'outside-allowed-roots'
      }
    ])
  })

  it('keeps missing files under an allowed root as previewable candidates for later existence checks', () => {
    const root = tempDir()
    const realRoot = realpathSync(root)
    const missingPath = path.join(root, 'notes', 'todo.jsonl')

    const result = detectArtifactsInText(
      'Referenced notes/todo.jsonl for follow-up.',
      { cwd: root, allowedRoots: [root] }
    )

    expect(result.artifacts).toMatchObject([
      {
        raw: 'notes/todo.jsonl',
        path: missingPath,
        kind: 'json',
        exists: false,
        root: realRoot
      }
    ])
    expect(result.rejected).toEqual([])
  })

  it('requires a workspace root before accepting relative paths', () => {
    const root = tempDir()
    const result = detectArtifactsInText(
      'Relative output: docs/report.md',
      { allowedRoots: [root] }
    )

    expect(result.artifacts).toEqual([])
    expect(result.rejected).toMatchObject([
      {
        raw: 'docs/report.md',
        reason: 'missing-workspace-root'
      }
    ])
  })
})
