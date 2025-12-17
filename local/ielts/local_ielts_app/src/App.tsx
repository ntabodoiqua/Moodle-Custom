import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import ExamLayout from "./routes/ExamLayout";
import { useExamStore } from "./store/examStore";
import type { MoodleConfig } from "./types";

interface AppProps {
  config: MoodleConfig;
}

function App({ config }: AppProps) {
  const { initApi } = useExamStore();

  // Initialize API on mount
  useEffect(() => {
    initApi(config);
  }, [config, initApi]);

  return (
    <HashRouter>
      <ExamLayout config={config} />
    </HashRouter>
  );
}

export default App;
