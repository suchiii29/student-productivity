import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoutineLog } from "@/pages/RoutineLogs";
import { useToast } from "@/hooks/use-toast";

interface RoutineLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLog: (log: Omit<RoutineLog, "id">) => void;
}

const RoutineLogModal = ({ open, onOpenChange, onAddLog }: RoutineLogModalProps) => {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [wakeTime, setWakeTime] = useState("");
  const [sleepTime, setSleepTime] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [exercise, setExercise] = useState("");
  const [breaks, setBreaks] = useState("");
  const [classTimings, setClassTimings] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onAddLog({
      date: new Date(date),
      wakeTime,
      sleepTime,
      studyHours: parseFloat(studyHours),
      exercise: parseInt(exercise),
      breaks: parseInt(breaks),
      classTimings,
    });

    // Reset form
    setDate(new Date().toISOString().split("T")[0]);
    setWakeTime("");
    setSleepTime("");
    setStudyHours("");
    setExercise("");
    setBreaks("");
    setClassTimings("");

    toast({
      title: "Routine Logged",
      description: "Your daily routine has been successfully logged",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Routine Log</DialogTitle>
          <DialogDescription>
            Log your daily routine and habits
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wakeTime">Wake Time</Label>
              <Input
                id="wakeTime"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sleepTime">Sleep Time</Label>
              <Input
                id="sleepTime"
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyHours">Study Hours</Label>
              <Input
                id="studyHours"
                type="number"
                step="0.5"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                placeholder="e.g., 6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise">Exercise (minutes)</Label>
              <Input
                id="exercise"
                type="number"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                placeholder="e.g., 30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breaks">Number of Breaks</Label>
              <Input
                id="breaks"
                type="number"
                value={breaks}
                onChange={(e) => setBreaks(e.target.value)}
                placeholder="e.g., 4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classTimings">Class Timings</Label>
              <Input
                id="classTimings"
                value={classTimings}
                onChange={(e) => setClassTimings(e.target.value)}
                placeholder="e.g., 9:00-12:00, 14:00-16:00"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Log</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoutineLogModal;
