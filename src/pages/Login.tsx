// src/pages/Login.tsx
import { useState } from "react";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const auth = getAuth(app);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "✅ Logged in successfully" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Login failed",
        description: err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "✅ Logged in with Google successfully" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Google login failed",
        description: err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
          <p className="text-gray-600 dark:text-gray-400">Sign in to continue to your dashboard</p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 p-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all"
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link 
            to="/forgot-password" 
            className="block text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Forgot password?
          </Link>
          <Link 
            to="/register" 
            className="block text-sm text-gray-600 dark:text-gray-400"
          >
            Don't have an account? <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Sign up</span>
          </Link>
        </div>
      </div>
    </div>
  );
}