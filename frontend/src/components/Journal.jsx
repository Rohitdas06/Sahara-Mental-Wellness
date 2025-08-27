// // frontend/src/components/Journal.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { Calendar, Edit3, Trash2, Plus, Brain, Save, Mic, MicOff, Volume2, Shield } from "lucide-react";

// const BACKEND_URL = "http://localhost:3001";

// function Journal({ user, sessionManager }) {
//   const [entries, setEntries] = useState([]);
//   const [currentEntry, setCurrentEntry] = useState("");
//   const [selectedDate, setSelectedDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );
//   const [isWriting, setIsWriting] = useState(false);
//   const [dailyPrompt, setDailyPrompt] = useState("");
//   const [entryAnalysis, setEntryAnalysis] = useState(null);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);

//   // ✅ UPDATED: Use Web Speech API instead of MediaRecorder + OpenAI
//   const [isRecording, setIsRecording] = useState(false);
//   const [voiceSupported, setVoiceSupported] = useState(true);
//   const [transcript, setTranscript] = useState("");
//   const [interimTranscript, setInterimTranscript] = useState("");
  
//   // ✅ UPDATED: Use SpeechRecognition instead of MediaRecorder
//   const recognitionRef = useRef(null);

//   const prompts = [
//     "How did you handle any academic pressure today?",
//     "What made you feel grateful today?",
//     "Describe a moment when you felt truly yourself today.",
//     "What challenges did you face with family expectations?",
//     "How did you take care of your mental health today?",
//     "What would you tell your younger self about today?",
//     "How did you connect with others today?",
//     "What are you worried about right now?",
//     "What gave you energy today?",
//     "How do you want to feel tomorrow?",
//   ];

//   // ✅ ENHANCED: Clear journal state when user changes (including logout)
//   useEffect(() => {
//     if (!user) {
//       // User logged out - clear all journal state
//       console.log('🧹 Journal: User logged out, clearing all state...');
//       setEntries([]);
//       setCurrentEntry("");
//       setIsWriting(false);
//       setEntryAnalysis(null);
//       setIsAnalyzing(false);
//       setTranscript("");
//       setInterimTranscript("");
//       if (isRecording && recognitionRef.current) {
//         recognitionRef.current.stop();
//         setIsRecording(false);
//       }
//       return;
//     }

//     // User logged in - load entries for current session
//     console.log('📖 Journal: Loading entries for user:', {
//       username: user.username,
//       isGuest: user.isGuest,
//       userId: user.userId,
//       sessionId: user.sessionId
//     });
    
//     loadEntries();
//     setDailyPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
//   }, [user]); // ✅ Trigger when user changes

//   useEffect(() => {
//     // ✅ UPDATED: Check Web Speech API support
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     setVoiceSupported(!!SpeechRecognition);
    
//     if (SpeechRecognition) {
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = true;
//       recognitionRef.current.interimResults = true;
//       recognitionRef.current.lang = 'en-US';

//       recognitionRef.current.onresult = (event) => {
//         let finalTranscript = '';
//         let interimTranscript = '';

//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           const result = event.results[i];
//           if (result.isFinal) {
//             finalTranscript += result[0].transcript + ' ';
//           } else {
//             interimTranscript += result[0].transcript;
//           }
//         }

//         if (finalTranscript) {
//           setTranscript(prev => prev + finalTranscript);
//         }
//         setInterimTranscript(interimTranscript);
//       };

//       recognitionRef.current.onerror = (event) => {
//         console.error('Speech recognition error:', event.error);
//         setIsRecording(false);
//         alert(`Voice recognition error: ${event.error}`);
//       };

//       recognitionRef.current.onend = () => {
//         setIsRecording(false);
//         setInterimTranscript('');
//       };
//     }
    
//     // Cleanup
//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//     };
//   }, []);

//   // ✅ UPDATED: Add transcript to current entry when it updates
//   useEffect(() => {
//     if (transcript) {
//       setCurrentEntry(prev => {
//         const newText = prev + (prev ? ' ' : '') + transcript;
//         return newText;
//       });
//       setTranscript(''); // Clear transcript after adding to entry
//     }
//   }, [transcript]);

//   // ✅ ENHANCED: Load entries with better session filtering and error handling
//   const loadEntries = async () => {
//     if (!user || !sessionManager) {
//       console.log('📖 Journal: No user or session manager, skipping load');
//       return;
//     }

