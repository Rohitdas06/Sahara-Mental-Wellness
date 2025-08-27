// // frontend/src/components/Journal.jsx
// import React, { useState, useEffect } from "react";
// import { Calendar, Edit3, Trash2, Plus, Brain, Save, Mic, MicOff, Volume2 } from "lucide-react";

// const BACKEND_URL = "http://localhost:3001";

// function Journal() {
//   const [entries, setEntries] = useState([]);
//   const [currentEntry, setCurrentEntry] = useState("");
//   const [selectedDate, setSelectedDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );
//   const [isWriting, setIsWriting] = useState(false);
//   const [dailyPrompt, setDailyPrompt] = useState("");
//   const [entryAnalysis, setEntryAnalysis] = useState(null);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);

//   // Voice recording states
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioBlob, setAudioBlob] = useState(null);
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const [isTranscribing, setIsTranscribing] = useState(false);

//   // Daily prompts based on Indian context
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

//   useEffect(() => {
//     loadEntries();
//     setDailyPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
//     // eslint-disable-next-line
//   }, []);

//   const loadEntries = async () => {
//     try {
//       const response = await fetch(`${BACKEND_URL}/api/journal/entries`);
//       if (response.ok) {
//         const data = await response.json();
//         setEntries(data.entries || []);
//       }
//     } catch (error) {
//       console.error("Error loading journal entries:", error);
//     }
//   };

//   const saveEntry = async () => {
//     if (!currentEntry.trim()) return;

