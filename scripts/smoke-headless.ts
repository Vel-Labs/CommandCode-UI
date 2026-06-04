import { runHeadless } from '../src/main/cli'

async function main(): Promise<void> {
  const commandExecutable = process.env.COMMAND_CODE_BIN || process.argv[2] || 'cmd'
  const prompt = process.argv.slice(3).join(' ') || 'Say hello in one sentence and do not edit files.'

  const result = await runHeadless({
    cwd: process.cwd(),
    commandExecutable,
    prompt,
    permissionMode: 'plan',
    maxTurns: 3,
    trust: true,
    skipOnboarding: true,
    timeoutMs: 120_000
  })

  console.log('command:', result.command, result.args.join(' '))
  console.log('exit:', result.exitCode, 'signal:', result.signal, 'durationMs:', result.durationMs)
  console.log('--- stdout ---')
  console.log(result.stdout)
  console.log('--- stderr ---')
  console.error(result.stderr)

  process.exit(result.exitCode ?? 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