//     try {
//       console.log('📖 Journal: Loading entries with headers:', sessionManager.getHeaders());
      
//       const response = await fetch(`${BACKEND_URL}/api/journal/entries`, {
//         headers: sessionManager.getHeaders(),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         const loadedEntries = data.entries || [];
//         setEntries(loadedEntries);
        
//         console.log(`✅ Journal: Loaded ${loadedEntries.length} entries for ${user.isGuest ? 'guest' : 'auth'} user:`, {
//           userId: user.userId,
//           sessionId: user.sessionId,
//           entries: loadedEntries.length
//         });
//       } else {
//         console.error('❌ Journal: Failed to load entries:', response.status, response.statusText);
//         setEntries([]); // Set empty on failure
//       }
//     } catch (error) {
//       console.error("❌ Journal: Error loading entries:", error);
//       setEntries([]); // Set empty on error
//     }
//   };

//   // ✅ ENHANCED: Save entry with better logging and session info
//   const saveEntry = async () => {
//     if (!currentEntry.trim()) return;

//     console.log('📝 Journal: Saving entry for user:', {
//       username: user.username,
//       isGuest: user.isGuest,
//       userId: user.userId,
//       sessionId: user.sessionId,
//       contentLength: currentEntry.length
//     });

//     setIsAnalyzing(true);
//     try {
//       const response = await fetch(`${BACKEND_URL}/api/journal/save`, {
//         method: "POST",
//         headers: sessionManager.getHeaders(),
//         body: JSON.stringify({
//           content: currentEntry,
//           date: selectedDate,
//           prompt: dailyPrompt,
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setEntries((prev) => [data.entry, ...prev]);
//         setEntryAnalysis(data.analysis || null);
//         setCurrentEntry("");
//         setIsWriting(false);
        
//         console.log('✅ Journal: Entry saved successfully for', user.isGuest ? 'guest' : 'auth', 'user');
//       } else {
//         console.error('❌ Journal: Failed to save entry:', response.status, response.statusText);
//         alert('Failed to save journal entry. Please try again.');
//       }
//     } catch (error) {
//       console.error("❌ Journal: Error saving entry:", error);
//       alert('Error saving journal entry. Please check your connection and try again.');
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   // ✅ ENHANCED: Delete entry with better error handling
//   const deleteEntry = async (entryId) => {
//     console.log('🗑️ Journal: Deleting entry:', entryId, 'for user:', user.userId);
    
//     try {
//       const response = await fetch(`${BACKEND_URL}/api/journal/${entryId}`, {
//         method: "DELETE",
//         headers: sessionManager.getHeaders(),
//       });

//       if (response.ok) {
//         setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
//         console.log('✅ Journal: Entry deleted successfully');
//       } else {
//         console.error('❌ Journal: Failed to delete entry:', response.status);
//         alert('Failed to delete journal entry. Please try again.');
//       }
//     } catch (error) {
//       console.error("❌ Journal: Error deleting entry:", error);
//       alert('Error deleting journal entry. Please check your connection and try again.');
//     }
//   };

//   // ✅ UPDATED: Use Web Speech API instead of MediaRecorder
//   const startRecording = () => {
//     if (!recognitionRef.current) {
//       alert('Speech recognition not supported in your browser. Please try Chrome or Edge.');
//       return;
//     }

//     try {
//       console.log('🎤 Starting voice recognition...');
//       recognitionRef.current.start();
//       setIsRecording(true);
//       setTranscript('');
//       setInterimTranscript('');
//     } catch (error) {
//       console.error('Error starting recognition:', error);
//       alert('Could not start voice recognition. Please try again.');
//     }
//   };

//   const stopRecording = () => {
//     if (recognitionRef.current && isRecording) {
//       console.log('🛑 Stopping voice recognition...');
//       recognitionRef.current.stop();
//       setIsRecording(false);
//       setInterimTranscript('');
//     }
//   };

