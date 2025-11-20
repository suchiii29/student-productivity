import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const auth = getAuth(app);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Logged in successfully" });
      navigate("/dashboard");
    } catch (err) {
      toast({ variant: "destructive", title: "Login failed" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-md w-[350px]"
      >
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        <input
          className="w-full p-3 rounded mb-4 border"
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 rounded mb-4 border"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-primary text-white p-3 rounded"
          type="submit"
        >
          Login
        </button>

        <Link to="/register" className="block mt-3 text-sm text-primary">
          Create an account
        </Link>
      </form>
    </div>
  );
}
