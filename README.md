# Chatbot Platform

A cutting-edge chat platform that empowers users to interact with various language models (LLMs) using their own API keys. The platform enables extensive customization of LLM parameters including maximum tokens, system messages, and other model settings. All configurations and chat data are stored locally in the browser via IndexedDB and LocalStorage, ensuring quick access and offline persistence.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## Features

- **API Key Management**
  - Import and manage API keys for different LLM providers.
  - Dedicated settings dialogs for API keys enable secure storage and easy updates.
  
- **LLM Integration & Model Configuration**
  - Integrate with multiple language models.
  - Configure detailed model parameters including maximum tokens, system messages, and other model-specific options.
  - Switch between models using an intuitive model selector.

- **Chat Interface & Messaging**
  - Dynamic chat UI with a comprehensive chat panel, message list, and individual message components.
  - Supports standard and simplified chat interfaces via distinct API routes.
  
- **Local Data Persistence**
  - All data (chats, settings, folders, etc.) is persisted in the browser using IndexedDB and LocalStorage.
  - Robust storage management ensures data consistency and offline access.

- **Organization & Customization**
  - Create and manage folders for organizing chats.
  - Pin important messages within chats to maintain context and easy reference.

- **Responsive UI**
  - Modern, responsive design built with Tailwind CSS.
  - Incorporates a custom UI component library for buttons, dialogs, forms, and other interactive elements.

- **State Management**
  - Leverages custom React hooks (e.g., `use-chat-store`, `use-settings-store`, `use-toast`) for efficient state and UI management.

- **API Endpoints**
  - Server-side API routes using Next.js enable seamless communication between the frontend and backend.
  - Supports both advanced chat routing and simpler chat implementations.

## Tech Stack

- **Frontend Framework:** [Next.js](https://nextjs.org/) with React
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Global CSS
- **State Management:** Custom React hooks
- **Data Persistence:** IndexedDB and LocalStorage
- **API:** Next.js API routes (Node.js backend)
- **Tooling:** ESLint, PostCSS

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://your-repo-url.git
   cd chatbot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application should now be running locally.

## Usage

1. **Launching the App:**
   - Navigate to the local URL provided by the development server.
   - Begin a new chat session or continue an existing conversation.

2. **Managing API Keys & Models:**
   - Open the settings dialog to configure your API keys.
   - Choose your preferred LLM and adjust model parameters such as maximum tokens and system messages.

3. **Chat Interface:**
   - Send and receive messages with the integrated chat panel.
   - Use folder and pinning functionalities to organize chats and maintain important messages.

## Configuration

- **API Keys:** Use the API keys dialog to add and update your API keys securely.
- **Model Settings:** Customize model parameters using the model settings dialog.
- **Storage:** Data is stored locally in the browser to ensure quick retrieval and offline capability.

## Architecture

- **Frontend:** Built with Next.js and React, utilizing a custom UI component library.
- **Backend:** API routes under `app/api/chat/` and `app/api/simplechat/` manage chat data and interface with LLM backends.
- **Data Persistence:** LocalStorage and IndexedDB are used to store user settings, chat history, and other configurations.
- **State Management:** Custom hooks such as `use-chat-store`, `use-settings-store`, and `use-toast` encapsulate state logic and UI interactions.
- **Styling:** Tailwind CSS is used throughout the project for a modern and responsive design.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements, bug fixes, or documentation improvements.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/awesome-feature`).
3. Commit your changes and push to your fork.
4. Submit a pull request with a detailed description of your changes.

## License

Distributed under the MIT License. See `LICENSE` for more information.