//   const startVoiceJournaling = () => {
//     setIsWriting(true);
//     setTimeout(() => {
//       startRecording();
//     }, 500);
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("en-IN", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   // ✅ If no user, return empty component
//   if (!user) {
//     return null;
//   }

//   return (
//     <div className="h-full flex flex-col bg-gray-50">
//       {/* Header */}
//       <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <Edit3 className="w-6 h-6" />
//             <div>
//               <h1 className="text-2xl font-bold">My Private Journal</h1>
//               <p className="text-purple-100 text-sm">
//                 {user?.isGuest
//                   ? "Guest session - data auto-cleared on logout"
//                   : "Private session - data isolated"}
//               </p>
//             </div>
//           </div>
//           <div className="flex space-x-3">
//             <button
//               onClick={() => setIsWriting(true)}
//               className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300"
//             >
//               <Plus className="w-4 h-4" />
//               <span>Write Entry</span>
//             </button>
//             {voiceSupported && (
//               <button
//                 onClick={startVoiceJournaling}
//                 className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300"
//               >
//                 <Mic className="w-4 h-4" />
//                 <span>Voice Entry</span>
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Privacy Notice */}
//       <div className="flex-shrink-0 bg-green-50 border-b border-green-200 px-4 py-2">
//         <div className="flex items-center justify-center space-x-2 text-green-700">
//           <Shield className="w-4 h-4" />
//           <p className="text-xs">
//             🔐 Journal entries for {user?.username || "User"} - Completely isolated from other users
//             {user?.isGuest && " (auto-cleared when session ends)"}
//             {voiceSupported && " • 🎤 Browser voice recognition enabled"}
//           </p>
//         </div>
//       </div>

//       <div className="flex-1 flex overflow-hidden">
//         {/* Writing Panel */}
//         {isWriting && (
//           <div className="w-1/2 border-r border-gray-200 flex flex-col">
//             <div className="flex-shrink-0 p-4 border-b bg-white">
//               <h3 className="font-semibold text-gray-800 mb-2">
//                 Today's Reflection
//               </h3>
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
//                 <p className="text-sm text-blue-800 italic">
//                   💭 Prompt: {dailyPrompt}
//                 </p>
//               </div>
//               <input
//                 type="date"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 className="w-full p-2 border border-gray-300 rounded-lg"
//               />
//             </div>
            
//             <div className="flex-1 p-4 bg-white overflow-hidden">
//               <textarea
//                 value={currentEntry + (interimTranscript ? ` ${interimTranscript}` : '')}
//                 onChange={(e) => setCurrentEntry(e.target.value)}
//                 placeholder="Start writing or speaking your thoughts... How are you feeling today? Remember, this is your private space."
//                 className="w-full h-full resize-none border-none focus:outline-none text-gray-700 leading-relaxed"
//               />
              
//               {/* ✅ Show live transcription feedback */}
//               {isRecording && interimTranscript && (
//                 <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-700">
//                   <span className="font-medium">Live transcription:</span> {interimTranscript}
//                 </div>
//               )}
//             </div>
            
//             {/* ✅ UPDATED: Simplified voice controls using Web Speech API */}
//             <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 p-4">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-sm font-medium text-blue-800">
//                   🎤 Voice-to-Text (Browser)
//                 </span>
//                 <span className={`text-xs px-2 py-1 rounded-full ${
//                   voiceSupported 
//                     ? 'text-blue-600 bg-blue-100' 
//                     : 'text-red-600 bg-red-100'
//                 }`}>
//                   {voiceSupported ? 'Available' : 'Not Supported'}
//                 </span>
//               </div>
              
//               <div className="flex items-center space-x-2">
//                 {!isRecording ? (
//                   <button
//                     onClick={startRecording}
//                     disabled={!voiceSupported}
//                     className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
//                   >
//                     <Mic className="w-4 h-4" />
//                     <span>Start Speaking</span>
//                   </button>
//                 ) : (
//                   <button
//                     onClick={stopRecording}
//                     className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all animate-pulse"
//                   >
//                     <MicOff className="w-4 h-4" />
//                     <span>Stop Speaking</span>
//                   </button>
//                 )}
                
//                 {isRecording && (
//                   <div className="flex items-center space-x-2 text-red-500 animate-pulse">
//                     <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                     <span className="text-sm font-medium">Listening...</span>
//                   </div>
//                 )}
//               </div>
              
//               {!voiceSupported && (
//                 <p className="text-xs text-red-500 mt-2">
//                   Voice recognition requires Chrome, Edge, or Safari browser. Not available in Firefox.
//                 </p>
//               )}
              
//               {isRecording && (
//                 <p className="text-xs text-blue-600 mt-2">
//                   💬 Speak clearly and your words will appear in the text area above automatically
//                 </p>
//               )}
//             </div>
            
