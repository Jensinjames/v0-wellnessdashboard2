export function toast({ title, description, variant = "default", duration = 3000 }) {
  // Create a toast element
  const toastElement = document.createElement("div")
  toastElement.className = `fixed bottom-4 right-4 p-4 rounded-md shadow-md max-w-md z-50 ${
    variant === "destructive" ? "bg-red-100 text-red-800" : "bg-white text-gray-800"
  }`

  // Create toast content
  const titleElement = document.createElement("div")
  titleElement.className = "font-medium"
  titleElement.textContent = title

  const descriptionElement = document.createElement("div")
  descriptionElement.className = "text-sm mt-1"
  descriptionElement.textContent = description

  // Append elements
  toastElement.appendChild(titleElement)
  toastElement.appendChild(descriptionElement)

  // Add to document
  document.body.appendChild(toastElement)

  // Remove after duration
  setTimeout(() => {
    toastElement.classList.add("opacity-0", "transition-opacity")
    setTimeout(() => {
      document.body.removeChild(toastElement)
    }, 300)
  }, duration)
}
