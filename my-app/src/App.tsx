// src/App.tsx
import AuthButtons from "./components/AuthButtons";
import Protected from "./components/Protected";
import ExtensionBridge from "./components/ExtensionBridge";

export default function App() {
  return (
    <>
      <ExtensionBridge />
      <div style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
        <h1>Firebase Google 로그인 (Vite)</h1>
        <AuthButtons />
        <hr style={{ margin: "24px 0" }} />
        <Protected>
          <h2>로그인한 사용자만 보는 영역</h2>
          <p>여기에 대시보드/마이페이지 등 렌더링하면 돼.</p>
        </Protected>
      </div>
    </>
  );
}
