// frontend/src/App.jsx
import React, { useState } from 'react';
import { MessageCircle, Heart, Shield, Users } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import MoodTracker from './components/MoodTracker';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [sessionId, setSessionId] = useState(null);

  const startChat = () => {
    setCurrentView('chat');
  };

  const goHome = () => {
    setCurrentView('home');
    setSessionId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {currentView === 'home' ? (
        <HomePage onStartChat={startChat} />
      ) : (
        <div className="flex flex-col h-screen">
          <header className="bg-white shadow-sm border-b p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-800">Sahara</h1>
              </div>
              <button
                onClick={goHome}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 font-bold"
              >
                Home
              </button>
            </div>
          </header>
          
          {/* 🔧 FIXED: Removed border-l to eliminate the ugly black line */}
          <div className="flex-1 flex min-h-0 p-4 gap-4">
            <div className="flex-1 min-h-0">
              <ChatInterface sessionId={sessionId} setSessionId={setSessionId} />
            </div>
            <div className="w-80 bg-white rounded-lg shadow-sm p-4">
              <MoodTracker sessionId={sessionId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomePage({ onStartChat }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Sahara</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your safe, confidential, and empathetic AI companion for mental wellness. 
              We are here to listen, support, and guide you through challenges.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-blue-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">100% Anonymous</h3>
              <p className="text-gray-600">Your privacy is our priority. Chat without revealing your identity.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <MessageCircle className="w-8 h-8 text-purple-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">24/7 Available</h3>
              <p className="text-gray-600">Get support whenever you need it, day or night.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-indigo-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Culturally Aware</h3>
              <p className="text-gray-600">Designed specifically for Indian youth and their unique challenges.</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onStartChat}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Your Safe Conversation
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            If you are in immediate crisis, please contact:
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-700">
            <div>
              <strong>AASRA:</strong> +91 22 2754 6669
            </div>
            <div>
              <strong>Steve:</strong> +91 44 2464 0050
            </div>
            <div>
              <strong>iCall:</strong> +91 22 2556 3291
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
