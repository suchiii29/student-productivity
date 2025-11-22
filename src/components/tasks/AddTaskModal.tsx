// src/components/tasks/AddTaskModal.tsx
// COMPLETE WORKING VERSION - Copy this entire file

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "@/pages/Tasks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (task: Omit<Task, "id">) => void;
}

export default function AddTaskModal({ open, onOpenChange, onAddTask }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Study" | "Health" | "Personal">("Study");
  const [deadline, setDeadline] = useState("");
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | "">("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const reset = () => {
    setTitle("");
    setCategory("Study");
    setDeadline("");
    setStartTime(null);
    setEndTime(null);
    setDuration("");
    setPriority("Medium");
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    let dur = typeof duration === "number" && duration > 0 ? duration : undefined;
    if (!dur && startTime && endTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      let s = sh * 60 + sm;
      let e = eh * 60 + em;
      if (e <= s) e += 24 * 60;
      dur = e - s;
    }
    if (!dur) dur = 60;

    const newTask: Omit<Task, "id"> = {
      title,
      category,
      deadline,
      duration: dur,
      priority,
      status: "pending",
      startTime,
      endTime,
    };

    onAddTask(newTask);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task with time tracking and priority settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="task-title">Task Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Math Assignment"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="task-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger id="task-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Study">📚 Study</SelectItem>
                  <SelectItem value="Health">💪 Health</SelectItem>
                  <SelectItem value="Personal">👤 Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">🔴 High</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="Low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime ?? ""}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime ?? ""}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                value={duration === "" ? "" : String(duration)}
                onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : "")}
                placeholder="60"
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}