//             {/* ✅ FIXED: Complete button with proper JSX closing */}
//             <div className="flex-shrink-0 p-4 border-t bg-gray-50 flex justify-between items-center">
//               <span className="text-sm text-gray-500">
//                 {(currentEntry + interimTranscript).length} characters
//               </span>
//               <div className="flex space-x-2">
//                 <button
//                   onClick={() => {
//                     setIsWriting(false);
//                     if (isRecording) stopRecording();
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={saveEntry}
//                   disabled={!currentEntry.trim() || isAnalyzing}
//                   className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
//                 >
//                   {isAnalyzing ? (
//                     <>
//                       <Brain className="w-4 h-4 animate-pulse" />
//                       <span>Analyzing...</span>
//                     </>
//                   ) : (
//                     <>
//                       <Save className="w-4 h-4" />
//                       <span>Save & Analyze</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Entries List */}
//         <div className={`${isWriting ? "w-1/2" : "w-full"} flex flex-col`}>
//           <div className="flex-shrink-0 p-4 bg-white border-b">
//             <h3 className="font-semibold text-gray-800">Your Journal Entries</h3>
//             <p className="text-sm text-gray-600">
//               {entries.length} total entries - {user?.isGuest ? "Guest session" : "Private session"}
//             </p>
//           </div>
          
