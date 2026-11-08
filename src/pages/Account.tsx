import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { logOut, openLogin, useCloud } from "../cloud/sync";
import styles from "./Account.module.css";

interface Props {
  onBack: () => void;
}

type Busy = "login" | "logout";

export function Account({ onBack }: Props) {
  const cloud = useCloud();
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
    if (!cloud.loggedIn) return { text: "未ログイン", tone: "neutral" as const };
    const device = cloud.deviceName ? `（${cloud.deviceName}）` : "";
    return cloud.connected
      ? { text: `ログイン中${device}`, tone: "success" as const }
      : { text: `ログイン中${device}: つながっていません`, tone: "neutral" as const };
  })();

  return (
    <main className={styles.page}>
      <Button variant="ghost" size="sm" className={styles.back} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        戻る
      </Button>

      <h1 className={styles.title}>アカウント</h1>

      {!cloud.configured ? (
        <Alert tone="warning" title="このビルドではログインできません">
          接続先が設定されていません。
        </Alert>
      ) : (
        !cloud.loggedIn && (
          <>
            <p className={styles.hint}>
              ブラウザーでログインすると、アプリに戻ってきます。登録がまだの場合は、ブラウザーの画面で登録できます。
            </p>
            <Button
              size="lg"
              className="accent-button"
              loading={busy === "login"}
              onClick={() => run("login", openLogin)}
            >
              ブラウザーでログイン
            </Button>
          </>
        )
      )}

      {(error || cloud.error) && (
        <Alert tone="danger" title="できませんでした">
          {error ?? cloud.error}
        </Alert>
      )}

      <Badge className={styles.status} tone={status.tone} dot>
        {status.text}
      </Badge>

      {cloud.loggedIn && (
        <>
          <p className={styles.hint}>
            ログイン中の端末は、サイトの設定画面で確認や失効ができます。
          </p>
          <Button
            variant="secondary"
            size="lg"
            loading={busy === "logout"}
            onClick={() => run("logout", logOut)}
          >
            ログアウト
          </Button>
        </>
      )}
    </main>
  );
}
