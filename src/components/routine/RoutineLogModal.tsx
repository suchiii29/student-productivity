// src/components/routine/RoutineLogModal.tsx - FIXED VERSION
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ref, push, set } from "firebase/database";
import { db } from "@/firebase";

interface RoutineLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoutineLogModal = ({ open, onOpenChange }: RoutineLogModalProps) => {
  const { toast } = useToast();
  const { uid } = useAuth();
  const [sleepHours, setSleepHours] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState("");
  const [breaks, setBreaks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate productivity score based on inputs
  const calculateScore = (sleep: number, study: number, exercise: number, breakCount: number) => {
    let score = 0;

    // Sleep scoring (30 points max)
    if (sleep >= 7 && sleep <= 9) score += 30;
    else if (sleep >= 6 && sleep < 7) score += 20;
    else if (sleep >= 5 && sleep < 6) score += 10;
    else score += 5;

    // Study scoring (40 points max)
    if (study >= 6) score += 40;
    else if (study >= 4) score += 30;
    else if (study >= 2) score += 20;
    else score += 10;

    // Exercise scoring (20 points max)
    if (exercise >= 30) score += 20;
    else if (exercise >= 15) score += 15;
    else if (exercise >= 5) score += 10;
    else score += 5;

    // Breaks scoring (10 points max)
    if (breakCount >= 4 && breakCount <= 8) score += 10;
    else if (breakCount >= 2) score += 7;
    else score += 3;

    return Math.min(100, score);
  };

  // Generate verdict based on score
  const getVerdict = (score: number) => {
    if (score >= 85) return "Excellent! You're crushing it! 🔥";
    if (score >= 70) return "Great work! Keep it up! 💪";
    if (score >= 55) return "Good effort, room for improvement 👍";
    if (score >= 40) return "You can do better! 💡";
    return "Let's focus on building better habits 🌱";
  };

  // Generate recommendation based on inputs
  const getRecommendation = (sleep: number, study: number, exercise: number, breakCount: number) => {
    const recommendations = [];

    if (sleep < 7) recommendations.push("Try to get 7-8 hours of sleep");
    if (study < 4) recommendations.push("Increase study time to at least 4 hours");
    if (exercise < 30) recommendations.push("Add 30 minutes of exercise daily");
    if (breakCount < 4) recommendations.push("Take more frequent breaks to avoid burnout");

    if (recommendations.length === 0) {
      return "Maintain this excellent routine! 🎉";
    }

    return recommendations.join(" • ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid) {
      toast({
        title: "Error",
        description: "You must be logged in to save a routine log",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const sleep = Number(sleepHours);
      const study = Number(studyHours);
      const exercise = Number(exerciseMinutes);
      const breakCount = Number(breaks);

      const score = calculateScore(sleep, study, exercise, breakCount);
      const verdict = getVerdict(score);
      const recommendation = getRecommendation(sleep, study, exercise, breakCount);

      const todayDate = new Date().toISOString().slice(0, 10);

      // Save to user-specific path
      const logsRef = ref(db, `routineLogs/${uid}`);
      const newLogRef = push(logsRef);

      await set(newLogRef, {
        date: todayDate,
        sleepHours: sleep,
        studyHours: study,
        exerciseMinutes: exercise,
        breaks: breakCount,
        score: score,
        productivityScore: score,
        verdict: verdict,
        recommendation: recommendation,
        timestamp: Date.now(),
        userId: uid,
      });

      toast({
        title: "✅ Routine logged successfully!",
        description: `Your productivity score: ${score}/100 - ${verdict}`,
      });

      // Reset fields
      setSleepHours("");
      setStudyHours("");
      setExerciseMinutes("");
      setBreaks("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving routine log:", error);
      toast({
        title: "❌ Failed to save log",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Routine Log</DialogTitle>
          <DialogDescription>
            Track today's habits and get your productivity score
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sleep">Sleep Hours</Label>
            <Input
              id="sleep"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g., 7.5"
              required
            />
            <p className="text-xs text-muted-foreground">Recommended: 7-9 hours</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="study">Study Hours</Label>
            <Input
              id="study"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={studyHours}
              onChange={(e) => setStudyHours(e.target.value)}
              placeholder="e.g., 6"
              required
            />
            <p className="text-xs text-muted-foreground">Target: 4-8 hours</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exercise">Exercise (minutes)</Label>
            <Input
              id="exercise"
              type="number"
              min="0"
              max="600"
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(e.target.value)}
              placeholder="e.g., 30"
              required
            />
            <p className="text-xs text-muted-foreground">Minimum: 30 minutes</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breaks">Number of Breaks</Label>
            <Input
              id="breaks"
              type="number"
              min="0"
              max="50"
              value={breaks}
              onChange={(e) => setBreaks(e.target.value)}
              placeholder="e.g., 5"
              required
            />
            <p className="text-xs text-muted-foreground">Ideal: 4-8 breaks</p>
          </div>

          {/* Preview Score */}
          {sleepHours && studyHours && exerciseMinutes && breaks && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                Preview Score:{" "}
                <span className="text-2xl">
                  {calculateScore(
                    Number(sleepHours),
                    Number(studyHours),
                    Number(exerciseMinutes),
                    Number(breaks)
                  )}
                  /100
                </span>
              </div>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                {getVerdict(
                  calculateScore(
                    Number(sleepHours),
                    Number(studyHours),
                    Number(exerciseMinutes),
                    Number(breaks)
                  )
                )}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoutineLogModal;