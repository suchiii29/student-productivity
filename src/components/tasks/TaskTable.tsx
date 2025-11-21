// src/components/tasks/TaskTable.tsx
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/pages/Tasks";
import { format } from "date-fns";

interface TaskTableProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

const TaskTable = ({ tasks, onToggleTask }: TaskTableProps) => {
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getFormattedDeadline = (d: string) =>
    d ? format(new Date(d), "MMM dd, yyyy") : "No deadline";

  const formatTime = (task: Task) =>
    task.startTime && task.endTime ? `${task.startTime} → ${task.endTime}` : "—";

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Done</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox checked={task.status === "completed"} onCheckedChange={() => onToggleTask(task.id)} />
              </TableCell>

              <TableCell className="font-medium">{task.title}</TableCell>

              <TableCell><Badge>{task.category}</Badge></TableCell>

              <TableCell>{formatTime(task)}</TableCell>
              <TableCell>{task.duration} min</TableCell>

              <TableCell>
                <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}>
                  {task.priority}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant={task.status === "completed" ? "default" : "outline"}>
                  {task.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskTable;
