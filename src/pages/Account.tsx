import { useState } from "react";
import { DEV_ACCOUNT, isDevBuild, logIn, signUp } from "../cloud/cloud";
import { logOutEverywhere, useCloud } from "../cloud/sync";

interface Props {
  onBack: () => void;
}

export function Account({ onBack }: Props) {
  const { account } = useCloud();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: (email: string, password: string) => Promise<void>) => async () => {
    setError(null);
    try {
      await action(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const status = (() => {
    if (account === undefined) return "確認中…";
    if (isDevBuild) {
      return account
        ? `開発用アカウント: ${account.email ?? "テスト"}`
        : "開発モード: 接続中…";
    }
    return account ? `ログイン中: ${account.email}` : "未ログイン";
  })();

  return (
    <div className="app">
      <button className="btn-back" onClick={onBack}>
        ← 戻る
      </button>
      <div className="page-title">
        <h1>アカウント</h1>
      </div>

      {isDevBuild ? (
        <p className="hint">
          開発ビルドです。本番のデータに触れないよう、開発用アカウント
          {DEV_ACCOUNT?.email ? `（${DEV_ACCOUNT.email}）` : ""}で自動ログインします。
        </p>
      ) : (
        <div className="auth-card">
          <div className="field">
            <span className="field-label">メールアドレス</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <span className="field-label">パスワード</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="btn-pair">
            <button className="btn btn-primary" onClick={run(logIn)}>
              ログイン
            </button>
            <button className="btn btn-ghost" onClick={run(signUp)}>
              新規登録
            </button>
          </div>
        </div>
      )}

      <p className="auth-status">{error ? `エラー: ${error}` : status}</p>
      {!isDevBuild && (
        <button
          className="btn btn-danger btn-block"
          disabled={!account}
          onClick={() => logOutEverywhere()}
        >
          ログアウト
        </button>
      )}
    </div>
  );
}
