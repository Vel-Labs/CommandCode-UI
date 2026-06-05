import { ptyDoctorAsync } from '../src/core/ptyDoctor'

async function main() {
  console.log('PTY doctor smoke test')
  console.log('=====================\n')

  const result = await ptyDoctorAsync()

  console.log(`node-pty available: ${result.available}`)
  console.log(`Shell: ${result.shell}`)
  console.log(`Healthy: ${result.healthy}`)
  console.log(`Exit code: ${result.exitCode}`)
  console.log(`Signal: ${result.signal}`)
  if (result.output) console.log(`Output: "${result.output}"`)
  if (result.error) console.log(`Error: ${result.error}`)

  if (result.healthy) {
    console.log('\nPTY smoke test PASSED')
    process.exit(0)
  } else {
    console.log('\nPTY smoke test FAILED')
    console.log('Real interactive sessions are blocked until PTY is available.')
    if (!result.available) {
      console.log('Run: npm rebuild node-pty')
    }
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
