# 🌌 Equora

**Premium Universal Group Expense Splitting Platform**

Equora is a modern, high-performance fintech application designed for seamless group expense management. Built with a "premium-first" aesthetic, it leverages AI to provide smart spending insights and uses a robust PostgreSQL backend for real-time balance tracking.

---

## ✨ Key Features

-   **🎯 Omnibar Input**: Add expenses naturally using smart parsing (e.g., "Dinner 2500 @alex @sara").
-   **🤖 Gemini AI Insights**: Get automated, intelligent summaries of group spending and saving tips.
-   **📊 Real-time Analytics**: Visualized spending categories and interactive debt-settlement logic.
-   **🔗 Group Invites**: Secure, 6-character invite codes for easy group joining.
-   **🌓 Dark Mode Native**: A refined, glassmorphic UI built for modern devices.
-   **⚡ Server Actions**: High-performance data mutations with Next.js 14.

---

## 🛠️ Tech Stack

-   **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
-   **Database/Auth**: [Supabase](https://supabase.com/)
-   **AI Engine**: [Google Gemini 1.5 Flash](https://aistudio.google.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Charts**: [Recharts](https://recharts.org/)

---

## 🚀 Getting Started

### 1. Prerequisites
-   Node.js 18.x or later
-   A Supabase project
-   A Google AI Studio API Key

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/equora.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### 3. Environment Variables
Edit your `.env.local` with the following:
-   `NEXT_PUBLIC_SUPABASE_URL`
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
-   `GOOGLE_AI_STUDIO_API_KEY`

### 4. Database Setup
Run the contents of `supabase-setup.sql` in your Supabase SQL Editor. This will:
-   Create all necessary tables (`groups`, `expenses`, `splits`, etc.).
-   Enable Row Level Security (RLS).
-   Set up the `generate_invite_code` and `increment_ai_usage` functions.

---

## 🌐 Deployment (Vercel)

1.  **Push to GitHub**: Initialize git and push your code.
2.  **Import to Vercel**: Connect your repository to Vercel.
3.  **Configure Env Vars**: Add the same keys from `.env.local` to the Vercel Dashboard.
4.  **Build**: Vercel will automatically detect the Next.js setup and deploy.

---

## 📄 License
This project is private and intended for internal use.
