# Trdelnik Game Frontend

A modern web application built with React and TypeScript, featuring a beautiful UI powered by shadcn-ui and Tailwind CSS.

## Tech Stack

- **Vite** - Next Generation Frontend Tooling
- **TypeScript** - Type-safe JavaScript
- **React** - UI Library
- **shadcn-ui** - Re-usable components built with Radix UI and Tailwind CSS
- **Tailwind CSS** - Utility-first CSS framework

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or bun package manager

## Getting Started

1. Install dependencies:
```bash
npm install
# or
bun install
```

2. Start the development server:
```bash
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/           # Source files
├── public/        # Static assets
├── components/    # React components
└── ...
```

## Development

The project uses:
- ESLint for code linting
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn-ui for UI components

## Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is part of the Trdelnik Game monorepo.

## Project info

**URL**: https://lovable.dev/projects/c4490d80-3319-4a5f-9212-ae16adec4f2a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c4490d80-3319-4a5f-9212-ae16adec4f2a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c4490d80-3319-4a5f-9212-ae16adec4f2a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
