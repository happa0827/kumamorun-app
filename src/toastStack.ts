/** トーストの積み上げと、消えるまでの時間。見た目は React、時間の規則はここ。 */

export const TOAST_MS = 6000;

export interface Scheduler {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface ToastItem {
  id: number;
  title: string;
  body: string;
}

interface Entry {
  item: ToastItem;
  timer: unknown | null;
  held: boolean;
}

export class ToastStack {
  private entries: Entry[] = [];
  private nextId = 1;

  constructor(
    private readonly scheduler: Scheduler,
    private readonly onChange: (items: ToastItem[]) => void,
  ) {}

  /** 古いものが先、新しいものが後。 */
  get items(): ToastItem[] {
    return this.entries.map((entry) => entry.item);
  }

  show(title: string, body: string): number {
    const id = this.nextId++;
    const entry: Entry = { item: { id, title, body }, timer: null, held: false };
    this.entries.push(entry);
    this.arm(entry);
    this.onChange(this.items);
    return id;
  }

  dismiss(id: number): void {
    const entry = this.find(id);
    if (!entry) return;
    this.stop(entry);
    this.entries = this.entries.filter((e) => e !== entry);
    this.onChange(this.items);
  }

  /** カーソルが載った。離れるまで消さない。 */
  hold(id: number): void {
    const entry = this.find(id);
    if (!entry) return;
    entry.held = true;
    this.stop(entry);
  }

  /** カーソルが離れた。保持していたなら、6000ミリ秒を数え直す。 */
  release(id: number): void {
    const entry = this.find(id);
    if (!entry || !entry.held) return;
    entry.held = false;
    this.arm(entry);
  }

  private find(id: number): Entry | undefined {
    return this.entries.find((entry) => entry.item.id === id);
  }

  private stop(entry: Entry): void {
    if (entry.timer !== null) this.scheduler.clearTimeout(entry.timer);
    entry.timer = null;
  }

  private arm(entry: Entry): void {
    this.stop(entry);
    entry.timer = this.scheduler.setTimeout(() => this.dismiss(entry.item.id), TOAST_MS);
  }
}
