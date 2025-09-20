# Sahara Mental Wellness Platform

## Overview

Sahara Mental Wellness is an AI-powered mental health platform developed using the MERN stack (MongoDB, Express.js, React, Node.js). It provides users with a private and secure journaling space, AI chat companion, mood insights, and risk assessment features to support emotional well-being.

## Features
Private journal with session isolation for both guest and authenticated users

Voice-to-text journaling using browser speech recognition

AI-powered chat companion offering empathetic mental health support

Live mood insights and sentiment analysis of journal entries

Crisis detection and risk assessment for urgent concerns

Secure user authentication and session management

Responsive and user-friendly UI for an engaging experience

## Tech Stack

### Frontend: 
React, Lucide Icons, CSS, Browser Speech Recognition API

### Backend: 
Node.js, Express.js, Google Gemini AI API, MongoDB (or in-memory for demo)

Authentication and session handling with secure token management

AI-powered NLP using Google Generative AI (Gemini)

Getting Started
Prerequisites
Node.js and npm installed

MongoDB (optional — for production setup)

Google Gemini API key (for AI chat features)

OpenAI API key (for voice transcription features)

## Installation

Clone the repository:

text
git clone https://github.com/yourusername/sahara-mental-wellness.git
cd sahara-mental-wellness

### Install frontend dependencies:

text

cd frontend

npm install

Install backend dependencies:

text

cd ../backend

npm install

Setup environment variables .env in the backend folder:

text

GEMINI_API_KEY=your-google-gemini-api-key

OPENAI_API_KEY=your-openai-api-key

PORT=3001

Running the App

Start the backend server:

text

cd backend

npm start

Start the frontend development server:

text

cd ../frontend

npm start

Open your browser and visit http://localhost:5173 to access the app.

### Usage

Create a guest or authenticated session.

Write journal entries or use voice input.

Interact with the AI chat companion for mental health support.

View live mood insights and AI-generated analysis.

Manage your session and entries securely.