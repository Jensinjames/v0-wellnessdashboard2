// Environment variable validation utility

type EnvVar = {
  name: string
  value: string | undefined
  required: boolean
}

export function checkRequiredEnvVars(vars: EnvVar[]): string[] {
  const missing: string[] = []

  vars.forEach(({ name, value, required }) => {
    if (required && !value) {
      missing.push(name)
    }
  })

  return missing
}
