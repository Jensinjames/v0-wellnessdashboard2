import TurndownService from "turndown"

async function fetchAndConvertToMarkdown() {
  try {
    // Fetch content from example.com
    console.log("Fetching content from example.com...")
    const response = await fetch("https://example.com")
    const html = await response.text()

    console.log("Fetched HTML:")
    console.log(html.slice(0, 500) + "...") // Display first 500 characters

    // Convert HTML to Markdown
    console.log("Converting HTML to Markdown...")
    const turndownService = new TurndownService()
    const markdown = turndownService.turndown(html)

    console.log("Converted Markdown:")
    console.log(markdown)
  } catch (error) {
    console.error("Error:", error)
  }
}

// Execute the function
fetchAndConvertToMarkdown()
