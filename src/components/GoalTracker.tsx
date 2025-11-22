// src/components/GoalTracker.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Target, Plus, TrendingUp, CheckCircle2, 
  Trash2, Edit2, ChevronRight, Award
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Goal, subscribeToGoals, createGoal, updateGoal, 
  deleteGoal, addProgress, calculateGoalStats 
} from "@/services/goalServices";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "academic", label: "Academic", color: "bg-blue-500" },
  { value: "health", label: "Health", color: "bg-green-500" },
  { value: "skill", label: "Skill", color: "bg-purple-500" },
  { value: "personal", label: "Personal", color: "bg-orange-500" },
];

const GoalTracker = () => {
  const { uid } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "academic" as Goal["category"],
    targetValue: "",
    unit: "hours",
    deadline: "",
  });

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToGoals(uid, setGoals);
    return unsub;
  }, [uid]);

  const stats = calculateGoalStats(goals);

  const handleCreateGoal = async () => {
    if (!uid || !form.title || !form.targetValue || !form.deadline) return;

    await createGoal(uid, {
      title: form.title,
      description: form.description,
      category: form.category,
      targetValue: Number(form.targetValue),
      unit: form.unit,
      deadline: form.deadline,
    });

    setForm({
      title: "",
      description: "",
      category: "academic",
      targetValue: "",
      unit: "hours",
      deadline: "",
    });
    setIsAddOpen(false);
  };

  const handleAddProgress = async (goalId: string) => {
    if (!uid || !progressValue) return;
    
    const value = Number(progressValue);
    if (isNaN(value) || value <= 0) {
      alert("Please enter a valid positive number");
      return;
    }
    
    try {
      await addProgress(uid, goalId, value);
      setSelectedGoalId(null);
      setProgressValue("");
    } catch (error) {
      console.error("Error adding progress:", error);
      alert("Failed to add progress. Please try again.");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!uid) return;
    if (confirm("Are you sure you want to delete this goal?")) {
      await deleteGoal(uid, goalId);
    }
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || "bg-gray-500";
  };

  const getProgressPercent = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Goals</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgProgress}%</p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Your Goals
        </h2>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Goal title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <Input
                placeholder="Description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              <Select
                value={form.category}
                onValueChange={v => setForm(f => ({ ...f, category: v as Goal["category"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Target"
                  value={form.targetValue}
                  onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  placeholder="Unit"
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-24"
                />
              </div>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              />
              <Button onClick={handleCreateGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Dialog - Single dialog outside the map */}
      <Dialog 
        open={selectedGoalId !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedGoalId(null);
            setProgressValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Progress</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium mb-1">{selectedGoal.title}</p>
                <p className="text-sm text-muted-foreground">
                  Current: {selectedGoal.currentValue} / {selectedGoal.targetValue} {selectedGoal.unit}
                </p>
              </div>
              <Input
                type="number"
                placeholder={`Add ${selectedGoal.unit}`}
                value={progressValue}
                onChange={e => setProgressValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && progressValue) {
                    handleAddProgress(selectedGoal.id);
                  }
                }}
                autoFocus
              />
              <Button 
                onClick={() => handleAddProgress(selectedGoal.id)} 
                className="w-full"
                disabled={!progressValue}
              >
                Add Progress
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No goals yet. Create your first goal!</p>
          </Card>
        ) : (
          goals.map(goal => (
            <Card key={goal.id} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${getCategoryColor(goal.category)}`} />
                      <h3 className="font-medium">{goal.title}</h3>
                      {goal.status === "completed" && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    )}
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                        <span>{Math.round(getProgressPercent(goal))}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            goal.status === "completed" ? "bg-green-500" : "bg-indigo-600"
                          }`}
                          style={{ width: `${getProgressPercent(goal)}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {goal.status !== "completed" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setProgressValue("");
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Progress
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default GoalTracker;