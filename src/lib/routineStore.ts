import { db } from "@/firebase";
import { ref, push } from "firebase/database";

export type RoutineEntry = {
  id?: string;
  date: string;
  sleepHours: number;
  studyHours: number;
  exerciseMinutes: number;
  breaks: number;
  score: number;
  verdict: string;
  recommendation: string;
};

const calculateScore = (
  sleepHours: number,
  studyHours: number,
  exerciseMinutes: number,
  breaks: number
) => {
  let score = 0;

  score += Math.min(sleepHours * 10, 20);
  score += Math.min(studyHours * 12, 40);
  score += Math.min(exerciseMinutes / 10, 15);
  score += Math.max(15 - breaks * 3, 0);

  return Math.min(Math.max(score, 0), 100);
};

const generateRecommendation = (score: number) => {
  if (score >= 85) return "Excellent day — stay consistent!";
  if (score >= 70) return "Good day — small improvements can make it perfect.";
  if (score >= 50) return "Average day — try improving sleep & focus.";
  return "Low productivity — fix sleep schedule & reduce distractions.";
};

export const saveRoutineEntry = (entry: {
  sleepHours: number;
  studyHours: number;
  exerciseMinutes: number;
  breaks: number;
}) => {
  const score = calculateScore(
    entry.sleepHours,
    entry.studyHours,
    entry.exerciseMinutes,
    entry.breaks
  );

  const newEntry: RoutineEntry = {
    ...entry,
    date: new Date().toISOString(),
    score,
    verdict: score >= 70 ? "Productive" : "Needs Improvement",
    recommendation: generateRecommendation(score),
  };

  return push(ref(db, "routineLogs"), newEntry);
};
