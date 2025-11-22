// src/components/AddLogModal.tsx
import { useState } from "react";
import { X } from "lucide-react";
import { db } from "@/firebase";
import { ref, push, set } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AddLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLogModal({ open, onOpenChange }: AddLogModalProps) {
  const { uid } = useAuth();
  const { toast } = useToast();
  
  const [sleepHours, setSleepHours] = useState(7);
  const [studyHours, setStudyHours] = useState(4);
  const [exerciseMinutes, setExerciseMinutes] = useState(30);
  const [breaks, setBreaks] = useState(3);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const calculateScore = (
    sleep: number,
    study: number,
    exercise: number,
    brk: number
  ) => {
    let score = 0;
    score += Math.min(sleep * 10, 20); // Max 20 points for sleep
    score += Math.min(study * 12, 40); // Max 40 points for study
    score += Math.min(exercise / 10, 15); // Max 15 points for exercise
    score += Math.max(15 - brk * 3, 0); // Penalty for too many breaks
    return Math.min(Math.max(score, 0), 100);
  };

  const generateRecommendation = (score: number) => {
    if (score >= 85) return "Excellent day — stay consistent! 🌟";
    if (score >= 70) return "Good day — small improvements can make it perfect. 💪";
    if (score >= 50) return "Average day — try improving sleep & focus. 📚";
    return "Low productivity — fix sleep schedule & reduce distractions. ⚠️";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uid) {
      toast({ variant: "destructive", title: "Please log in first" });
      return;
    }

    setLoading(true);

    try {
      const score = calculateScore(sleepHours, studyHours, exerciseMinutes, breaks);
      const today = new Date().toISOString().slice(0, 10);

      const logData = {
        date: today,
        sleepHours,
        studyHours,
        exerciseMinutes,
        breaks,
        score,
        productivityScore: score,
        verdict: score >= 70 ? "Productive ✅" : "Needs Improvement 📈",
        recommendation: generateRecommendation(score),
        userId: uid,
        createdAt: new Date().toISOString(),
      };

      // Save to user-specific path
      const logsRef = ref(db, `routineLogs/${uid}`);
      const newLogRef = push(logsRef);
      await set(newLogRef, logData);

      toast({ 
        title: "✅ Log saved successfully!",
        description: `Productivity Score: ${score}%`
      });

      // Reset form
      setSleepHours(7);
      setStudyHours(4);
      setExerciseMinutes(30);
      setBreaks(3);
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving log:", error);
      toast({ 
        variant: "destructive",
        title: "Failed to save log",
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const currentScore = calculateScore(sleepHours, studyHours, exerciseMinutes, breaks);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Add Routine Log</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track your daily productivity metrics
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sleep Hours */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Sleep Hours 😴</label>
              <span className="text-2xl font-bold text-indigo-600">{sleepHours}h</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0h</span>
              <span>12h</span>
            </div>
          </div>

          {/* Study Hours */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Study Hours 📚</label>
              <span className="text-2xl font-bold text-indigo-600">{studyHours}h</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={studyHours}
              onChange={(e) => setStudyHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0h</span>
              <span>12h</span>
            </div>
          </div>

          {/* Exercise Minutes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Exercise Minutes 💪</label>
              <span className="text-2xl font-bold text-indigo-600">{exerciseMinutes} min</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Breaks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Number of Breaks ☕</label>
              <span className="text-2xl font-bold text-indigo-600">{breaks}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={breaks}
              onChange={(e) => setBreaks(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>10</span>
            </div>
          </div>

          {/* Productivity Preview */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Predicted Productivity Score
              </div>
              <div className="text-6xl font-extrabold text-indigo-600 mb-2">
                {currentScore}%
              </div>
              <div className="text-sm text-muted-foreground">
                {generateRecommendation(currentScore)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}