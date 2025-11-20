import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
}

const recommendations: Recommendation[] = [
  {
    id: "1",
    title: "Schedule critical tasks between 7–9 PM",
    description: "Your highest focus period is 7–9 PM. This is the optimal time for complex problem-solving and math-related work.",
    reason: "Based on 30 days of productivity data, your concentration peaks during evening hours with 92% task completion rate.",
  },
  {
    id: "2",
    title: "Avoid heavy study sessions between 3–4 PM",
    description: "Your productivity significantly drops during mid-afternoon. Consider light tasks or breaks during this time.",
    reason: "Analysis shows 45% lower focus scores and increased error rates during 3-4 PM across multiple subjects.",
  },
  {
    id: "3",
    title: "Increase sleep duration to 7-8 hours",
    description: "Your performance drops when sleeping less than 6 hours. Aim for consistent 7-8 hour sleep cycles.",
    reason: "Correlation analysis reveals 35% better task completion and 50% fewer errors with adequate sleep.",
  },
  {
    id: "4",
    title: "Take scheduled breaks every 90 minutes",
    description: "Implement the 90-20 rule: 90 minutes of focused work followed by 20-minute breaks for optimal performance.",
    reason: "Your longest productive sessions last 85-95 minutes before focus deteriorates. Regular breaks maintain consistency.",
  },
  {
    id: "5",
    title: "Morning study sessions for memorization",
    description: "Schedule memorization-heavy subjects (languages, history) between 8-10 AM when retention is highest.",
    reason: "Morning sessions show 28% better long-term retention compared to afternoon or evening study periods.",
  },
];

const Recommendations = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">AI Recommendations</h2>
        <p className="text-muted-foreground mt-1">
          Personalized suggestions based on your productivity patterns
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-start gap-3 text-lg">
                <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{rec.title}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground ml-auto cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{rec.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            Recommendations update weekly based on your logged activities and task completions.
            Keep logging your routines for more accurate insights.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recommendations;
