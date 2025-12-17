import { HashRouter } from "react-router-dom";
import ExamLayout from "./routes/ExamLayout";

// Interface cấu hình từ Moodle
interface MoodleConfig {
  userId: number;
  sesskey: string;
  wwwroot: string;
  apiEndpoint: string;
  fullName?: string;
}

interface AppProps {
  config: MoodleConfig;
}

function App({ config }: AppProps) {
  return (
    <HashRouter>
      <ExamLayout config={config} />
    </HashRouter>
  );
}

export default App;
