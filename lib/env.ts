// Environment variable validation utility

type EnvVar = {
  name: string
  value: string | undefined
  required: boolean
}

export function validateEnvVars(vars: EnvVar[]): boolean {
  let isValid = true

  vars.forEach(({ name, value, required }) => {
    if (required && !value) {
      console.error(`Missing required environment variable: ${name}`)
      isValid = false
    }
  })

  return isValid
}

// Validate Supabase environment variables
export function validateSupabaseEnv(): boolean {
  return validateEnvVars([
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      required: true,
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      required: true,
    },
  ])
}
