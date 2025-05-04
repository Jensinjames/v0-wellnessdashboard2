import type React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"

interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode
  label: string
}

export function IconButton({ icon, label, ...props }: IconButtonProps) {
  return (
    <Button aria-label={label} size="icon" {...props}>
      {icon}
    </Button>
  )
}
