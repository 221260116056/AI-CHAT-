import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "./app";
import "./index.css";

// Layouts
import { AppLayout } from "./layouts/app-layout";
import { AdminLayout } from "./layouts/admin-layout";

// Guards
import { ProtectedRoute } from "./components/auth/protected-route";
import { AdminProtectedRoute } from "./components/auth/admin-protected-route";
import { GuestRoute } from "./components/auth/guest-route";

// Auth pages
import { LoginPage } from "./pages/auth/login-page";
import { RegisterPage } from "./pages/auth/register-page";

// App pages
import { DashboardPage } from "./pages/dashboard/dashboard-page";
import { ChatPage } from "./pages/chat/chat-page";
import { ImagePage } from "./pages/image/image-page";
import { SummarizerPage } from "./pages/summarizer/summarizer-page";
import { CodePage } from "./pages/code/code-page";
import { WritingPage } from "./pages/writing/writing-page";

// Admin pages
import { AdminDashboardPage } from "./pages/admin/admin-dashboard-page";
import { AdminUsersPage } from "./pages/admin/admin-users-page";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <Routes>
        {/* Auth pages — only accessible when NOT authenticated */}
        <Route element={<GuestRoute />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
        </Route>

        {/* All other routes require authentication */}
        <Route element={<ProtectedRoute />}>
          {/* Regular app routes with AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:sessionId" element={<ChatPage />} />
            <Route path="/image" element={<ImagePage />} />
            <Route path="/summarizer" element={<SummarizerPage />} />
            <Route path="/code" element={<CodePage />} />
            <Route path="/writing" element={<WritingPage />} />
          </Route>

          {/* Admin routes — super_admin only */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  </StrictMode>
);
