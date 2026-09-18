import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import solc from 'solc'

const contractsDir = 'contracts'
const abiDir = join(contractsDir, 'abi')
const artifactsDir = join(contractsDir, 'artifacts')

const sourceFiles = readdirSync(contractsDir).filter((file) => file.endsWith('.sol'))
if (sourceFiles.length === 0) {
  console.error('No .sol sources found in contracts/')
  process.exit(1)
}

const sources = Object.fromEntries(
  sourceFiles.map((file) => [file, { content: readFileSync(join(contractsDir, file), 'utf8') }]),
)

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))

if (Array.isArray(output.errors)) {
  const errors = output.errors.filter((entry) => entry.severity === 'error')
  const warnings = output.errors.filter((entry) => entry.severity !== 'error')
  for (const warning of warnings) {
    console.warn(warning.formattedMessage)
  }
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error.formattedMessage)
    }
    process.exit(1)
  }
}

mkdirSync(abiDir, { recursive: true })
mkdirSync(artifactsDir, { recursive: true })

for (const [sourceFile, contracts] of Object.entries(output.contracts ?? {})) {
  for (const [name, contract] of Object.entries(contracts)) {
    writeFileSync(join(abiDir, `${name}.json`), `${JSON.stringify(contract.abi, null, 2)}\n`)
    writeFileSync(join(artifactsDir, `${name}.bin`), contract.evm.bytecode.object)
    console.log(`compiled ${name} (${sourceFile})`)
  }
}
