import { describe, expect, it } from 'vitest'
import { mcpPolicyReferences, mcpScopeReferences } from '../src/core/mcpReference'

describe('MCP reference metadata', () => {
  it('documents Command Code MCP scope precedence paths', () => {
    expect(mcpScopeReferences.map((scope) => [scope.id, scope.configPath])).toEqual([
      ['local', '~/.commandcode/projects/<project-slug>/mcp.json'],
      ['project', '<project>/.mcp.json'],
      ['user', '~/.commandcode/mcp.json']
    ])
  })

  it('keeps plan-mode and permission limits visible', () => {
    expect(mcpPolicyReferences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'permissions', description: expect.stringContaining('permission prompts') }),
        expect.objectContaining({ id: 'plan-mode', description: expect.stringContaining('disabled') })
      ])
    )
  })

  it('states that MCP secrets must not be GUI preferences', () => {
    expect(mcpPolicyReferences.find((policy) => policy.id === 'secrets')?.description).toContain('must not be stored in GUI preferences')
  })
})
