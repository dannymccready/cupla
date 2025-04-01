# Cupla Web Application

A web application with user authentication and various tools.

## Features

- User authentication (login/register)
- Super admin account management
- Secure password storage
- PostgreSQL database integration

## Setup

1. Clone the repository:
```bash
git clone [your-repository-url]
cd cupla
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
DATABASE_URL=your_database_url
SESSION_SECRET=your_secret_key
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

## Deployment on Render.com

1. Create a new PostgreSQL database on Render.com
2. Create a new Web Service on Render.com
3. Connect your GitHub repository
4. Set the following environment variables in Render:
   - `DATABASE_URL`: Your Render PostgreSQL URL
   - `SESSION_SECRET`: A secure random string
   - `NODE_ENV`: production

## Default Super Admin Account

- Email: dannymccready@gmail.com
- Password: Aria2015

## Development with Cursor

This project is configured to work with Cursor IDE. The AI assistant can help you with:
- Code modifications
- Bug fixes
- Feature additions
- Code optimization
- Best practices implementation

## Project Structure

```
cupla/
├── public/           # Static files (HTML, CSS, JS)
├── server.js         # Main server file
├── package.json      # Project dependencies
├── .env             # Environment variables
└── .gitignore       # Git ignore rules
``` 