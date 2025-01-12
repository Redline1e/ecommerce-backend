# Backend for E-Commerce Project

This document provides all the necessary information to set up and run the backend of the e-commerce project. The backend is built using Node.js, Express, and MongoDB.

---
## Technologies Used
  - **Node.js**
  - **Express.js**
  - **MongoDB**
  - **JSON Web Token (JWT)** (for authentication)
  - **Nodemailer** (for email handling)
---

## Features
  - **User Authentication:**  Registration, login, and authentication using JWT.
  - **Product Management:**  Add, delete, and retrieve products.
  - **Image Upload:**  Upload and serve product images using multer.
  - **Cart Management:r**  Add, remove, and fetch cart items for authenticated users.
  - **Newsletter Subscription:**  Subscribe users and send newsletters via email.

---
## How to Run

**Make sure you have the following installed:**
 - Node.js (v14 or later)
 - MongoDB
- A package manager (npm or yarn)

**Environment Variables**
```bash
MONGO_URI=<Your MongoDB Connection String>
PORT=5000
JWT_SECRET=<Your JWT Secret Key>
MAIL_HOST=<Your Mailtrap SMTP Host>
MAILTRAP_PORT=<Your Mailtrap SMTP Port>
MAILTRAP_USER=<Your Mailtrap Username>
MAILTRAP_PASS=<Your Mailtrap Password>
EMAIL_USER=<Your Email Address>
```
**Installation**

1. Clone the repository:

    ```bash
    git clone git clone <repository-url>
    cd <backend-directory>
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Run the development server:

    ```bash
    npm start
    ```
---

## Project Structure

```plaintext
backend/
├── upload/               # Uploaded image storage
├── .env                  # Environment variables
├── app.js                # Main server file
├── package.json          # Node.js dependencies
└── README.md             # Documentation
```

---
## Notes
- Ensure MongoDB is running before starting the application.

 - Replace placeholders in .env with your actual credentials.

- Use a service like Mailtrap for testing email functionality.
