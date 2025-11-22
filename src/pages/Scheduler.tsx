// src/pages/Scheduler.tsx - SMART AI SCHEDULER
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Plus, Pencil, Trash2, Sparkles, Brain } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore, db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface TimeBlock {
  id: string;
  time: string;
  task: string;
  type: "study" | "break" | "class" | "exercise";
  suggested?: boolean;
  taskId?: string;
}

interface Task {
  id: string;
  title: string;
  duration?: number;
  priority?: string;
  deadline?: string;
  category?: string;
  status?: string;
}

const Scheduler = () => {
  const { uid, isLoggedIn, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [formData, setFormData] = useState({
    time: "",
    task: "",
    type: "study" as "study" | "break" | "class" | "exercise",
  });

  // Load tasks from Firebase
  useEffect(() => {
    if (!uid) return;

    const tasksRef = ref(db, `tasks/${uid}`);
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.entries(data).map(([id, task]: any) => ({ id, ...task }));
        setTasks(arr);
      }
    });

    return () => unsubscribe();
  }, [uid]);

  // Load schedule when user or date changes
  useEffect(() => {
    if (authLoading) return;
    if (uid) {
      loadSchedule(uid, selectedDate);
    } else {
      setLoading(false);
    }
  }, [uid, authLoading, selectedDate]);

  const loadSchedule = async (userId: string, date: string) => {
    setLoading(true);
    try {
      const docRef = doc(firestore, "schedules", `${userId}_${date}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSchedule(docSnap.data().blocks || []);
      } else {
        setSchedule([]);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async (newSchedule: TimeBlock[]) => {
    if (!uid) return;

    try {
      const docRef = doc(firestore, "schedules", `${uid}_${selectedDate}`);
      await setDoc(docRef, {
        userId: uid,
        date: selectedDate,
        blocks: newSchedule,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "Failed to save schedule",
        variant: "destructive",
      });
    }
  };

  // SMART SCHEDULING ALGORITHM
  const generateSmartSchedule = () => {
    setGenerating(true);

    setTimeout(() => {
      const pendingTasks = tasks.filter(t => t.status !== "completed");
      const smartSchedule: TimeBlock[] = [];
      let currentHour = 6; // Start at 6 AM
      let currentMinute = 30;

      // Helper to format time
      const formatTime = (hour: number, minute: number) => {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };

      // Helper to add time block
      const addBlock = (duration: number, task: string, type: TimeBlock['type'], taskId?: string, suggested = false) => {
        const startTime = formatTime(currentHour, currentMinute);
        
        // Calculate end time
        let endMinute = currentMinute + duration;
        let endHour = currentHour;
        
        if (endMinute >= 60) {
          endHour += Math.floor(endMinute / 60);
          endMinute = endMinute % 60;
        }

        const endTime = formatTime(endHour, endMinute);

        smartSchedule.push({
          id: Date.now().toString() + Math.random(),
          time: `${startTime} - ${endTime}`,
          task,
          type,
          taskId,
          suggested,
        });

        // Update current time
        currentHour = endHour;
        currentMinute = endMinute;
      };

      // 1. Morning Routine (6:30 - 7:00)
      addBlock(30, "Morning Routine", "break");

      // 2. Exercise & Breakfast (7:00 - 8:00)
      addBlock(60, "Exercise & Breakfast", "exercise");

      // 3. Peak Morning Hours - Schedule High Priority Tasks (8:00 - 12:00)
      const morningTasks = pendingTasks
        .filter(t => t.priority === "High")
        .slice(0, 2);

      if (morningTasks.length > 0) {
        morningTasks.forEach(task => {
          const duration = Math.min(task.duration || 60, 120);
          addBlock(duration, task.title, "study", task.id, true);
          
          // Add 10 min break
          if (currentHour < 12) {
            addBlock(10, "Short Break", "break");
          }
        });
      }

      // Fill remaining morning time with study
      while (currentHour < 12) {
        addBlock(60, "Study Session", "study", undefined, true);
      }

      // 4. Lunch Break (12:00 - 13:00)
      currentHour = 12;
      currentMinute = 0;
      addBlock(60, "Lunch Break", "break");

      // 5. Light Study (13:00 - 14:00)
      addBlock(60, "Light Study Session", "study");

      // 6. Classes (14:00 - 16:00)
      currentHour = 14;
      currentMinute = 0;
      addBlock(120, "Classes / Lectures", "class");

      // 7. Rest Period - Low Energy Time (16:00 - 16:30)
      addBlock(30, "Rest Period (Low Energy)", "break", undefined, true);

      // 8. Assignment Work (16:30 - 18:00)
      const mediumPriorityTasks = pendingTasks
        .filter(t => t.priority === "Medium")
        .slice(0, 1);

      if (mediumPriorityTasks.length > 0) {
        const duration = Math.min(mediumPriorityTasks[0].duration || 90, 90);
        addBlock(duration, mediumPriorityTasks[0].title, "study", mediumPriorityTasks[0].id, true);
      } else {
        addBlock(90, "Assignment Work", "study");
      }

      // 9. Dinner & Break (18:00 - 19:00)
      currentHour = 18;
      currentMinute = 0;
      addBlock(60, "Dinner & Break", "break");

      // 10. Peak Evening Hours - Math & Problem Solving (19:00 - 21:00)
      const mathTasks = pendingTasks.filter(t => 
        t.category?.toLowerCase().includes("math") || 
        t.category?.toLowerCase().includes("problem")
      ).slice(0, 1);

      if (mathTasks.length > 0) {
        addBlock(120, mathTasks[0].title, "study", mathTasks[0].id, true);
      } else {
        addBlock(120, "Math & Problem Solving", "study", undefined, true);
      }

      // 11. Light Reading (21:00 - 22:00)
      addBlock(60, "Light Reading / Review", "study");

      // 12. Night Routine (22:00 - 22:30)
      currentHour = 22;
      currentMinute = 0;
      addBlock(30, "Night Routine", "break");

      setSchedule(smartSchedule);
      saveSchedule(smartSchedule);
      setGenerating(false);

      toast({
        title: "Smart Schedule Generated! 🎯",
        description: `Created ${smartSchedule.length} optimized time blocks based on your tasks`,
      });
    }, 1000);
  };

  const handleAddBlock = () => {
    setEditingBlock(null);
    setFormData({ time: "", task: "", type: "study" });
    setDialogOpen(true);
  };

  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlock(block);
    setFormData({ time: block.time, task: block.task, type: block.type });
    setDialogOpen(true);
  };

  const handleDeleteBlock = async (blockId: string) => {
    const newSchedule = schedule.filter((b) => b.id !== blockId);
    setSchedule(newSchedule);
    await saveSchedule(newSchedule);
    toast({
      title: "Deleted",
      description: "Time block removed",
    });
  };

  const handleSaveBlock = async () => {
    if (!formData.time || !formData.task) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    // Check for overlaps
    const [startTime, endTime] = formData.time.split("-").map(t => t.trim());
    const hasOverlap = schedule.some(block => {
      if (editingBlock && block.id === editingBlock.id) return false;
      
      const [blockStart, blockEnd] = block.time.split("-").map(t => t.trim());
      
      // Simple overlap check
      return (startTime >= blockStart && startTime < blockEnd) ||
             (endTime > blockStart && endTime <= blockEnd) ||
             (startTime <= blockStart && endTime >= blockEnd);
    });

    if (hasOverlap) {
      toast({
        title: "Time Conflict",
        description: "This time slot overlaps with another task",
        variant: "destructive",
      });
      return;
    }

    let newSchedule: TimeBlock[];

    if (editingBlock) {
      newSchedule = schedule.map((b) =>
        b.id === editingBlock.id
          ? { ...b, time: formData.time, task: formData.task, type: formData.type }
          : b
      );
    } else {
      const newBlock: TimeBlock = {
        id: Date.now().toString(),
        time: formData.time,
        task: formData.task,
        type: formData.type,
      };
      newSchedule = [...schedule, newBlock].sort((a, b) => {
        const timeA = a.time.split("-")[0].trim();
        const timeB = b.time.split("-")[0].trim();
        return timeA.localeCompare(timeB);
      });
    }

    setSchedule(newSchedule);
    await saveSchedule(newSchedule);
    setDialogOpen(false);
    toast({
      title: editingBlock ? "Updated" : "Added",
      description: editingBlock ? "Time block updated" : "New time block added",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "study":
        return "bg-primary/10 border-primary/30";
      case "break":
        return "bg-muted border-border";
      case "class":
        return "bg-accent border-accent";
      case "exercise":
        return "bg-secondary border-border";
      default:
        return "bg-card border-border";
    }
  };

  const calculateHours = (type: string) => {
    return schedule
      .filter((b) => b.type === type)
      .reduce((total, block) => {
        const match = block.time.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
        if (match) {
          const start = parseInt(match[1]) * 60 + parseInt(match[2]);
          const end = parseInt(match[3]) * 60 + parseInt(match[4]);
          return total + (end - start) / 60;
        }
        return total;
      }, 0);
  };

  const focusTime = calculateHours("study");
  const breakTime = calculateHours("break");
  const optimization = schedule.filter(b => b.suggested).length > 0 
    ? Math.round((schedule.filter(b => b.suggested).length / schedule.length) * 100)
    : 0;

  if (authLoading || loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <div className="p-6">Please log in to view your schedule.</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Smart Scheduler
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-optimized daily schedule based on your productivity patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button 
            variant="default" 
            className="gap-2" 
            onClick={generateSmartSchedule}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Smart Schedule
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Schedule</CardTitle>
          <Button size="sm" onClick={handleAddBlock} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Block
          </Button>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground mb-4">No schedule for this day yet</p>
              <Button onClick={generateSmartSchedule} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Smart Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {schedule.map((block) => (
                <div
                  key={block.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${getTypeColor(
                    block.type
                  )} transition-colors group`}
                >
                  <div className="text-sm font-medium text-muted-foreground min-w-[140px]">
                    {block.time}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{block.task}</span>
                      {block.suggested && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                          AI Suggested
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">{block.type}</div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEditBlock(block)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteBlock(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{focusTime.toFixed(1)} hours</div>
            <p className="text-xs text-muted-foreground">Scheduled study blocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Break Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{breakTime.toFixed(1)} hours</div>
            <p className="text-xs text-muted-foreground">Rest and recovery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">AI Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{optimization}%</div>
            <p className="text-xs text-muted-foreground">Smart scheduling applied</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Edit Time Block" : "Add Time Block"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time Range</Label>
              <Input
                id="time"
                placeholder="e.g., 09:00 - 10:00"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task">Task Name</Label>
              <Input
                id="task"
                placeholder="e.g., Study Mathematics"
                value={formData.task}
                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "study" | "break" | "class" | "exercise") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBlock}>
              {editingBlock ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scheduler;
