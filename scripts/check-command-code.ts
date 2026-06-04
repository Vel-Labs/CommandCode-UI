import { checkCommandCode, commandCodeStatus, listModels } from '../src/main/cli'

async function main(): Promise<void> {
  const command = process.env.COMMAND_CODE_BIN || process.argv[2] || 'cmd'
  const check = await checkCommandCode(command)
  console.log('version check:', check.ok ? 'ok' : 'failed')
  console.log((check.stdout || check.stderr || check.error || '').trim())

  if (!check.ok) process.exit(1)

  const status = await commandCodeStatus(command, process.cwd())
  console.log('status check:', status.ok ? 'ok' : 'failed')
  console.log((status.stdout || status.stderr || status.error || '').trim())

  const models = await listModels(command, process.cwd())
  console.log('model listing:', models.ok ? `${models.models.length} candidate lines` : 'failed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
