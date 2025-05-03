import { fixAllUnicodeEscapes } from "./fix-remaining-unicode-escapes"

// Run the fixer
fixAllUnicodeEscapes()
  .then(() => console.log("Unicode escape fixing completed successfully"))
  .catch((error) => console.error("Error fixing Unicode escapes:", error))
