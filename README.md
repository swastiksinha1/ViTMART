<div align="center">

# ⚡ ViTMART  
### Student Marketplace for VIT Bhopal

### Buy • Sell • Trade within the Campus Community

A modern student marketplace platform built for VIT Bhopal students with real-time chat, dynamic notifications, Firebase authentication, and a seamless React-powered user experience.

</div>

---

## 📌 Overview

ViTMART is a campus-focused marketplace platform designed to help students buy, sell, and exchange products securely within the VIT Bhopal community. The platform provides a trusted ecosystem for students to trade books, gadgets, accessories, and other essentials while enabling smooth communication through a real-time chat and notification functionality.

The project focuses on solving real-world campus problems through modern web technologies, a highly responsive React component architecture, and premium user-centric design using TailwindCSS.

---

## 🚀 Features

| Feature | Description |
| :--- | :--- |
| 🔐 Firebase Authentication | Secure login and signup system |
| 🛍️ Marketplace Listings | Buy and sell products with advanced filtering |
| 🔄 Trade & Barter System | Submit and manage trade offers for items |
| 💬 Real-Time Chat | Instant messaging between buyers & sellers |
| 🔔 Dynamic Notifications | Real-time alerts for sales and trade offers |
| 🤖 AI Chatbot Widget | Interactive assistance powered by Gemini AI |
| 📱 Responsive Design | Beautiful UI optimized for all devices |
| ⚡ Fast Performance | Built on Vite + React for lightning-fast speeds |

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| Frontend Framework | React.js (via Vite) |
| Styling | TailwindCSS |
| Backend Services | Firebase |
| Authentication | Firebase Auth |
| Database | Firestore |
| Routing | React Router DOM |

---

## 🎯 Problem Statement

Students often face difficulties while:

- Finding affordable second-hand products
- Connecting with trusted buyers or sellers
- Communicating efficiently during transactions
- Selling unused items quickly within campus

ViTMART solves these issues by creating a secure, student-only marketplace ecosystem equipped with real-time negotiation and direct messaging tools.

---

## 📂 Project Structure

```bash
ViTMART
│
├── 📁 src/
│   ├── 📁 components/     # Reusable React components (UI, Modals, Chat)
│   ├── 📁 contexts/       # Global state (AuthContext, CartContext, etc.)
│   ├── 📁 pages/          # Full page views (Home, Buy, Sell, Profile)
│   ├── 📁 config/         # Firebase initialization
│   ├── 📄 App.jsx         # Main application routing
│   └── 📄 main.jsx        # React entry point
│
├── 📄 firestore_complete (1).rules # Strict Firebase security rules
├── 📄 tailwind.config.js  # Tailwind theme and styling configuration
├── 📄 vite.config.js      # Vite build configuration
└── 📄 README.md           # Project documentation
```

⚙️ Installation & Setup

1️⃣ Clone the Repository
```bash
git clone https://github.com/swastiksinha1/ViTMART.git
```

2️⃣ Navigate to the Project Folder
```
cd ViTMART
```
3️⃣ Install Dependencies
```
npm install
```
4️⃣ Run the Development Server
```
npm run dev
```
Open http://localhost:5173 in your browser to view the app!

🔥 Firebase Configuration
Create a Firebase project and enable the following services:

Firebase Authentication (Email/Password & Google Sign-In)
Firestore Database
Update your Firebase configuration inside src/config/firebase.js:

```
javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```
Important: Don't forget to deploy the custom Firestore security rules from firestore_complete (1).rules to your Firebase console to ensure chat, notifications, and products are secured properly!


## 🌟 Future Improvements

| Feature                                | Status       |
| :------------------------------------- | :----------: |
| 💳 **Payment Gateway Integration**     |  🚧 Planned  |
| ⭐ **Seller Ratings & Reviews**        |  🚧 Planned  |
| 📦 **Order Tracking System**           |  🚧 Planned  |
| 🧠 **Advanced AI Recommendations**     |  🚧 Planned  |
| 📲 **Mobile Application Version**      |  🚧 Planned  |

---

## 👨‍💻 Developer & Credits

| Role              | Details                        |
| :---------------- | :----------------------------- |
| **Developer**     | Swastik Sinha                  |
| **Title**         | Full Stack Developer           |
| **Institution**   | VIT Bhopal                     |

---

## 📈 Learning Outcomes

| Category               | Skills Acquired                                                  |
| :--------------------- | :--------------------------------------------------------------- |
| **Frontend UI**        | Advanced React Component Architecture, Modern UI/UX TailwindCSS  |
| **Backend & DB**       | Architecting and securing Firestore databases with complex Rules |
| **State & Logic**      | Complex State Management using React Context API                 |
| **Real-Time Systems**  | Synchronized Real-Time Communication (Web Sockets, Chat, Alerts) |
| **Software Dev**       | Product-Oriented Lifecycle, Problem Solving using Technology     |

---

## ⭐ Support & Contribution

| Action             | Description                                          |
| :----------------- | :--------------------------------------------------- |
| ⭐ **Star**        | Star the repository to show support                  |
| 🍴 **Fork**        | Fork the project to experiment or build upon it      |
| 🛠️ **Contribute**  | Submit pull requests to contribute new features      |

---

## 📄 License & Repository Details

| Category               | Details                                                                                                          |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **License**            | This project is licensed under the **MIT License**.                                                              |
| **GitHub Topics**      | `react` `marketplace` `firebase` `javascript` `tailwindcss` `ecommerce` `web-development` `vit-bhopal`           |
