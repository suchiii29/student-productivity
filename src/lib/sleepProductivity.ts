export function computeProductivityFromSleep(hours: number) {
  let score = 0;
  let verdict = "";
  let tip = "";

  if (hours < 5) {
    verdict = "Severe Sleep Deprivation";
    score = 40;
    tip = "Try to sleep at least 6–8 hours daily for better health and focus.";
  } else if (hours >= 5 && hours < 7) {
    verdict = "Under Slept";
    score = 65;
    tip = "Aim for slightly longer sleep — ideal range is 7–9 hours.";
  } else if (hours >= 7 && hours <= 9) {
    verdict = "Optimal Sleep";
    score = 90;
    tip = "Great job! Maintain this sleep duration for peak cognitive performance.";
  } else if (hours > 9 && hours <= 11) {
    verdict = "Oversleep";
    score = 55;
    tip = "Avoid long oversleeping — try maintaining 7–9 hours regularly.";
  } else {
    verdict = "Extreme Oversleep";
    score = 45;
    tip = "Oversleeping may impact alertness — try adjusting your routine.";
  }

  return {
    score,
    verdict,
    tip, // renamed from recommendation to 'tip' for UI consistency
  };
}
