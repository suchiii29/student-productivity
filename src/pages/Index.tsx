// src/pages/Index.tsx
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Target, TrendingUp, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "../firebase";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const auth = getAuth(app);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "✅ Signed in with Google successfully" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Google sign-in failed",
        description: err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dark Mode Toggle - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full shadow-lg"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-500" />
          )}
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            AI-Powered Productivity
          </div>
          
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Student Productivity & <br />Routine Optimizer
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Optimize your study routine with AI-powered recommendations. Track tasks, analyze productivity patterns, and achieve your academic goals.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            {/* Google Sign In Button */}
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="gap-2 min-w-[240px] bg-white dark:bg-gray-800 border-2"
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
            </Button>

            <Button 
              size="lg" 
              onClick={() => navigate("/register")}
              className="gap-2 min-w-[200px]"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Login Link */}
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-primary hover:underline font-medium"
            >
              Login here
            </button>
          </p>
        </header>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Task Management</h3>
            <p className="text-sm text-muted-foreground">
              Prioritize tasks automatically based on deadlines and importance. Never miss important assignments.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized study recommendations based on your productivity patterns and performance data.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track your progress with detailed analytics. Understand your high-focus periods and optimize accordingly.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to boost your productivity?</h2>
          <p className="text-muted-foreground mb-6">
            Join students who are already optimizing their study routines with AI.
          </p>
          <Button onClick={() => navigate("/register")} size="lg">
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;