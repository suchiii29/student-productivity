import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { app } from "@/firebase.js";
import { createProfile } from "@/utils/userProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = getAuth(app);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1) Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2) Save profile to Realtime Database (helper writes to /users/{uid}/profile)
      await createProfile(user, name);

      // 3) Update Firebase Auth displayName
      await updateProfile(user, { displayName: name });

      toast({
        title: "Registration Successful 🎉",
        description: "Your account has been created!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      let msg = "Something went wrong";

      if (error?.code === "auth/email-already-in-use") msg = "Email is already registered";
      if (error?.code === "auth/invalid-email") msg = "Invalid email address";
      if (error?.code === "auth/weak-password") msg = "Password is too weak";

      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Registering..." : "Register"}</Button>
          </form>
        </CardContent>

        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
