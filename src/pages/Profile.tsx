import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { toast } = useToast();
  const { user, uid, isLoggedIn, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studyGoals, setStudyGoals] = useState("");
  const [examDates, setExamDates] = useState("");
  const [semesterPlan, setSemesterPlan] = useState("");
  const [dailyTarget, setDailyTarget] = useState("6");
  const [weeklyTarget, setWeeklyTarget] = useState("40");

  useEffect(() => {
    if (authLoading) return;

    if (uid) {
      setEmail(user?.email || "");
      loadProfile(uid);
    } else {
      setLoading(false);
    }
  }, [uid, authLoading]);

  const loadProfile = async (userId: string) => {
    try {
      const docRef = doc(firestore, "profiles", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setStudyGoals(data.studyGoals || "");
        setExamDates(data.examDates || "");
        setSemesterPlan(data.semesterPlan || "");
        setDailyTarget(data.dailyTarget || "6");
        setWeeklyTarget(data.weeklyTarget || "40");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid) {
      toast({
        title: "Error",
        description: "You must be logged in to save",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const docRef = doc(firestore, "profiles", uid);
      await setDoc(docRef, {
        name,
        email,
        studyGoals,
        examDates,
        semesterPlan,
        dailyTarget,
        weeklyTarget,
      });

      toast({
        title: "Profile Updated",
        description: "Your settings have been saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <div className="p-6">Please log in to view your profile.</div>;
  }

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

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default Profile;