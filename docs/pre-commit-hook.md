# Pre-commit Hook for Syntax Validation

This project uses a pre-commit hook to validate syntax before code is committed. This helps catch syntax errors early in the development process.

## How It Works

When you try to commit changes, the pre-commit hook will:

1. Run ESLint on staged JavaScript/TypeScript files to check for syntax errors
2. Run Prettier to ensure consistent code formatting
3. Prevent the commit if any syntax errors are found

## Setup

The pre-commit hook is automatically set up when you run:

\`\`\`bash
npm run prepare
\`\`\`

This command is automatically run after `npm install`, so you shouldn't need to run it manually.

## Manual Validation

You can manually validate syntax by running:

\`\`\`bash
npm run validate
\`\`\`

This will run ESLint and Prettier on all files in the project.

## Fixing Syntax Errors

If the pre-commit hook finds syntax errors, it will prevent the commit and show you the errors. You can fix them by running:

\`\`\`bash
npm run lint:fix
\`\`\`

This will run ESLint with the `--fix` flag to automatically fix many common syntax errors.

## Bypassing the Pre-commit Hook

In rare cases, you may need to bypass the pre-commit hook. You can do this by adding the `--no-verify` flag to your commit command:

\`\`\`bash
git commit -m "Your commit message" --no-verify
\`\`\`

**Note:** This should only be used in exceptional circumstances. It's generally better to fix the syntax errors.

## Troubleshooting

If you encounter issues with the pre-commit hook, try the following:

1. Make sure you have the latest dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Reinstall the pre-commit hook:
   \`\`\`bash
   npx husky install
   \`\`\`

3. Check if the pre-commit hook file is executable:
   \`\`\`bash
   chmod +x .husky/pre-commit
   \`\`\`

4. If all else fails, you can temporarily disable the pre-commit hook:
   \`\`\`bash
   git config --local core.hooksPath /dev/null
   \`\`\`
   
   To re-enable it:
   \`\`\`bash
   git config --local --unset core.hooksPath
