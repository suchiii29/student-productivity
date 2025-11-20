import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/register")}
              className="gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Task Management</h3>
            <p className="text-sm text-muted-foreground">
              Prioritize tasks automatically based on deadlines and importance. Never miss important assignments.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized study recommendations based on your productivity patterns and performance data.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track your progress with detailed analytics. Understand your high-focus periods and optimize accordingly.
            </p>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to boost your productivity?</h2>
          <p className="text-muted-foreground mb-6">
            Join students who are already optimizing their study routines with AI.
          </p>
          <Button onClick={() => navigate("/register")}>
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