//     setIsAnalyzing(true);
//     try {
//       const response = await fetch(`${BACKEND_URL}/api/journal/save`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
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
//         console.log("📝 Journal entry saved with AI analysis");
//       }
//     } catch (error) {
//       console.error("Error saving journal entry:", error);
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   const deleteEntry = async (entryId) => {
//     try {
//       const response = await fetch(`${BACKEND_URL}/api/journal/${entryId}`, {
//         method: "DELETE",
//       });

//       if (response.ok) {
//         setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
//       }
//     } catch (error) {
//       console.error("Error deleting entry:", error);
//     }
//   };

//   // Voice recording functions
//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const recorder = new MediaRecorder(stream);
//       const chunks = [];

//       recorder.ondataavailable = (e) => chunks.push(e.data);
//       recorder.onstop = () => {
//         const blob = new Blob(chunks, { type: 'audio/wav' });
//         setAudioBlob(blob);
//       };

//       setMediaRecorder(recorder);
//       recorder.start();
//       setIsRecording(true);
//     } catch (error) {
//       console.error('Error starting recording:', error);
//       alert('Please allow microphone access to use voice journaling');
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorder) {
//       mediaRecorder.stop();
//       mediaRecorder.stream.getTracks().forEach(track => track.stop());
//       setIsRecording(false);
//     }
//   };

//   const transcribeAudio = async () => {
//     if (!audioBlob) return;

//     setIsTranscribing(true);
//     try {
//       const formData = new FormData();
//       formData.append('audio', audioBlob, 'recording.wav');

//       const response = await fetch(`${BACKEND_URL}/api/journal/transcribe`, {
//         method: 'POST',
//         body: formData
//       });

//       if (response.ok) {
//         const { transcription } = await response.json();
//         setCurrentEntry(prev => prev + (prev ? ' ' : '') + transcription);
//         setAudioBlob(null);
//       } else {
//         throw new Error('Transcription failed');
//       }
//     } catch (error) {
//       console.error('Error transcribing audio:', error);
//       alert('Error transcribing audio. Please try again.');
//     } finally {
//       setIsTranscribing(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("en-IN", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   return (
//     <div className="h-full flex flex-col bg-gray-50">
//       {/* Header */}
//       <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <Edit3 className="w-6 h-6" />
//             <h1 className="text-2xl font-bold">My Journal</h1>
//           </div>
//           <button
//             onClick={() => setIsWriting(true)}
//             className="bg-transparent hover:scale-105 border border-white border-opacity-30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 ease-in-out transform"
//           >
//             <Plus className="w-4 h-4" />
//             <span>New Entry</span>
//           </button>
//         </div>
//       </div>

//       <div className="flex-1 overflow-hidden flex">
//         {/* Writing Panel */}
//         {isWriting && (
//           <div className="w-1/2 border-r border-gray-200 flex flex-col">
//             <div className="p-4 border-b bg-white">
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
            
//             <div className="flex-1 p-4 bg-white">
//               <textarea
//                 value={currentEntry}
//                 onChange={(e) => setCurrentEntry(e.target.value)}
//                 placeholder="Start writing your thoughts... How are you feeling today?"
//                 className="w-full h-full resize-none border-none focus:outline-none text-gray-700 leading-relaxed"
//               />
              
//               {/* Voice Recording Controls */}
//               <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
//                 {!isRecording ? (
//                   <button
//                     onClick={startRecording}
//                     className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105"
//                   >
//                     <Mic className="w-4 h-4" />
//                     <span>Start Voice Recording</span>
//                   </button>
//                 ) : (
//                   <button
//                     onClick={stopRecording}
//                     className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all animate-pulse"
//                   >
//                     <MicOff className="w-4 h-4" />
//                     <span>Stop Recording</span>
//                   </button>
//                 )}
                
//                 {audioBlob && (
//                   <button
//                     onClick={transcribeAudio}
//                     disabled={isTranscribing}
//                     className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all disabled:opacity-50 transform hover:scale-105"
//                   >
//                     <Volume2 className="w-4 h-4" />
//                     <span>{isTranscribing ? 'Transcribing...' : 'Add to Journal'}</span>
//                   </button>
//                 )}
                
//                 {isRecording && (
//                   <div className="flex items-center space-x-2 text-red-500 animate-pulse">
//                     <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                     <span className="text-sm">Recording...</span>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
//               <span className="text-sm text-gray-500">
//                 {currentEntry.length} characters
//               </span>
//               <div className="flex space-x-2">
//                 <button
//                   onClick={() => setIsWriting(false)}
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
//           <div className="p-4 bg-white border-b">
//             <h3 className="font-semibold text-gray-800">Journal Entries</h3>
//             <p className="text-sm text-gray-600">
//               {entries.length} total entries
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
//                   Start journaling to track your mental wellness journey
//                 </p>
//                 <button
//                   onClick={() => setIsWriting(true)}
//                   className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
//                 >
//                   Write Your First Entry
//                 </button>
//               </div>
//             ) : (
//               entries.map((entry) => (
//                 <div
//                   key={entry.id}
//                   className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
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
//                       className="text-red-400 hover:text-red-600"
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
//                           AI Insights
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
//               <h3 className="text-lg font-semibold">Entry Analysis Complete</h3>
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
import React, { useState, useEffect } from "react";
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
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

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
    loadEntries();
    setDailyPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }, []);

  const loadEntries = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/journal/entries`, {
        headers: sessionManager.getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        console.log(`📖 Loaded ${data.entries?.length || 0} journal entries for ${data.isGuest ? 'guest' : 'user'}: ${data.userId || 'unknown'}`);
      }
    } catch (error) {
      console.error("Error loading journal entries:", error);
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
        console.log(`📝 Journal entry saved for ${data.isGuest ? 'guest' : 'user'} with AI analysis`);
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/journal/${entryId}`, {
        method: "DELETE",
        headers: sessionManager.getHeaders()
      });

      if (response.ok) {
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
        console.log('🗑️ Journal entry deleted');
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Please allow microphone access to use voice journaling');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch(`${BACKEND_URL}/api/journal/transcribe`, {
        method: 'POST',
        headers: {
          ...sessionManager.getHeaders(),
          // Remove Content-Type to let FormData set it with boundary
        },
        body: formData
      });

      if (response.ok) {
        const { transcription } = await response.json();
        setCurrentEntry(prev => prev + (prev ? ' ' : '') + transcription);
        setAudioBlob(null);
        console.log('🎤 Voice transcription successful');
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Error transcribing audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long", 
      day: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Edit3 className="w-6 h-6" />
            <div>
              <h1 className="text-2xl font-bold">My Private Journal</h1>
              <p className="text-purple-100 text-sm">
                {user?.isGuest ? 'Guest session - data auto-cleared on logout' : 'Private session - data isolated'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWriting(true)}
            className="bg-transparent hover:scale-105 border border-white border-opacity-30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 ease-in-out transform"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex-shrink-0 bg-green-50 border-b border-green-200 px-4 py-2">
        <div className="flex items-center justify-center space-x-2 text-green-700">
          <Shield className="w-4 h-4" />
          <p className="text-xs">
            🔐 Journal entries for {user?.username || 'User'} - Completely isolated from other users
            {user?.isGuest && ' (auto-cleared when session ends)'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Writing Panel */}
        {isWriting && (
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b bg-white">
              <h3 className="font-semibold text-gray-800 mb-2">
                Today's Reflection
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 italic">
                  💭 Prompt: {dailyPrompt}
                </p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div className="flex-1 p-4 bg-white">
              <textarea
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder="Start writing your thoughts... How are you feeling today? Remember, this is your private space."
                className="w-full h-full resize-none border-none focus:outline-none text-gray-700 leading-relaxed"
              />
              
              {/* Voice Recording Controls */}
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Voice Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all animate-pulse"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </button>
                )}
                
                {audioBlob && (
                  <button
                    onClick={transcribeAudio}
                    disabled={isTranscribing}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all disabled:opacity-50 transform hover:scale-105"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isTranscribing ? 'Transcribing...' : 'Add to Journal'}</span>
                  </button>
                )}
                
                {isRecording && (
                  <div className="flex items-center space-x-2 text-red-500 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Recording...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {currentEntry.length} characters
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsWriting(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  disabled={!currentEntry.trim() || isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
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
        )}

        {/* Entries List */}
        <div className={`${isWriting ? "w-1/2" : "w-full"} flex flex-col`}>
          <div className="p-4 bg-white border-b">
            <h3 className="font-semibold text-gray-800">Your Journal Entries</h3>
            <p className="text-sm text-gray-600">
              {entries.length} total entries - {user?.isGuest ? 'Guest session' : 'Private session'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No entries yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start journaling in your private, isolated space to track your mental wellness journey
                </p>
                <button
                  onClick={() => setIsWriting(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                >
                  Write Your First Entry
                </button>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    {entry.content.substring(0, 200)}
                    {entry.content.length > 200 && "..."}
                  </p>
                  {entry.analysis && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          AI Insights (Private)
                        </span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <div className="flex items-center space-x-4">
                          <span>
                            Mood:{" "}
                            <strong className="capitalize">
                              {entry.analysis.mood}
                            </strong>
                          </span>
                          <span>
                            Sentiment:{" "}
                            <strong>{entry.analysis.sentiment}</strong>
                          </span>
                        </div>
                        {entry.analysis.keyThemes && (
                          <div className="mt-2">
                            <span>Themes: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results Modal */}
      {entryAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold">Private Entry Analysis Complete</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Detected Mood:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">{entryAnalysis.moodEmoji}</span>
                  <span className="font-semibold capitalize">
                    {entryAnalysis.mood}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Sentiment Score:</span>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        Math.abs(entryAnalysis.sentimentScore || 0) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">
                  {entryAnalysis.sentiment}
                </span>
              </div>
              {entryAnalysis.insights && (
                <div>
                  <span className="text-sm text-gray-600">AI Insights:</span>
                  <p className="text-sm text-gray-700 mt-1">
                    {entryAnalysis.insights}
                  </p>
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
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
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
