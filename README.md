# Writify

A browser extension that enhances your Twitter/X and Slack experience with AI-powered message composition.

## Features

### AI Message Composer
- Compose better tweets and Slack messages with AI assistance 
- Multiple tone options: Friendly, Formal, Witty
- Works seamlessly across Twitter and Slack

### Twitter Features
- Click the brain icon next to the bookmark button to analyze and scrape tweets
- Automatically collects tweet text, username, and timestamp
- Export all scraped tweets as a JSON file
- Counter in the header shows how many tweets have been scraped

### Slack Features
- AI-powered message composition directly in Slack
- Smart message suggestions based on context
- Multiple tone options for different communication needs

## Installation

1. Clone this repository
2. Run `npm install` or `pnpm install`
3. Run `npm run dev` or `pnpm dev` to start development mode
4. Load the extension in your browser:
   - Chrome: Go to chrome://extensions/, enable Developer mode, click "Load unpacked", and select the `dist` folder
   - Firefox: Go to about:debugging#/runtime/this-firefox, click "Load Temporary Add-on", and select any file in the `dist` folder

## Usage

1. Visit Twitter/X or Slack in your browser
2. Use the AI compose button when writing messages for AI assistance
3. On Twitter: Click the brain icon next to the bookmark button on any tweet to analyze and collect it
4. On Twitter: Click the export button in the header to download collected tweets as JSON
5. On Slack: Access AI composition features directly in the message input field

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
