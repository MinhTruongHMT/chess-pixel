import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Move, Square } from 'chess.js';
import MainMenu from './screens/MainMenu';
import SettingsScreen from './screens/Settings';
import ModeSelection from './screens/ModeSelection';
import Help from './screens/Help';
import GameOver from './screens/GameOver';
import Icon from './components/Icon';
import { ChessSession } from './chess/ChessSession';
import { useAI } from './hooks/useAI';
import { playSound } from './utils/sound';
import { hasSavedGame, readSettings, SAVE_KEY, writeSettings } from './utils/storage';
import type { GameMode, Promotion, Settings } from './types';

const GameScreen = lazy(() => import('./screens/GameScreen'));

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="fatal-error paper-panel"><h1>Không tải được cuộc phiêu lưu</h1><p>Hãy tải lại trang. Ván đã lưu vẫn nằm trong trình duyệt.</p><button className="pixel-button" onClick={() => location.reload()}>Tải lại</button></main>;
    return this.props.children;
  }
}

export default function App() { return <ErrorBoundary><Adventure /></ErrorBoundary>; }

function Adventure() {
  const [session] = useState(() => new ChessSession());
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [settings, setSettings] = useState(readSettings);
  const [modal, setModal] = useState<'settings' | 'help' | null>(null);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [hasSave, setHasSave] = useState(hasSavedGame);
  const [hasStarted, setHasStarted] = useState(false);
  const [matchId, setMatchId] = useState(0);
  const [notice, setNotice] = useState('');
  const [dismissedResult, setDismissedResult] = useState(-1);
  const soundSettings = useRef(settings);
  soundSettings.current = settings;

  const moveSound = useCallback((move: Move) => {
    playSound(move.san.includes('#') ? 'victory' : move.san.includes('+') ? 'check' : move.promotion ? 'promotion' : move.captured ? 'capture' : 'move', soundSettings.current);
  }, []);
  const ai = useAI(session, snapshot, screen === 'game', settings.difficulty, moveSound);
  useEffect(() => {
    if (screen !== 'game') return;
    const timer = window.setInterval(() => session.tick(), 100);
    const onVisibility = () => session.tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [screen, session]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const changeSettings = (next: Settings) => {
    setSettings(next);
    try { writeSettings(next); }
    catch { setNotice('Không lưu được cài đặt. Kiểm tra quyền lưu trữ của trình duyệt.'); }
  };
  const start = (nextMode: GameMode) => {
    ai.cancel(); session.start(nextMode, settings.minutes);
    setMatchId((value) => value + 1);
    setHasStarted(true); setScreen('game'); setMode(null); setDismissedResult(-1);
  };
  const goMenu = () => { ai.cancel(); session.pause(); setScreen('menu'); setModal(null); };
  const save = () => {
    try { localStorage.setItem(SAVE_KEY, session.serialize()); setHasSave(true); setNotice('Đã lưu ván cờ trên trình duyệt này.'); }
    catch { setNotice('Không lưu được ván cờ. Bộ nhớ có thể đã đầy hoặc bị chặn.'); }
  };
  const load = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) { setNotice('Chưa có ván cờ đã lưu.'); setHasSave(false); return; }
      ai.cancel(); session.restore(raw);
      setMatchId((value) => value + 1);
      setHasStarted(true); setScreen('game'); setDismissedResult(-1);
      setNotice('Đã mở ván cờ. Sẵn sàng tiếp tục!');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không đọc được ván cờ đã lưu.'); }
  };
  const onMove = (from: Square, to: Square, promotion?: Promotion) => {
    const current = session.getSnapshot();
    if (current.mode === 'ai' && current.turn !== 'w') return;
    const move = session.move(from, to, promotion);
    if (move) moveSound(move);
  };

  return <div className="app-world" onClickCapture={(event) => {
    if ((event.target as HTMLElement).closest('button:not(:disabled)')) playSound('click', soundSettings.current);
  }}>
    <header className="site-header"><a className="brand" href="#" onClick={(event) => { event.preventDefault(); goMenu(); }}><img src="/assets/favicon.svg" alt="" /><span>PIXEL CHESS<small>ADVENTURE</small></span></a>
      <div className="header-right"><span className="edition-label">MỘT CUỘC PHIÊU LƯU 8-BIT</span><button className="icon-button" onClick={() => setModal('help')} aria-label="Hướng dẫn"><Icon name="book" /></button><button className="icon-button" onClick={() => setModal('settings')} aria-label="Cài đặt"><Icon name="gear" /></button></div>
    </header>
    {screen === 'menu' ? <MainMenu onPlay={setMode} onHelp={() => setModal('help')} onSettings={() => setModal('settings')} onLoad={load} onResume={() => { session.resume(); setScreen('game'); }} canResume={hasStarted} hasSave={hasSave} /> :
      <Suspense fallback={<div className="board-loading paper-panel" role="status">Đang chuẩn bị bàn cờ…</div>}>
        <GameScreen key={matchId} session={session} settings={settings} onMenu={goMenu} onSettings={() => setModal('settings')} onSave={save}
          onUndo={() => { ai.cancel(); session.undo(); setDismissedResult(-1); }} onRestart={() => start(snapshot.mode)} onMove={onMove}
          thinking={ai.thinking} aiError={ai.error} onRetry={ai.retry} />
      </Suspense>}
    <footer className="site-footer"><span>ĐƯỢC TẠO TỪ PIXEL & NHỮNG NƯỚC ĐI</span><span>CHƠI CHẬM. NGHĨ SÂU. TẬN HƯỞNG.</span></footer>
    {modal === 'help' && <Help onClose={() => setModal(null)} />}
    {modal === 'settings' && <SettingsScreen settings={settings} onChange={changeSettings} onClose={() => setModal(null)} />}
    {mode && <ModeSelection mode={mode} settings={settings} onChange={changeSettings} onStart={() => start(mode)} onClose={() => setMode(null)} />}
    {screen === 'game' && snapshot.result && dismissedResult !== snapshot.revision && !modal &&
      <GameOver result={snapshot.result} mode={snapshot.mode} animation={settings.animation} onMenu={goMenu} onReplay={() => start(snapshot.mode)} onReview={() => setDismissedResult(snapshot.revision)} />}
    {notice && <div className="toast" role="status"><Icon name="flag" size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
  </div>;
}
