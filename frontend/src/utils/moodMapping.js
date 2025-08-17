// frontend/src/utils/moodMapping.js

export const MOOD_MAPPING = {
  "joyful": { emoji: "😄", label: "Joyful", color: "bg-green-100 text-green-800", description: "Feeling very happy and positive" },
  "happy": { emoji: "😊", label: "Happy", color: "bg-green-100 text-green-700", description: "In a good mood" },
  "excited": { emoji: "🤩", label: "Excited", color: "bg-yellow-100 text-yellow-800", description: "Energetic and enthusiastic" },
  "proud": { emoji: "😌", label: "Proud", color: "bg-purple-100 text-purple-700", description: "Feeling accomplished" },
  "content": { emoji: "😊", label: "Content", color: "bg-blue-100 text-blue-700", description: "Peaceful and satisfied" },
  "grateful": { emoji: "🙏", label: "Grateful", color: "bg-indigo-100 text-indigo-700", description: "Appreciative and thankful" },
  "focused": { emoji: "🎯", label: "Focused", color: "bg-cyan-100 text-cyan-700", description: "Concentrated on goals" },
  "sad": { emoji: "😢", label: "Sad", color: "bg-blue-100 text-blue-600", description: "Feeling down or melancholic" },
  "distressed": { emoji: "😰", label: "Distressed", color: "bg-red-100 text-red-600", description: "Experiencing emotional pain" },
  "anxious": { emoji: "😟", label: "Anxious", color: "bg-yellow-100 text-yellow-600", description: "Worried and nervous" },
  "academic_anxiety": { emoji: "📚", label: "Study Stressed", color: "bg-orange-100 text-orange-600", description: "Stressed about academics" },
  "stressed": { emoji: "😤", label: "Stressed", color: "bg-red-100 text-red-600", description: "Under pressure" },
  "angry": { emoji: "😠", label: "Angry", color: "bg-red-200 text-red-700", description: "Feeling frustrated or mad" },
  "fearful": { emoji: "😨", label: "Fearful", color: "bg-gray-100 text-gray-600", description: "Scared or afraid" },
  "exhausted": { emoji: "😴", label: "Exhausted", color: "bg-gray-100 text-gray-600", description: "Physically or mentally tired" },
  "confused": { emoji: "😕", label: "Confused", color: "bg-purple-100 text-purple-600", description: "Uncertain or puzzled" },
  "hopeless": { emoji: "😞", label: "Hopeless", color: "bg-gray-200 text-gray-700", description: "Feeling like giving up" },
  "lonely": { emoji: "😔", label: "Lonely", color: "bg-indigo-100 text-indigo-600", description: "Feeling isolated" },
  "frustrated": { emoji: "😣", label: "Frustrated", color: "bg-orange-100 text-orange-600", description: "Annoyed with situations" },
  "conflicted": { emoji: "😐", label: "Conflicted", color: "bg-yellow-100 text-yellow-600", description: "Torn between options" },
  "neutral": { emoji: "😐", label: "Neutral", color: "bg-gray-100 text-gray-600", description: "Balanced emotional state" },
};

export const getMoodInfo = (mood) => {
  return MOOD_MAPPING[mood] || MOOD_MAPPING["neutral"];
};
