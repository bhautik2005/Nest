# Airbnb Clone

A full-stack web application built with Express.js, MongoDB, and EJS templating.

## Features
- User authentication with bcrypt
- Host property management
- Booking system
- Image upload functionality
- Responsive UI with Tailwind CSS

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn
## Img of project
 
| Front Page View | Search Results View |
| :---: | :---: |
| <img src="https://github.com/bhautik2005/Nest/raw/e17d42e4c5eb5f510b4ae2cb3f205eaddfd8ba17/airbnb_project_img/image.jpg" alt="Airbnb Project Image" width="400"> | <img src="https://github.com/bhautik2005/Nest/raw/e17d42e4c5eb5f510b4ae2cb3f205eaddfd8ba17/airbnb_project_img/image.jpg" alt="Airbnb Project Image" width="400"> |
## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd airbnb
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your environment variables:
```
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

4. Start the application:
```bash
npm start
```

The app will run on `http://localhost:3000`

## Available Scripts

- `npm start` - Start the application with nodemon
- `npm run tailwind` - Watch and compile Tailwind CSS

## Project Structure
```
├── Controllers/      # Request handlers
├── middleware/       # Express middleware
├── modals/          # Database schemas
├── routes/          # Route definitions
├── views/           # EJS templates
├── public/          # Static files and CSS
├── uploads/         # User uploaded files
├── app.js           # Main application file
└── package.json     # Dependencies
```

## License
ISC
