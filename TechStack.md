# tech stack of nocturne


---

# Programming Languages

| Technology            | Why I'm Using It                                                                                      | Notes                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **TypeScript**        | Adds static typing to JavaScript, making the codebase easier to maintain and reducing runtime errors. | Used throughout the Next.js application.      |
| **JavaScript (ES6+)** | Core language that powers React, Next.js, Express, and Node.js.                                       | TypeScript compiles down to JavaScript.       |
| **HTML5**             | Defines the structure and content of web pages.                                                       | Used through JSX/TSX components.              |
| **CSS3**              | Styles the application's UI.                                                                          | Most styling is handled through Tailwind CSS. |

---

# Frontend

| Technology     | Why I'm Using It                                                                                            | Notes                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Next.js 16** | Main framework used to build the website. Provides routing, rendering, optimization, and project structure. | Uses the App Router architecture.                   |
| **React 19**   | Builds reusable UI components.                                                                              | Makes the application modular and easier to manage. |
| **React DOM**  | Renders React components inside the browser.                                                                | Works alongside React.                              |

---

# Styling

| Technology       | Why I'm Using It                                              | Notes                              |
| ---------------- | ------------------------------------------------------------- | ---------------------------------- |
| **Tailwind CSS** | Utility-first CSS framework that speeds up UI development.    | Helps maintain consistent styling. |
| **PostCSS**      | Processes Tailwind CSS during build time.                     | Required for Tailwind.             |
| **Autoprefixer** | Automatically adds vendor prefixes for browser compatibility. | Runs during the build process.     |

---

# Backend

| Technology     | Why I'm Using It                                   | Notes                                                              |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| **Node.js**    | JavaScript runtime used to run the backend server. | Required for Express and npm.                                      |
| **Express.js** | Backend framework used for building REST APIs.     | Will handle authentication, APIs, and communication with Firebase. |

---

# Firebase Services

| Technology                          | Why I'm Using It                                          | Notes                                                                     |
| ----------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Firebase**                        | Provides cloud backend services without managing servers. | Main backend service provider.                                            |
| **Firebase Authentication**         | Handles user login and authentication.                    | Email/password authentication is currently used.                          |
| **Cloud Firestore**                 | Stores application data in a NoSQL database.              | Used for user information and project data.                               |
| **Firebase Storage**                | Stores uploaded files and images.                         | Used for profile pictures and study materials.                            |
| **Firebase Analytics**              | Tracks application usage.                                 | Useful for understanding user activity.                                   |
| **Firebase Cloud Messaging**        | Sends push notifications.                                 | Can be used for reminders and announcements.                              |
| **Firebase Functions**              | Runs backend logic on demand.                             | Useful for server-side operations without maintaining a dedicated server. |
| **Firebase Remote Config**          | Changes app settings without redeploying.                 | Useful for feature toggles and configuration updates.                     |
| **Firebase Performance Monitoring** | Monitors app performance.                                 | Helps identify slow operations and bottlenecks.                           |

---

# API Communication

| Technology | Why I'm Using It                                      | Notes                                                  |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------ |
| **Axios**  | Makes HTTP requests between the frontend and backend. | Simpler API handling compared to the native Fetch API. |

---

# Forms & Validation

| Technology              | Why I'm Using It                    | Notes                                           |
| ----------------------- | ----------------------------------- | ----------------------------------------------- |
| **React Hook Form**     | Manages form state efficiently.     | Used for login, registration, and future forms. |
| **Zod**                 | Validates user input using schemas. | Ensures data is correct before submission.      |
| **@hookform/resolvers** | Connects React Hook Form with Zod.  | Makes schema validation straightforward.        |

---

# UI Libraries

| Technology             | Why I'm Using It               | Notes                                                  |
| ---------------------- | ------------------------------ | ------------------------------------------------------ |
| **Tabler Icons React** | Primary icon library.          | Modern, lightweight SVG icons.                         |
| **Lucide React**       | Additional icon collection.    | Useful when a required icon isn't available in Tabler. |
| **React Icons**        | Access to multiple icon packs. | Provides flexibility for different UI designs.         |

---

# Animation

| Technology        | Why I'm Using It                 | Notes                                                        |
| ----------------- | -------------------------------- | ------------------------------------------------------------ |
| **Framer Motion** | Adds animations and transitions. | Used for smoother interactions and a better user experience. |

---

# Development Tools

| Technology           | Why I'm Using It                          | Notes                                                       |
| -------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| **Git**              | Tracks source code changes.               | Used for version control.                                   |
| **GitHub**           | Hosts the project repository.             | Used for collaboration and code management.                 |
| **npm**              | Manages project dependencies and scripts. | Comes bundled with Node.js.                                 |
| **ESLint**           | Finds potential issues in the code.       | Helps maintain consistent coding standards.                 |
| **VS Code / Cursor** | Main development environment.             | Used for writing and debugging code.                        |
| **Firebase Console** | Manages Firebase services.                | Configure Authentication, Firestore, Storage, etc.          |
| **Chrome DevTools**  | Debugs the web application.               | Useful for inspecting elements, API calls, and performance. |

---

# Tech Stack Hierarchy

```text
Programming Languages
│
├── TypeScript
├── JavaScript
├── HTML5
└── CSS3

Frontend
│
├── Next.js
├── React
└── React DOM

Styling
│
├── Tailwind CSS
├── PostCSS
└── Autoprefixer

Backend
│
├── Node.js
└── Express.js

Cloud Services
│
└── Firebase
    ├── Authentication
    ├── Firestore
    ├── Storage
    ├── Analytics
    ├── Cloud Messaging
    ├── Functions
    ├── Remote Config
    └── Performance Monitoring

Networking
│
└── Axios

Forms & Validation
│
├── React Hook Form
├── Zod
└── @hookform/resolvers

UI Libraries
│
├── Tabler Icons
├── Lucide React
└── React Icons

Animation
│
└── Framer Motion

Development Tools
│
├── Git
├── GitHub
├── npm
├── ESLint
├── VS Code / Cursor
├── Firebase Console
└── Chrome DevTools
```
