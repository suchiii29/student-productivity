// src/pages/Goals.tsx

import { Target } from "lucide-react";
import GoalTracker from "@/components/GoalTracker";

const Goals = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-6 rounded-2xl border">
        <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl text-white">
          <Target className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">
            Set meaningful goals and track your progress over time
          </p>
        </div>
      </div>
      <GoalTracker />
    </div>
  );
};

export default Goals;  // ← Make sure this line exists!