//           <div className="flex-1 overflow-y-auto p-4 space-y-4">
//             {entries.length === 0 ? (
//               <div className="text-center py-12">
//                 <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-600 mb-2">
//                   No entries yet
//                 </h3>
//                 <p className="text-gray-500 mb-4">
//                   Start journaling in your private, isolated space to track your mental wellness journey
//                 </p>
//                 <div className="flex justify-center space-x-3">
//                   <button
//                     onClick={() => setIsWriting(true)}
//                     className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
//                   >
//                     <Edit3 className="w-4 h-4" />
//                     <span>Write First Entry</span>
//                   </button>
//                   {voiceSupported && (
//                     <button
//                       onClick={startVoiceJournaling}
//                       className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
//                     >
//                       <Mic className="w-4 h-4" />
//                       <span>Speak Entry</span>
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               entries.map((entry) => (
//                 <div
//                   key={entry.id}
//                   className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
//                 >
//                   <div className="flex justify-between items-start mb-3">
//                     <div className="flex items-center space-x-2">
//                       <Calendar className="w-4 h-4 text-gray-500" />
//                       <span className="text-sm font-medium text-gray-700">
//                         {formatDate(entry.date)}
//                       </span>
//                     </div>
//                     <button
//                       onClick={() => deleteEntry(entry.id)}
//                       className="text-red-400 hover:text-red-600 transition-colors"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                   <p className="text-gray-700 leading-relaxed mb-3">
//                     {entry.content.substring(0, 200)}
//                     {entry.content.length > 200 && "..."}
//                   </p>
//                   {entry.analysis && (
//                     <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
//                       <div className="flex items-center space-x-2 mb-2">
//                         <Brain className="w-4 h-4 text-blue-600" />
//                         <span className="text-sm font-medium text-blue-800">
//                           AI Insights (Private)
//                         </span>
//                       </div>
//                       <div className="text-sm text-blue-700">
//                         <div className="flex items-center space-x-4">
//                           <span>
//                             Mood:{" "}
//                             <strong className="capitalize">
//                               {entry.analysis.mood}
//                             </strong>
//                           </span>
//                           <span>
//                             Sentiment:{" "}
//                             <strong>{entry.analysis.sentiment}</strong>
//                           </span>
//                         </div>
//                         {entry.analysis.keyThemes && (
//                           <div className="mt-2">
//                             <span>Themes: </span>
//                             <div className="flex flex-wrap gap-1 mt-1">
//                               {entry.analysis.keyThemes.map((theme, index) => (
//                                 <span
//                                   key={index}
//                                   className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
//                                 >
//                                   {theme}
//                                 </span>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Analysis Results Modal */}
//       {entryAnalysis && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg p-6 max-w-md w-full">
//             <div className="flex items-center space-x-2 mb-4">
//               <Brain className="w-6 h-6 text-purple-600" />
//               <h3 className="text-lg font-semibold">
//                 Private Entry Analysis Complete
//               </h3>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <span className="text-sm text-gray-600">Detected Mood:</span>
//                 <div className="flex items-center space-x-2 mt-1">
//                   <span className="text-2xl">{entryAnalysis.moodEmoji}</span>
//                   <span className="font-semibold capitalize">
//                     {entryAnalysis.mood}
//                   </span>
//                 </div>
//               </div>
//               <div>
//                 <span className="text-sm text-gray-600">Sentiment Score:</span>
//                 <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
//                   <div
//                     className="bg-purple-600 h-2 rounded-full transition-all"
//                     style={{
//                       width: `${Math.min(
//                         Math.abs(entryAnalysis.sentimentScore || 0) * 100,
//                         100
//                       )}%`,
//                     }}
//                   ></div>
//                 </div>
//                 <span className="text-sm text-gray-500">
//                   {entryAnalysis.sentiment}
//                 </span>
//               </div>
//               {entryAnalysis.insights && (
//                 <div>
//                   <span className="text-sm text-gray-600">AI Insights:</span>
//                   <p className="text-sm text-gray-700 mt-1">
//                     {entryAnalysis.insights}
//                   </p>
//                 </div>
//               )}
//             </div>
//             <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
//               <p className="text-xs text-green-700">
//                 🔐 This analysis is completely private and only visible to you
//               </p>
//             </div>
//             <button
//               onClick={() => setEntryAnalysis(null)}
//               className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
//             >
//               Continue
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Journal;




















// frontend/src/components/Journal.jsx
import React, { useState, useEffect, useRef } from "react";
import { Calendar, Edit3, Trash2, Plus, Brain, Save, Mic, MicOff, Volume2, Shield } from "lucide-react";

const BACKEND_URL = "http://localhost:3001";

function Journal({ user, sessionManager }) {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isWriting, setIsWriting] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState("");
  const [entryAnalysis, setEntryAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  
  const recognitionRef = useRef(null);

  const prompts = [
    "How did you handle any academic pressure today?",
    "What made you feel grateful today?",
    "Describe a moment when you felt truly yourself today.",
    "What challenges did you face with family expectations?",
    "How did you take care of your mental health today?",
    "What would you tell your younger self about today?",
    "How did you connect with others today?",
    "What are you worried about right now?",
    "What gave you energy today?",
    "How do you want to feel tomorrow?",
  ];

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setCurrentEntry("");
      setIsWriting(false);
      setEntryAnalysis(null);
      setIsAnalyzing(false);
      setTranscript("");
      setInterimTranscript("");
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
      return;
    }

    loadEntries();
    setDailyPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }, [user]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setInterimTranscript(interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        alert(`Voice recognition error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (transcript) {
      setCurrentEntry(prev => {
        const newText = prev + (prev ? ' ' : '') + transcript;
        return newText;
      });
      setTranscript('');
    }
  }, [transcript]);

  const loadEntries = async () => {
    if (!user || !sessionManager) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/journal/entries`, {
        headers: sessionManager.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const loadedEntries = data.entries || [];
        setEntries(loadedEntries);
        console.log(`✅ Journal: Loaded ${loadedEntries.length} entries`);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error("❌ Journal: Error loading entries:", error);
      setEntries([]);
    }
  };

  const saveEntry = async () => {
    if (!currentEntry.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/journal/save`, {
        method: "POST",
        headers: sessionManager.getHeaders(),
        body: JSON.stringify({
          content: currentEntry,
          date: selectedDate,
          prompt: dailyPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEntries((prev) => [data.entry, ...prev]);
        setEntryAnalysis(data.analysis || null);
        setCurrentEntry("");
        setIsWriting(false);
        console.log('✅ Journal: Entry saved successfully');
      } else {
        alert('Failed to save journal entry. Please try again.');
      }
    } catch (error) {
      console.error("❌ Journal: Error saving entry:", error);
      alert('Error saving journal entry. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/journal/${entryId}`, {
        method: "DELETE",
        headers: sessionManager.getHeaders(),
      });

      if (response.ok) {
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      } else {
        alert('Failed to delete journal entry. Please try again.');
      }
    } catch (error) {
      alert('Error deleting journal entry. Please check your connection and try again.');
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setTranscript('');
      setInterimTranscript('');
    } catch (error) {
      alert('Could not start voice recognition. Please try again.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript('');
    }
  };

  const startVoiceJournaling = () => {
    setIsWriting(true);
    setTimeout(() => {
      startRecording();
    }, 500);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ✅ CLEAN: Simple Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Private Journal</h1>
              <p className="text-sm text-gray-500">
                {user?.isGuest ? "Guest session" : "Private session"} - completely isolated
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsWriting(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Write Entry</span>
            </button>
            {voiceSupported && (
              <button
                onClick={startVoiceJournaling}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Mic className="w-4 h-4" />
                <span>Voice Entry</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex-shrink-0 bg-green-50 border-b border-green-100 px-6 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-center space-x-2 text-green-700">
          <Shield className="w-4 h-4" />
          <p className="text-xs">
            🔐 Your entries are completely private and isolated • 
            {voiceSupported && " 🎤 Voice recognition available"}
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ✅ CLEAN: Writing Panel */}
        {isWriting && (
          <div className="w-1/2 border-r border-gray-100 flex flex-col bg-white">
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Today's Reflection</h3>
              
              {/* Prompt */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-medium italic">💭 {dailyPrompt}</p>
              </div>
              
              {/* Date */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* ✅ LARGE Writing Area */}
            <div className="flex-1 p-6 overflow-hidden">
              <textarea
                value={currentEntry + (interimTranscript ? ` ${interimTranscript}` : '')}
                onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder="Start writing your thoughts... This is your private space."
                className="w-full h-full resize-none border-none focus:outline-none text-gray-900 text-lg leading-relaxed bg-transparent"
                style={{ fontSize: '18px', lineHeight: '1.6' }}
              />
              
              {/* Live Transcription */}
              {isRecording && interimTranscript && (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-blue-800">Live transcription</span>
                  </div>
                  <p className="text-sm text-blue-700">{interimTranscript}</p>
                </div>
              )}
            </div>
            
            {/* ✅ MINIMAL Voice Controls */}
            {voiceSupported && (
              <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Voice-to-Text</span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Available</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Start Speaking
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors animate-pulse"
                      >
                        Stop Speaking
                      </button>
                    )}
                    
                    {isRecording && (
                      <div className="flex items-center space-x-1 text-red-600">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">Listening...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* ✅ CLEAN Bottom Bar */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {(currentEntry + interimTranscript).length} characters
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setIsWriting(false);
                      if (isRecording) stopRecording();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEntry}
                    disabled={!currentEntry.trim() || isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <Brain className="w-4 h-4 animate-pulse" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Analyze</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ CLEAN: Entries List */}
        <div className={`${isWriting ? "w-1/2" : "w-full"} flex flex-col bg-gray-50`}>
          <div className="flex-shrink-0 p-6 bg-white border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Your Journal Entries</h3>
            <p className="text-sm text-gray-500">
              {entries.length} entries - {user?.isGuest ? "Guest session" : "Private session"}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit3 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
                <p className="text-gray-500 mb-6">Start journaling in your private space</p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setIsWriting(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Write First Entry</span>
                  </button>
                  {voiceSupported && (
                    <button
                      onClick={startVoiceJournaling}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Speak Entry</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-900 mb-3 leading-relaxed">
                      {entry.content.substring(0, 200)}
                      {entry.content.length > 200 && "..."}
                    </p>
                    {entry.analysis && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">AI Insights</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          <div className="flex space-x-4">
                            <span>Mood: <strong className="capitalize">{entry.analysis.mood}</strong></span>
                            <span>Sentiment: <strong>{entry.analysis.sentiment}</strong></span>
                          </div>
                          {entry.analysis.keyThemes && (
                            <div className="mt-2">
                              <span>Themes: </span>
                              <div className="inline-flex flex-wrap gap-1 mt-1">
                                {entry.analysis.keyThemes.map((theme, index) => (
                                  <span
                                    key={index}
                                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                  >
                                    {theme}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results Modal */}
      {entryAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold">Analysis Complete</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Detected Mood:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">{entryAnalysis.moodEmoji}</span>
                  <span className="font-semibold capitalize">{entryAnalysis.mood}</span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Sentiment Score:</span>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(Math.abs(entryAnalysis.sentimentScore || 0) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">{entryAnalysis.sentiment}</span>
              </div>
              {entryAnalysis.insights && (
                <div>
                  <span className="text-sm text-gray-600">AI Insights:</span>
                  <p className="text-sm text-gray-700 mt-1">{entryAnalysis.insights}</p>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                🔐 This analysis is completely private and only visible to you
              </p>
            </div>
            <button
              onClick={() => setEntryAnalysis(null)}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Journal;
