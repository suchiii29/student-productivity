import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [studyGoals, setStudyGoals] = useState("Maintain GPA above 3.5");
  const [examDates, setExamDates] = useState("2025-12-15, 2025-12-20");
  const [semesterPlan, setSemesterPlan] = useState("Focus on core subjects first, then electives");
  const [dailyTarget, setDailyTarget] = useState("6");
  const [weeklyTarget, setWeeklyTarget] = useState("40");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your settings have been saved successfully",
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account and study preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Goals</CardTitle>
            <CardDescription>Set your academic objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studyGoals">Primary Goals</Label>
              <Textarea
                id="studyGoals"
                value={studyGoals}
                onChange={(e) => setStudyGoals(e.target.value)}
                placeholder="e.g., Maintain GPA above 3.5, Complete all assignments on time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examDates">Upcoming Exam Dates</Label>
              <Input
                id="examDates"
                value={examDates}
                onChange={(e) => setExamDates(e.target.value)}
                placeholder="e.g., 2025-12-15, 2025-12-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semesterPlan">Semester Plan</Label>
              <Textarea
                id="semesterPlan"
                value={semesterPlan}
                onChange={(e) => setSemesterPlan(e.target.value)}
                placeholder="Describe your semester strategy"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Targets</CardTitle>
            <CardDescription>Set your daily and weekly study goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dailyTarget">Daily Study Hours</Label>
              <Input
                id="dailyTarget"
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                min="1"
                max="16"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weeklyTarget">Weekly Study Hours</Label>
              <Input
                id="weeklyTarget"
                type="number"
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(e.target.value)}
                min="1"
                max="100"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </div>
  );
};

export default Profile;
