import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProjectsList from "@/pages/ProjectsList";
import ProjectOverview from "@/pages/ProjectOverview";
import ChapterEditor from "@/pages/ChapterEditor";
import VersionHistory from "@/pages/VersionHistory";
import CharacterEncyclopedia from "@/pages/CharacterEncyclopedia";
import PlotManager from "@/pages/PlotManager";
import ExportCenter from "@/pages/ExportCenter";
import ProjectLayout from "@/components/ProjectLayout";
import { useAppStore } from "@/store/appStore";

function AppInit({ children }: { children: React.ReactNode }) {
  const initApp = useAppStore(s => s.initApp);
  const initialized = useAppStore(s => s.initialized);
  const isLoading = useAppStore(s => s.isLoading);

  useEffect(() => {
    initApp();
  }, [initApp]);

  if (!initialized && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-paper-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-600 font-serif">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AppInit>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route
            path="/projects/:projectId"
            element={
              <ProjectLayout>
                <ProjectOverview />
              </ProjectLayout>
            }
          />
          <Route
            path="/projects/:projectId/chapters"
            element={
              <ProjectLayout>
                <ChapterEditor />
              </ProjectLayout>
            }
          />
          <Route
            path="/projects/:projectId/chapters/:chapterId"
            element={
              <ProjectLayout>
                <ChapterEditor />
              </ProjectLayout>
            }
          />
          <Route
            path="/projects/:projectId/chapters/:chapterId/history"
            element={
              <ProjectLayout>
                <VersionHistory />
              </ProjectLayout>
            }
          />
          <Route
            path="/projects/:projectId/characters"
            element={
              <ProjectLayout>
                <CharacterEncyclopedia />
              </ProjectLayout>
            }
          />
          <Route
            path="/projects/:projectId/plot"
            element={
              <ProjectLayout>
                <PlotManager />
              </ProjectLayout>
            }
          />
          <Route
            path="/projects/:projectId/export"
            element={
              <ProjectLayout>
                <ExportCenter />
              </ProjectLayout>
            }
          />
        </Routes>
      </Router>
    </AppInit>
  );
}
