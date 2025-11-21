# welcome to my app  AI-Based Student Productivity & Routine Optimizer  
**A Modern Notion-Style Productivity Dashboard for Students — Built with React, Tailwind CSS & Firebase**

This project is developed for the **Hackathon 2025** as a smart solution to improve student productivity using routine tracking, intelligent scheduling, and AI-driven recommendations.

The application helps students:
- Plan tasks  
- Track daily routines  
- Identify high/low focus hours  
- Make better study schedules  
- Improve sleep & health consistency  
- Visualize progress with analytics charts  

Designed with a **clean Notion-style UI**, distraction-free layout, and optimized for real-world use.

---

## 🚀 Features

### 🔐 **User Authentication**
- Login, Signup, and Logout using **Firebase Authentication**
- Secure email/password-based access
- User-specific dashboard & data

---

### 📘 **Task Manager**
- Add, edit, delete tasks  
- Mandatory deadlines  
- Auto-sorting based on priority  
- Status tracking: pending / completed  
- Categories (Study, Health, Personal)

---

### ⏱️ **Routine Logging**
Track daily:
- Wake/sleep time  
- Study hours  
- Exercise time  
- Breaks  
- Class timings  
- Auto-calculated durations  

Stored with timestamps in Firestore.

---

### 🧠 **AI Recommendations Engine**
A rule-based logic engine that analyzes:
- High focus hours  
- Sleep trends  
- Overdue high-priority tasks  
- Study patterns  

Generates actionable suggestions such as:
- “Your highest focus slot is between 7–9 PM.”  
- “You should sleep earlier — low sleep decreased productivity this week.”  
- “Reschedule overdue high-priority tasks for tomorrow morning.”

---

### 📅 **Smart Scheduler**
- Prevents overlapping tasks  
- Finds ideal time slots  
- Adds rest breaks  
- Automatically reschedules delayed tasks  
- Visual timeline UI (Notion-style)

---

### 📊 **Analytics Dashboard**
Interactive charts showing:
- Daily/weekly productivity  
- Completed vs pending tasks  
- Study hours trend  
- Focus hour analysis  
- Sleep vs productivity correlation  
- Month-wise progress  

---

### 🔔 **Notifications**
- Missing routine logs  
- Deadline nearing alerts  
- Free 1-hour slot notifications  
- Low sleep warnings  

---

## 🎨 UI/UX Philosophy
- Clean, minimal, Notion-style interface  
- Neutral grayscale palette (slate/gray/stone)  
- Tailwind CSS + shadcn/ui components  
- Smooth animations and consistent spacing  
- Accessible, mobile-friendly layout  

---

## 🛠️ Tech Stack

### **Frontend**
- React (Vite)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Recharts (for analytics)

### **Backend**
- Firebase Authentication  
- Firebase Firestore Database  
- Firebase Cloud Functions (optional, used for AI logic)

### **Deployment**
- Firebase Hosting (optional)
- Vercel/Netlify compatible

---

## 📁 Project Structure