import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { firestore, auth } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { uploadProfilePicture } from "../services/profileService";
import { Camera, LogOut, Loader2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { toast } = useToast();
  const { user, uid, isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
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
        setPhotoURL(data.photoURL || "");
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
        photoURL,
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      const url = await uploadProfilePicture(uid, file);
      setPhotoURL(url);

      toast({
        title: "Photo uploaded",
        description: "Your profile picture has been updated",
      });
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <div className="p-6 text-lg">Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src={photoURL} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl">
              {name?.[0] || email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Upload Button Overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute bottom-0 right-0 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all disabled:opacity-50"
          >
            {uploadingPhoto ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        <div>
          <h2 className="text-4xl font-semibold tracking-tight">
            {name || "Your Profile"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {email}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* Personal Info */}
        <Card className="rounded-2xl shadow-sm border border-neutral-200/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your basic account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl h-11"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-11"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Study Goals */}
        <Card className="rounded-2xl shadow-sm border border-neutral-200/50">
          <CardHeader>
            <CardTitle className="text-xl">Study Goals</CardTitle>
            <CardDescription>
              Define your academic direction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Primary Goals</Label>
              <Textarea
                value={studyGoals}
                onChange={(e) => setStudyGoals(e.target.value)}
                className="rounded-xl min-h-[100px]"
                placeholder="e.g., Maintain GPA above 8.5, revise daily…"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Upcoming Exam Dates</Label>
              <Input
                value={examDates}
                onChange={(e) => setExamDates(e.target.value)}
                className="rounded-xl h-11"
                placeholder="e.g., 2025-12-15, 2025-12-20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Semester Plan</Label>
              <Textarea
                value={semesterPlan}
                onChange={(e) => setSemesterPlan(e.target.value)}
                className="rounded-xl min-h-[100px]"
                placeholder="Describe your study strategy..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Study Targets */}
        <Card className="rounded-2xl shadow-sm border border-neutral-200/50">
          <CardHeader>
            <CardTitle className="text-xl">Study Targets</CardTitle>
            <CardDescription>
              Set realistic daily & weekly study goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Daily Study Hours</Label>
              <Input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                className="rounded-xl h-11"
                min="1"
                max="16"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Weekly Study Hours</Label>
              <Input
                type="number"
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(e.target.value)}
                className="rounded-xl h-11"
                min="1"
                max="100"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1 h-12 text-base rounded-xl"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            className="h-12 px-6 rounded-xl flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

      </form>
    </div>
  );
};

export default Profile;