# Installing from Private GitHub Repository

This guide explains how to install and use this LMS plugin from a private GitHub repository.

## Installation Methods

### Method 1: Direct GitHub URL (Recommended)

Add this to your project's `package.json`:

```json
{
  "dependencies": {
    "@littledash/plugin-lms": "github:Littledash/plugin-lms#main"
  }
}
```

Then run:

```bash
npm install
# or
pnpm install
# or
yarn install
```

### Method 2: Using SSH (if you have SSH access)

```json
{
  "dependencies": {
    "@littledash/plugin-lms": "git+ssh://git@github.com/Littledash/plugin-lms.git#main"
  }
}
```

### Method 3: Using Personal Access Token

If you need to use a personal access token:

```json
{
  "dependencies": {
    "@littledash/plugin-lms": "https://YOUR_TOKEN@github.com/Littledash/plugin-lms.git#main"
  }
}
```

## Configuration

After installation, you can import and use the plugin in your Payload config:

```typescript
import { buildConfig } from 'payload/config'
import lmsPlugin from '@littledash/plugin-lms'

export default buildConfig({
  plugins: [
    lmsPlugin({
      currencies: {
        defaultCurrency: 'AUD',
        supportedCurrencies: ['AUD'],
      },
      courses: true,
      lessons: true,
      topics: true,
      quizzes: true,
      categories: true,
      tags: true,
      certificates: true,
      questions: true,
    }),
  ],
})
```

## Troubleshooting

### Issue: Build fails during installation

**Solution**: Make sure you have the required build tools installed:

```bash
npm install -g pnpm
# or ensure you have the latest Node.js version
```

### Issue: TypeScript errors

**Solution**: The plugin should build automatically during installation. If you see TypeScript errors, try:

```bash
cd node_modules/@littledash/plugin-lms
pnpm build
```

### Issue: Permission denied

**Solution**: Ensure you have access to the private repository and your GitHub credentials are properly configured.

## Development

If you need to make changes to the plugin:

1. Clone the repository locally
2. Make your changes
3. Run `pnpm build` to build the changes
4. Commit and push to GitHub
5. Update your main project to use the new commit hash

```json
{
  "dependencies": {
    "@littledash/plugin-lms": "github:Littledash/plugin-lms#commit-hash"
  }
}
```
