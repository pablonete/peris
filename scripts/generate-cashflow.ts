import { generateCashflowForQuarter } from "@/model/cashflow/generate"

async function main() {
  const receivedArgs = process.argv.slice(2)
  const args = receivedArgs[0] === "--" ? receivedArgs.slice(1) : receivedArgs
  const [quarterId, ...extraArgs] = args
  const dataRepoPath = process.env.PERIS_DATA_REPO_PATH

  if (!quarterId || extraArgs.length > 0 || !dataRepoPath) {
    throw new Error(
      "Usage: PERIS_DATA_REPO_PATH=/path/to/data-repository pnpm run cashflow:generate -- YYYY.NQ"
    )
  }

  const result = await generateCashflowForQuarter({
    quarterId,
    dataRepoPath,
  })
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  )
  process.exitCode = 1
})
