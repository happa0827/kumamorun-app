import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, MutableRefObject, PointerEvent } from "react";
import { motionTokens } from "../arc/lib/motion-tokens";
import {
  CENTER,
  formatTime,
  hourFromPoint,
  hourHand,
  INNER_RADIUS,
  minuteFromPoint,
  minuteHand,
  OUTER_RADIUS,
  parseTime,
  pointAt,
} from "./dial";
import styles from "./dial-time-picker.module.css";

interface Props {
  label: string;
  /** 「HH:mm」（24時間）。空欄は未選択。 */
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

type Mode = "hour" | "minute";

const HOURS_OUTER = Array.from({ length: 12 }, (_, i) => i);
const HOURS_INNER = Array.from({ length: 12 }, (_, i) => i + 12);
const MINUTE_MARKS = Array.from({ length: 12 }, (_, i) => i * 5);

/** 針を回して時刻を選ぶ時計の盤面。まず時、続けて分を選ぶ。 */
export function DialTimePicker({ label, value, onChange, description }: Props) {
  const id = useId();
  const parsed = parseTime(value);
  const [mode, setMode] = useState<Mode>("hour");
  const dragging = useRef(false);
  const faceRef = useRef<SVGSVGElement>(null);

  const hour = parsed?.hour ?? 0;
  const minute = parsed?.minute ?? 0;

  const setHour = (next: number) => onChange(formatTime(next, minute));
  const setMinute = (next: number) => onChange(formatTime(hour, next));

  const choose = (event: PointerEvent<SVGSVGElement>) => {
    const rect = faceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (mode === "hour") {
      const ratio = Math.hypot(dx, dy) / (rect.width / 2);
      setHour(hourFromPoint(dx, dy, ratio));
    } else {
      setMinute(minuteFromPoint(dx, dy));
    }
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    choose(event);
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) choose(event);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (mode === "hour") setMode("minute");
  };

