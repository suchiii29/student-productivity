import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TimeBlock {
  id: string;
  time: string;
  task: string;
  type: "study" | "break" | "class" | "exercise";
  suggested?: boolean;
}

const defaultSchedule: TimeBlock[] = [
  { id: "1", time: "06:30 - 07:00", task: "Morning Routine", type: "break" },
  { id: "2", time: "07:00 - 08:00", task: "Exercise & Breakfast", type: "exercise" },
  { id: "3", time: "08:00 - 09:00", task: "Language Memorization", type: "study", suggested: true },
  { id: "4", time: "09:00 - 12:00", task: "Classes", type: "class" },
  { id: "5", time: "12:00 - 13:00", task: "Lunch Break", type: "break" },
  { id: "6", time: "13:00 - 14:00", task: "Light Study Session", type: "study" },
  { id: "7", time: "14:00 - 16:00", task: "Classes", type: "class" },
  { id: "8", time: "16:00 - 16:30", task: "Rest Period (Low Energy)", type: "break", suggested: true },
  { id: "9", time: "16:30 - 18:00", task: "Assignment Work", type: "study" },
  { id: "10", time: "18:00 - 19:00", task: "Dinner & Break", type: "break" },
  { id: "11", time: "19:00 - 21:00", task: "Math & Problem Solving", type: "study", suggested: true },
  { id: "12", time: "21:00 - 22:00", task: "Light Reading", type: "study" },
  { id: "13", time: "22:00 - 22:30", task: "Night Routine", type: "break" },
];

const Scheduler = () => {
  const { uid, isLoggedIn, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [formData, setFormData] = useState({
    time: "",
    task: "",
    type: "study" as "study" | "break" | "class" | "exercise",
  });

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
        setSchedule(defaultSchedule);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
      setSchedule(defaultSchedule);
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
      newSchedule = [...schedule, newBlock];
    }

    setSchedule(newSchedule);
    await saveSchedule(newSchedule);
    setDialogOpen(false);
    toast({
      title: editingBlock ? "Updated" : "Added",
      description: editingBlock ? "Time block updated" : "New time block added",
    });
  };

  const handleReschedule = async () => {
    setSchedule(defaultSchedule);
    await saveSchedule(defaultSchedule);
    toast({
      title: "Schedule Reset",
      description: "Schedule has been reset to default",
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

  // Calculate stats
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

  if (authLoading || loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <div className="p-6">Please log in to view your schedule.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Smart Scheduler</h2>
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
          <Button variant="outline" className="gap-2" onClick={handleReschedule}>
            <RefreshCw className="h-4 w-4" />
            Reschedule
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
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                        Suggested
                      </span>
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
            <CardTitle className="text-sm font-medium">Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Alignment with your peak hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
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