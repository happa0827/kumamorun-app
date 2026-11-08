import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { PasswordField } from "@/components/arc/password-field/password-field";
import { DEV_ACCOUNT, isDevBuild, logIn, signUp } from "../cloud/cloud";
import { logOutEverywhere, useCloud } from "../cloud/sync";
import styles from "./Account.module.css";

interface Props {
  onBack: () => void;
}

type Busy = "login" | "signup" | "logout";

export function Account({ onBack }: Props) {
  const { account } = useCloud();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy | null>(null);

  const run = async (kind: Busy, action: () => Promise<void>) => {
    setError(null);
    setBusy(kind);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const status = (() => {
    if (account === undefined) return { text: "確認中", tone: "neutral" as const };
    if (isDevBuild) {
      return account
        ? { text: `開発用アカウント: ${account.email ?? "テスト"}`, tone: "success" as const }
        : { text: "開発モード: 接続中", tone: "neutral" as const };
    }
    return account
      ? { text: `ログイン中: ${account.email}`, tone: "success" as const }
      : { text: "未ログイン", tone: "neutral" as const };
  })();

  return (
    <main className={styles.page}>
      <Button variant="ghost" size="sm" className={styles.back} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        戻る
      </Button>

      <h1 className={styles.title}>アカウント</h1>

      {isDevBuild ? (
        <p className={styles.hint}>
          開発ビルドです。本番のデータに触れないよう、開発用アカウント
          {DEV_ACCOUNT?.email ? `（${DEV_ACCOUNT.email}）` : ""}で自動ログインします。
        </p>
      ) : (
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            run("login", () => logIn(email, password));
          }}
        >
          <Input
            label="メールアドレス"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordField
            label="パスワード"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            messages={{ showPassword: "パスワードを表示", hidePassword: "パスワードを隠す" }}
          />
          <div className={styles.pair}>
            <Button type="submit" loading={busy === "login"} disabled={busy === "signup"}>
              ログイン
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={busy === "signup"}
              disabled={busy === "login"}
              onClick={() => run("signup", () => signUp(email, password))}
            >
              新規登録
            </Button>
          </div>
        </form>
      )}

      {error && (
        <Alert tone="danger" title="できませんでした">
          {error}
        </Alert>
      )}

      <Badge className={styles.status} tone={status.tone} dot>
        {status.text}
      </Badge>

      {!isDevBuild && (
        <Button
          variant="secondary"
          size="lg"
          loading={busy === "logout"}
          disabled={!account}
          onClick={() => run("logout", () => Promise.resolve(logOutEverywhere()))}
        >
          ログアウト
        </Button>
      )}
    </main>
  );
}
