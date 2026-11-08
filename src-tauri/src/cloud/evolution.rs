//! 保留中の進化をサーバーへ反映する手順。成長か開花かは Rust（`growth`）が決め、
//! サーバーは「いまの段階が `expected` のときだけ」段階と花を一緒に書く。
//! 別の端末と同時に進めても二重に進まない。衝突したら、応答の今の値で判定し直す。

use crate::domain::growth::{Evolution, Flower, evolve};
use crate::storage::Progress;

use super::http::ApiError;

/// 衝突しても判定し直す回数。
const MAX_ATTEMPTS: u32 = 3;

/// 次の一手。開花なら段階は 0 に戻り、花が増える。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Plan {
    pub next_stage: u32,
    pub flower: Option<Flower>,
    pub gain: u32,
}

/// 現在の段階から次に起きること（成長か開花）を決める。`roll` は 0以上100未満の抽選値。
pub fn plan(current: u32, roll: f64) -> Plan {
    match evolve(current, roll) {
        Evolution::Grew { stage } => Plan {
            next_stage: stage,
            flower: None,
            gain: 0,
        },
        Evolution::Bloomed { flower } => Plan {
            next_stage: 0,
            flower: Some(flower),
            gain: flower.gain(),
        },
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum EvolveError {
    /// 段階が読んだ値と違った。サーバーの今の値を添える。
    Conflict(Progress),
    Api(ApiError),
}

pub(crate) trait EvolutionApi {
    async fn evolve(&self, expected: u32, next: u32, add: u32) -> Result<Progress, EvolveError>;
}

/// 保留の出し入れと、次の一手の決定、反映できたことの通知。
pub(crate) trait EvolutionHost {
    /// 保留から1つ取り出す。無ければ false。
    fn take(&self) -> bool;
    /// 反映できなかった分を保留に戻す。
    fn restore(&self);
    fn plan(&self, current: u32) -> Plan;
    /// 反映できた。通知と、今日の花の記録、段階と花の控えの更新を行う。
    fn commit(&self, flower: Option<Flower>, progress: Progress);
}

#[derive(Debug, PartialEq)]
pub struct Outcome {
    /// 反映できた進化の数。
    pub applied: u32,
    /// 最後にわかっているサーバーの値。
    pub progress: Progress,
    /// 途中で止まった理由。
    pub error: Option<ApiError>,
}

/// 保留が尽きるか、失敗するまで反映する。失敗した分は保留に戻して止まる。
pub(crate) async fn apply_pending(
    host: &impl EvolutionHost,
    api: &impl EvolutionApi,
    mut progress: Progress,
) -> Outcome {
    let mut applied = 0;
    while host.take() {
        let mut done = None;
        for _ in 0..MAX_ATTEMPTS {
            let next = host.plan(progress.stage);
            match api.evolve(progress.stage, next.next_stage, next.gain).await {
                Ok(now) => {
                    progress = now;
                    done = Some(next);
                    break;
                }
                Err(EvolveError::Conflict(current)) => progress = current,
                Err(EvolveError::Api(error)) => {
                    host.restore();
                    return Outcome {
                        applied,
                        progress,
                        error: Some(error),
                    };
                }
            }
        }
        let Some(done) = done else {
            host.restore();
            return Outcome {
                applied,
                progress,
                error: Some(ApiError::Retry("進化が衝突し続けました".into())),
            };
        };
        host.commit(done.flower, progress);
        applied += 1;
    }
    Outcome {
        applied,
        progress,
        error: None,
    }
}

#[cfg(test)]
mod tests {
    use std::cell::{Cell, RefCell};
    use std::collections::VecDeque;

    use super::*;

    fn at(stage: u32, flowers: u32) -> Progress {
        Progress { stage, flowers }
    }

    struct Host {
        pending: Cell<u32>,
        roll: f64,
        commits: RefCell<Vec<(Option<Flower>, Progress)>>,
    }

    impl Host {
        fn with(pending: u32) -> Self {
            Self {
                pending: Cell::new(pending),
                roll: 0.0,
                commits: RefCell::new(Vec::new()),
            }
        }
    }

    impl EvolutionHost for Host {
        fn take(&self) -> bool {
            let n = self.pending.get();
            self.pending.set(n.saturating_sub(1));
            n > 0
        }
        fn restore(&self) {
            self.pending.set(self.pending.get() + 1);
        }
        fn plan(&self, current: u32) -> Plan {
            plan(current, self.roll)
        }
        fn commit(&self, flower: Option<Flower>, progress: Progress) {
            self.commits.borrow_mut().push((flower, progress));
        }
    }

    /// 呼ばれた引数を記録し、用意した応答を順に返す。
    struct Api {
        replies: RefCell<VecDeque<Result<Progress, EvolveError>>>,
        calls: RefCell<Vec<(u32, u32, u32)>>,
    }

    impl Api {
        fn with(replies: Vec<Result<Progress, EvolveError>>) -> Self {
            Self {
                replies: RefCell::new(replies.into()),
                calls: RefCell::new(Vec::new()),
            }
        }
    }

    impl EvolutionApi for Api {
        async fn evolve(
            &self,
            expected: u32,
            next: u32,
            add: u32,
        ) -> Result<Progress, EvolveError> {
            self.calls.borrow_mut().push((expected, next, add));
            self.replies
                .borrow_mut()
                .pop_front()
                .expect("用意した応答より多く呼ばれた")
        }
    }

    fn run<T>(future: impl Future<Output = T>) -> T {
        tokio::runtime::Builder::new_current_thread()
            .build()
            .unwrap()
            .block_on(future)
    }

    #[test]
    fn 成長は段階を1つ上げ_花は増えない() {
        assert_eq!(
            plan(2, 0.0),
            Plan {
                next_stage: 3,
                flower: None,
                gain: 0
            }
        );
    }

    #[test]
    fn 上限では開花して0に戻り_花は抽選で決まる() {
        assert_eq!(
            plan(5, 0.0),
            Plan {
                next_stage: 0,
                flower: Some(Flower::Dandelion),
                gain: 1
            }
        );
        // 夜桜は2つ。
        assert_eq!(plan(5, 99.5).gain, 2);
        assert_eq!(plan(5, 99.5).next_stage, 0);
    }

    #[test]
    fn 保留が無ければ何もしない() {
        let host = Host::with(0);
        let api = Api::with(vec![]);
        let out = run(apply_pending(&host, &api, at(1, 0)));
        assert_eq!(
            out,
            Outcome {
                applied: 0,
                progress: at(1, 0),
                error: None
            }
        );
        assert!(api.calls.borrow().is_empty());
    }

    #[test]
    fn 保留を順に反映し_段階を引き継ぐ() {
        let host = Host::with(2);
        let api = Api::with(vec![Ok(at(2, 0)), Ok(at(3, 0))]);
        let out = run(apply_pending(&host, &api, at(1, 0)));
        assert_eq!(out.applied, 2);
        assert_eq!(out.progress, at(3, 0));
        assert_eq!(out.error, None);
        assert_eq!(*api.calls.borrow(), vec![(1, 2, 0), (2, 3, 0)]);
        assert_eq!(host.commits.borrow().len(), 2);
        assert_eq!(host.pending.get(), 0);
    }

    #[test]
    fn 開花は花を足して段階を0に戻す() {
        let host = Host::with(1);
        let api = Api::with(vec![Ok(at(0, 8))]);
        let out = run(apply_pending(&host, &api, at(5, 7)));
        assert_eq!(*api.calls.borrow(), vec![(5, 0, 1)]);
        assert_eq!(out.progress, at(0, 8));
        assert_eq!(
            *host.commits.borrow(),
            vec![(Some(Flower::Dandelion), at(0, 8))]
        );
    }

    #[test]
    fn 衝突したら_今の値で判定し直す() {
        // 別の端末が先に 1 → 2 に進めていた。
        let host = Host::with(1);
        let api = Api::with(vec![Err(EvolveError::Conflict(at(2, 0))), Ok(at(3, 0))]);
        let out = run(apply_pending(&host, &api, at(1, 0)));
        assert_eq!(*api.calls.borrow(), vec![(1, 2, 0), (2, 3, 0)]);
        assert_eq!(out.applied, 1);
        assert_eq!(out.progress, at(3, 0));
        // 反映できたのは1回だけ。二重には進まない。
        assert_eq!(host.commits.borrow().len(), 1);
    }

    #[test]
    fn 衝突が続けば_保留に戻して止まる() {
        let host = Host::with(1);
        let api = Api::with(vec![
            Err(EvolveError::Conflict(at(2, 0))),
            Err(EvolveError::Conflict(at(3, 0))),
            Err(EvolveError::Conflict(at(4, 0))),
        ]);
        let out = run(apply_pending(&host, &api, at(1, 0)));
        assert_eq!(out.applied, 0);
        assert!(out.error.is_some());
        assert_eq!(host.pending.get(), 1, "失った進化は保留に戻る");
        assert!(host.commits.borrow().is_empty());
    }

    #[test]
    fn 通信に失敗したら_その分を保留に戻して止まる() {
        let host = Host::with(2);
        let api = Api::with(vec![
            Ok(at(2, 0)),
            Err(EvolveError::Api(ApiError::Retry("503".into()))),
        ]);
        let out = run(apply_pending(&host, &api, at(1, 0)));
        assert_eq!(out.applied, 1);
        assert_eq!(out.progress, at(2, 0));
        assert_eq!(out.error, Some(ApiError::Retry("503".into())));
        // 1つは反映済み。失敗した1つが保留に残る。
        assert_eq!(host.pending.get(), 1);
        assert_eq!(host.commits.borrow().len(), 1);
    }

    #[test]
    fn ログインの失効でも_保留に戻して止まる() {
        let host = Host::with(1);
        let api = Api::with(vec![Err(EvolveError::Api(ApiError::Unauthorized))]);
        let out = run(apply_pending(&host, &api, at(0, 0)));
        assert_eq!(out.error, Some(ApiError::Unauthorized));
        assert_eq!(host.pending.get(), 1);
    }
}