  // 矢印キーで 1 ずつ、PageUp/PageDown で時は 6、分は 5 ずつ動かす。
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
    const jump = { PageUp: 1, PageDown: -1 }[event.key];
    if (step === undefined && jump === undefined) return;
    event.preventDefault();
    if (mode === "hour") {
      const delta = step ?? (jump ?? 0) * 6;
      setHour((((hour + delta) % 24) + 24) % 24);
    } else {
      const delta = step ?? (jump ?? 0) * 5;
      setMinute((((minute + delta) % 60) + 60) % 60);
    }
  };

  const hand = parsed ? (mode === "hour" ? hourHand(hour) : minuteHand(minute)) : null;
  const reduced = useReducedMotion() ?? false;
  const valueText = parsed ? `${hour}時${minute}分` : "未選択";

  return (
    <div className={styles.field}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>

      <div className={styles.readout} role="toolbar" aria-labelledby={`${id}-label`}>
        <button
          type="button"
          className={styles.part}
          aria-pressed={mode === "hour"}
          onClick={() => setMode("hour")}
        >
          <Digits text={parsed ? String(hour).padStart(2, "0") : "--"} />
        </button>
        <span className={styles.colon} aria-hidden="true">
          :
        </span>
        <button
          type="button"
          className={styles.part}
          aria-pressed={mode === "minute"}
          onClick={() => setMode("minute")}
        >
          <Digits text={parsed ? String(minute).padStart(2, "0") : "--"} />
        </button>
      </div>

      {/* SVG の盤面は input では作れないため、スライダーの役割を明示する。 */}
      <svg
        ref={faceRef}
        className={styles.face}
        viewBox="0 0 200 200"
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="slider"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-valuetext={`${mode === "hour" ? "時を選択中" : "分を選択中"}、${valueText}`}
        aria-valuemin={0}
        aria-valuemax={mode === "hour" ? 23 : 59}
        aria-valuenow={mode === "hour" ? hour : minute}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <circle className={styles.plate} cx={CENTER} cy={CENTER} r={96} />

        <Hand target={hand} dragging={dragging} />
        <circle className={styles.pivot} cx={CENTER} cy={CENTER} r={3} />

        {/* 時と分で数字を入れ替えるとき、新しい数字がふわっと現れる。 */}
        <motion.g
          key={mode}
          initial={reduced ? false : { opacity: 0, scale: mode === "minute" ? 0.92 : 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: reduced ? 0 : motionTokens.duration.standard,
            ease: [...motionTokens.ease.enter],
          }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        >
          {mode === "hour" ? (
            <>
              {HOURS_OUTER.map((h) => (
                <Mark
                  key={h}
                  text={String(h).padStart(2, "0")}
                  {...pointAt(h * 30, OUTER_RADIUS)}
                  on={parsed?.hour === h}
                />
              ))}
              {HOURS_INNER.map((h) => (
                <Mark
                  key={h}
                  text={String(h)}
                  {...pointAt((h - 12) * 30, INNER_RADIUS)}
                  on={parsed?.hour === h}
                  small
                />
              ))}
            </>
          ) : (
            MINUTE_MARKS.map((m) => (
              <Mark
                key={m}
                text={String(m).padStart(2, "0")}
                {...pointAt(m * 6, OUTER_RADIUS)}
                on={parsed?.minute === m}
              />
            ))
          )}
        </motion.g>
      </svg>

      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}

/**
 * 針。角度と半径をばねで動かし、先端の座標はそこから求める。
 * 角度は一番近い向きに回る（359度→1度で逆回りしない）。ドラッグ中は遅れないよう速いばねを使う。
 */
function Hand({
  target,
  dragging,
}: {
  target: { angle: number; radius: number } | null;
  dragging: MutableRefObject<boolean>;
}) {
  const reduced = useReducedMotion() ?? false;
  const angle = useMotionValue(0);
  const radius = useMotionValue(OUTER_RADIUS);
  const shown = useRef(false);
  const x = useTransform([angle, radius], ([a, r]: number[]) => pointAt(a, r).x);
  const y = useTransform([angle, radius], ([a, r]: number[]) => pointAt(a, r).y);

  const targetAngle = target?.angle;
  const targetRadius = target?.radius;

  useEffect(() => {
    if (targetAngle === undefined || targetRadius === undefined) {
      shown.current = false;
      return;
    }
    const delta = ((((targetAngle - angle.get()) % 360) + 540) % 360) - 180;
    const nextAngle = angle.get() + delta;
    if (!shown.current || reduced) {
      // 初めて現れるときと動きを減らす設定では、その場に置く。
      angle.jump(nextAngle);
      radius.jump(targetRadius);
      shown.current = true;
      return;
    }
    const spring = dragging.current ? motionTokens.spring.responsive : motionTokens.spring.snappy;
    const a = animate(angle, nextAngle, spring);
    const r = animate(radius, targetRadius, spring);
    return () => {
      a.stop();
      r.stop();
    };
  }, [targetAngle, targetRadius, reduced, angle, radius, dragging]);

  return (
    <AnimatePresence>
      {target && (
        <motion.g
          className={styles.hand}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : motionTokens.duration.fast }}
        >
          <motion.line x1={CENTER} y1={CENTER} x2={x} y2={y} />
          <motion.circle cx={x} cy={y} r={15} />
        </motion.g>
      )}
    </AnimatePresence>
  );
}

/** 数字が変わると、増えたら下から、減ったら上から入れ替わる。 */
function Digits({ text }: { text: string }) {
  const reduced = useReducedMotion() ?? false;
  const [last, setLast] = useState(text);
  const [d, setD] = useState(1);
  if (last !== text) {
    const next = Number(text);
    const prev = Number(last);
    setD(Number.isFinite(next) && Number.isFinite(prev) && next < prev ? -1 : 1);
    setLast(text);
  }
  return (
    <span className={styles.digits}>
      {/* 古い数字は残さず、すぐ置き換える。新しい数字だけが少しずれた位置から収まる。 */}
      <motion.span
        key={text}
        style={{ display: "inline-block" }}
        initial={reduced ? false : { y: `${d * 0.3}em` }}
        animate={{ y: 0 }}
        transition={{
          duration: reduced ? 0 : motionTokens.duration.fast,
          ease: [...motionTokens.ease.standard],
        }}
      >
        {text}
      </motion.span>
    </span>
  );
}

function Mark({
  text,
  x,
  y,
  on,
  small,
}: {
  text: string;
  x: number;
  y: number;
  on: boolean;
  small?: boolean;
}) {
  const className = [styles.mark, small ? styles.markSmall : "", on ? styles.markOn : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <text
      className={className}
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      aria-hidden="true"
    >
      {text}
    </text>
  );
}
