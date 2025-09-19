// src/components/Protected.tsx
import { useAuth } from "../hooks/useAuth";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>로딩중...</p>;
  if (!user) return <p>로그인이 필요합니다.</p>;
  return <>{children}</>;
}
