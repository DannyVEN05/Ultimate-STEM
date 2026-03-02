This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. Global Libraries
Before cloning the project, ensure that [npm](https://nodejs.org/en/download/) is installed on your computer.

2. Project Setup
  i. Open your computer terminal, and ensure that your current directory is the folder where you would like to save the project (e.g. a documents folder). To check your current directory, type 'pwd' and press enter.

  ii. In the directory where you would like your project to be installed, clone the project using the following command:
   ```bash
   git clone https://github.com/DannyVEN05/Ultimate-STEM.git
   ```

  iii. Open the new dictory in VSCode. Go to VSCode -> File -> Open Folder -> Select the folder that was created by the command -> Select it.

  iv. Open the terminal in VSCode (if on Windows, change the terminal type to Git Bash, not Powershell - must install git first). Run the command:
   ```bash
   npm install
   ```
   This will install the dependencies for this project.

  v. Add the environment variables: Create a new file in the root of the project (same folder as where this README is) called '.env.local'. Inside this file, add the environment variables required for the project:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rguysiybissxllvoisof.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndXlzaXliaXNzeGxsdm9pc29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTM0NjMsImV4cCI6MjA4NzkyOTQ2M30.GcjHFUajX_Go14xXgDZnPOZrX-XgMoeiSnPNOZbqDPg
   ```

  vi. Run the development server. In the terminal, run:
   ```bash
   npm run dev
   ```

  vii. In your browser, go to [http://localhost:4000](http://localhost:4000) and you should see the home page of the website.


## Running the project
To run the development server:
```bash
npm run dev
```

To build the project and run the build:
```bash
npm run build
```
Then:
```bash
npm run start
```

Open [http://localhost:4000](http://localhost:4000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
