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
import { saveRoutineEntry } from "@/lib/routineStore";   // ⬅ IMPORTANT

interface RoutineLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoutineLogModal = ({ open, onOpenChange }: RoutineLogModalProps) => {
  const { toast } = useToast();

  const [sleepHours, setSleepHours] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState("");
  const [breaks, setBreaks] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await saveRoutineEntry({
      sleepHours: Number(sleepHours),
      studyHours: Number(studyHours),
      exerciseMinutes: Number(exerciseMinutes),
      breaks: Number(breaks),
    });

    toast({
      title: "Routine logged",
      description: "Your daily routine has been successfully saved",
    });

    // reset fields
    setSleepHours("");
    setStudyHours("");
    setExerciseMinutes("");
    setBreaks("");

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Routine Log</DialogTitle>
          <DialogDescription>Track today's habits</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Sleep Hours</Label>
            <Input
              type="number"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Study Hours</Label>
            <Input
              type="number"
              step="0.5"
              value={studyHours}
              onChange={(e) => setStudyHours(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Exercise (minutes)</Label>
            <Input
              type="number"
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Number of Breaks</Label>
            <Input
              type="number"
              value={breaks}
              onChange={(e) => setBreaks(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
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
