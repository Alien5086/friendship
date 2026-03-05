import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Trophy, 
  RefreshCcw, 
  ArrowRight,
  UserCheck, 
  Trash2,
  Star,
  Clock,
  CheckCircle2,
  Play,
  Settings,
  ChevronRight as ChevronRightIcon,
  Layers,
  X,
  Radio,
  Activity,
  Box,
  Leaf,
  MapPin,
  Heart,
  Footprints,
  RotateCcw,
  BookOpen,
  Grab,
  Navigation,
  MousePointer2,
  RotateCw,
  ClipboardCheck,
  UserPlus
} from 'lucide-react';

const APP_ID = 'interstellar-friendship';

// --- 配置：背景配色 ---
const CARD_COLORS = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
  "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"
];

// --- 組件：角色圖標 ---
const CharacterIcon = ({ type, color = "#FFD700", size = "w-8 h-8" }) => {
  if (type === 'alien') {
    return (
      <svg viewBox="0 0 100 100" className={`${size} transition-colors duration-1000`}>
        <circle cx="50" cy="50" r="45" fill={color} />
        <ellipse cx="35" cy="40" rx="5" ry="8" fill="#000" />
        <ellipse cx="65" cy="40" rx="5" ry="8" fill="#000" />
        <path d="M 35 65 Q 50 80 65 65" stroke="#000" strokeWidth="3" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className={size}>
      <path d="M 20 20 L 40 40 L 10 40 Z" fill="#FFB6C1" />
      <path d="M 80 20 L 60 40 L 90 40 Z" fill="#FFB6C1" />
      <circle cx="50" cy="60" r="35" fill="#FFE4E1" />
      <circle cx="40" cy="55" r="4" fill="#000" />
      <circle cx="60" cy="55" r="4" fill="#000" />
      <path d="M 45 70 Q 50 75 55 70" stroke="#FF69B4" strokeWidth="2" fill="none" />
    </svg>
  );
};

const App = () => {
  // --- 1. 基礎狀態 ---
  const [gameState, setGameState] = useState('lobby'); 
  const [level, setLevel] = useState(1);
  const [numPlayers, setNumPlayers] = useState(2);
  const [role, setRole] = useState('leader'); 
  const [memberSlot, setMemberSlot] = useState(0); 
  const [alienAura, setAlienAura] = useState(0); 
  const [gameLog, setGameLog] = useState([]);
  const [feedback, setFeedback] = useState("");

  // 關卡 1
  const [l1Grid, setL1Grid] = useState([]); 
  const [l1Target, setL1Target] = useState([]); 

  // 關卡 2
  const [l2Grid, setL2Grid] = useState([]); 
  const [l2Sequence, setL2Sequence] = useState([]); 
  const [l2CurrentStep, setL2CurrentStep] = useState(0); 
  const [l2CurrentNum, setL2CurrentNum] = useState(1);
  const [l2TimeLeft, setL2TimeLeft] = useState(300); 
  const [l2Lives, setL2Lives] = useState(2);
  const [l2MemberCoords, setL2MemberCoords] = useState([]);

  // 關卡 3
  const [l3State, setL3State] = useState('jinnang'); 
  const [l3Cards, setL3Cards] = useState([]); 
  const [l3ActiveCardIdx, setL3ActiveCardIdx] = useState(null);
  const [l3TimeLeft, setL3TimeLeft] = useState(600); 
  const [l3SortingOrder, setL3SortingOrder] = useState([]); 
  const [draggingPieceId, setDraggingPieceId] = useState(null); 
  const pointerDownTimeRef = useRef(0);
  const puzzleBoardRef = useRef(null);
  const l3Sentence = useMemo(() => "團結合作彼此信任".split(""), []);

  // 關卡 4
  const [l4Mode, setL4Mode] = useState('edit'); 
  const [l4Elements, setL4Elements] = useState([]); 
  const [l4Password, setL4Password] = useState('');
  const [l4SolveInput, setL4SolveInput] = useState('');
  const [l4ToolType, setL4ToolType] = useState('maze'); 
  const [l4ShowUnlockModal, setL4ShowUnlockModal] = useState(false);
  const [l4IsShaking, setL4IsShaking] = useState(false);
  const [l4RadarActive, setL4RadarActive] = useState(false);
  const [l4PlayerPos, setL4PlayerPos] = useState({ x: 2.5, y: 3.3 });

  // 常數
  const L2_INNER_RADIUS = 21; 
  const L2_MAX_ELASTIC_DIST = 55; 
  const GRID_COLS = 20; const GRID_ROWS = 15;
  const CELL_W = 100 / GRID_COLS; const CELL_H = 100 / GRID_ROWS;
  const L4_LIMITS = { maze: 80, crate: 20, bush: 20, real_chest: 1, trap_chest: 4, mine: 8, star: 10 };

  // --- 2. 輔助函數 ---
  const addLog = useCallback((msg) => setGameLog(p => [String(msg), ...p].slice(0, 5)), []);
  const showFeedback = useCallback((msg) => { 
    if(typeof msg === 'string') { setFeedback(msg); setTimeout(() => setFeedback(""), 2500); } 
  }, []);

  const alienColor = useMemo(() => {
    const val = Math.min(alienAura, 100);
    return val >= 100 ? '#FFD700' : `rgb(${120 + val}, ${120 + val}, ${80 + val})`;
  }, [alienAura]);

  // --- 3. 各關卡初始化與開始邏輯 ---

  const initLevel1 = useCallback(() => {
    const solved = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    const target = [...solved].sort(() => Math.random() - 0.5);
    setL1Target(target);
    let current = [...target];
    for (let i = 0; i < 40; i++) {
      const emptyIdx = current.indexOf(0);
      const neighbors = [];
      if (emptyIdx % 3 > 0) neighbors.push(emptyIdx - 1);
      if (emptyIdx % 3 < 2) neighbors.push(emptyIdx + 1);
      if (emptyIdx >= 3) neighbors.push(emptyIdx - 3);
      if (emptyIdx < 6) neighbors.push(emptyIdx + 3);
      const rand = neighbors[Math.floor(Math.random() * neighbors.length)];
      [current[emptyIdx], current[rand]] = [current[rand], current[emptyIdx]];
    }
    setL1Grid(current);
  }, []);

  const initLevel2 = useCallback(() => {
    const pts = []; const minS = 10; const inS = 32; const outM = 46;
    for (let i = 1; i <= 50; i++) {
      let found = false; let att = 0;
      while (!found && att < 500) {
        const x = 10 + Math.random() * 80; const y = 10 + Math.random() * 80;
        const dist = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
        if (dist > inS && dist < outM) {
          if (!pts.some(p => Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < minS)) { pts.push({ id: i, x, y }); found = true; }
        }
        att++;
      }
      if (!found) pts.push({ id: i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 });
    }
    setL2Grid(pts);
    setL2Sequence(Array.from({ length: 50 }, (_, i) => i + 1));
    const mCount = numPlayers - 1;
    setL2MemberCoords(Array.from({ length: mCount }).map((_, i) => {
      const a = (i * 360 / mCount) * (Math.PI / 180);
      return { x: 50 + L2_INNER_RADIUS * Math.cos(a), y: 50 + L2_INNER_RADIUS * Math.sin(a), isAtCenter: true };
    }));
    setL2CurrentStep(0); setL2CurrentNum(1); setL2TimeLeft(300); setL2Lives(2);
  }, [numPlayers]);

  const initLevel3 = useCallback(() => {
    setL3State('jinnang'); setL3TimeLeft(600); setL3SortingOrder([]);
    const cards = l3Sentence.map((char, i) => {
      const pieces = Array.from({ length: 9 }, (_, idx) => ({
        id: idx,
        x: 15 + Math.random() * 70, 
        y: 78 + Math.random() * 12,
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
        isCorrect: false
      }));
      return { char, color: CARD_COLORS[i % CARD_COLORS.length], pieces, isSolved: false, assignedTo: null };
    });
    setL3Cards(cards);
  }, [l3Sentence]);

  const startGame = useCallback((lv = 1) => {
    setLevel(lv); setAlienAura((lv - 1) * 25); 
    if (lv === 1) initLevel1();
    if (lv === 2) initLevel2();
    if (lv === 3) initLevel3();
    if (lv === 4) {
      setL4Mode('edit'); setL4Elements([]); setL4RadarActive(false); setL4PlayerPos({ x: 2.5, y: 3.3 });
    }
    setGameState('playing');
    addLog(`任務啟動：進入第 ${lv} 關。`);
  }, [initLevel1, initLevel2, initLevel3, addLog]);

  const resetToL1 = useCallback((reason) => {
    addLog(`🚨 失敗：${reason}！全隊遣返！`);
    setGameState('failed');
    setTimeout(() => { startGame(1); }, 3000);
  }, [addLog, startGame]);

  const nextLevel = useCallback(() => {
    setAlienAura(p => Math.min(p + 25, 100));
    if (level < 4) {
      const nextLv = level + 1;
      setLevel(nextLv);
      startGame(nextLv);
    } else setGameState('finished');
  }, [level, startGame]);

  const moveL4Player = useCallback((dx, dy) => {
    if (l4Mode !== 'challenge' || role !== 'member' || l4ShowUnlockModal) return;
    setL4PlayerPos(p => {
      const nx = Math.max(CELL_W / 2, Math.min(100 - CELL_W / 2, p.x + dx));
      const ny = Math.max(CELL_H / 2, Math.min(100 - CELL_H / 2, p.y + dy));
      const gx = Math.floor(nx / CELL_W), gy = Math.floor(ny / CELL_H);
      const el = l4Elements.find(e => e.gx === gx && e.gy === gy);
      if (el && ['maze', 'crate', 'bush'].includes(el.type)) return p;
      if (el && el.type === 'mine') { resetToL1("踩到地雷"); return p; }
      if (el && el.type === 'trap_chest') { resetToL1("偽裝陷阱！"); return p; }
      if (el && el.type === 'real_chest') { setL4ShowUnlockModal(true); return p; }
      return { x: nx, y: ny };
    });
  }, [l4Mode, role, l4Elements, l4ShowUnlockModal, resetToL1, CELL_W, CELL_H]);

  // --- 4. 拼圖旋轉與拖拉邏輯 ---

  const handlePiecePointerDown = (e, pieceId) => {
    if (role === 'leader') return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId); 
    setDraggingPieceId(pieceId);
    pointerDownTimeRef.current = Date.now();
  };

  const handlePuzzlePointerMove = (e) => {
    if (draggingPieceId === null || role === 'leader' || !puzzleBoardRef.current) return;
    const rect = puzzleBoardRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 100;
    const ny = ((e.clientY - rect.top) / rect.height) * 100;
    
    setL3Cards(prev => {
      const newCards = [...prev];
      const card = newCards[l3ActiveCardIdx];
      if (!card) return prev;
      const piece = card.pieces.find(p => p.id === draggingPieceId);
      if (piece && !piece.isCorrect) {
        piece.x = Math.max(2, Math.min(98, nx));
        piece.y = Math.max(2, Math.min(98, ny));
      }
      return newCards;
    });
  };

  const handlePuzzlePointerUp = (e) => {
    if (draggingPieceId === null || role === 'leader') return;
    const clickDuration = Date.now() - pointerDownTimeRef.current;

    setL3Cards(prev => {
      const newCards = [...prev];
      const card = newCards[l3ActiveCardIdx];
      if (!card) return prev;
      const piece = card.pieces.find(p => p.id === draggingPieceId);
      
      if (piece && !piece.isCorrect) {
        // 點擊旋轉
        if (clickDuration < 200) {
          piece.rotation = (piece.rotation + 90) % 360;
          return newCards;
        }

        // 磁吸條件 (位置與旋轉)
        const col = piece.id % 3; const row = Math.floor(piece.id / 3);
        const targetX = 35 + col * 15; const targetY = 15 + row * 19;
        const dist = Math.sqrt(Math.pow(piece.x - targetX, 2) + Math.pow(piece.y - targetY, 2));
        
        if (dist < 12 && piece.rotation === 0) { 
          piece.x = targetX; piece.y = targetY; piece.isCorrect = true;
          if (card.pieces.every(p => p.isCorrect)) {
            card.isSolved = true;
            setTimeout(() => setL3ActiveCardIdx(null), 800);
            addLog(`✨ 字卡【${card.char}】拼成！`);
            if (newCards.every(c => c.isSolved)) setL3State('sorting');
          }
        } else if (dist < 12 && piece.rotation !== 0) {
           showFeedback("方向不對喔！點擊零件旋轉看看。");
        }
      }
      return newCards;
    });
    setDraggingPieceId(null);
  };

  const autoAssignL3 = () => {
    if (role !== 'leader') return;
    const memberCount = numPlayers - 1;
    const cardsPerMember = Math.ceil(8 / memberCount);
    const newCards = [...l3Cards];
    newCards.forEach((card, idx) => {
      card.assignedTo = Math.floor(idx / cardsPerMember);
    });
    setL3Cards(newCards);
    addLog("📢 小隊長已完成自動任務分配。");
  };

  const handleSortCard = (char) => {
    if (role === 'leader') return;
    if (l3SortingOrder.includes(char)) return;
    const newOrder = [...l3SortingOrder, char];
    setL3SortingOrder(newOrder);
    if (newOrder.length === 8) {
      if (newOrder.join("") === l3Sentence.join("")) {
        addLog("🎉 第三關錦囊妙計解開！");
        nextLevel();
      } else {
        showFeedback("句子順序錯誤，請重新排列！");
        setL3SortingOrder([]);
      }
    }
  };

  // --- 5. 渲染函式定義 (解決 Hoisting 問題) ---

  const renderLobby = () => (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4 font-sans text-center">
      <div className="bg-white rounded-[3.5rem] p-12 max-w-lg w-full shadow-2xl border-b-[12px] border-indigo-100 animate-in zoom-in text-center">
        <div className="flex justify-center mb-8 animate-bounce"><CharacterIcon type="alien" color="#888" size="w-24 h-24" /></div>
        <h1 className="text-4xl font-black text-indigo-600 mb-4 tracking-tighter">星際友誼大冒險</h1>
        <p className="text-gray-500 mb-10 italic">「攜手合作，在危險的星球中尋找唯一的真實。」</p>
        <button onClick={() => setGameState('setup')} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"><Play fill="white" /> 啟動團隊任務</button>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4 font-sans text-center">
      <div className="bg-white rounded-[3.5rem] p-10 max-w-3xl w-full shadow-2xl border-b-8 border-indigo-100 animate-in fade-in">
        <h2 className="text-3xl font-black text-indigo-600 mb-8 flex items-center justify-center gap-3 text-center"><button onClick={() => setGameState('lobby')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><RefreshCcw size={20}/></button> 任務中心</h2>
        <div className="grid md:grid-cols-2 gap-8 text-left text-center">
          <section>
            <div className="flex items-center gap-2 mb-4 text-indigo-500 font-bold justify-center"><Users size={20} /> 遊玩人數 (含領隊)</div>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button key={n} onClick={() => setNumPlayers(n)} className={`py-3 rounded-2xl font-black text-lg border-2 transition-all ${numPlayers === n ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg scale-105' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{n}</button>
              ))}
            </div>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-4 text-indigo-500 font-bold justify-center"><Layers size={20} /> 快速選擇關卡</div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(id => (
                <button key={id} onClick={() => startGame(id)} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 hover:border-indigo-500 flex items-center justify-between font-bold text-gray-600 transition-all text-center">Level {id}: {id===1?'星際棋洞':id===2?'牽手連動':id===3?'字卡拼圖':'尋寶大進擊'} <ChevronRightIcon size={16} /></button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderLevel1 = () => {
    const mc = numPlayers - 1;
    const getAssigned = (p, s) => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8];
      const per = Math.floor(8 / mc); const rem = 8 % mc;
      let start = 0; for(let i=0; i<s; i++) start += (per + (i < rem ? 1 : 0));
      return arr.slice(start, start + (per + (s < rem ? 1 : 0)));
    };
    const assignedNums = getAssigned(numPlayers, memberSlot);
    const handleMove = (idx) => {
      if (role === 'leader') { showFeedback("領導者請指揮夥伴！"); return; }
      const val = l1Grid[idx];
      if (val !== 0 && !assignedNums.includes(val)) { 
        showFeedback(`你是隊員 ${String.fromCharCode(65+memberSlot)}，負責號碼：${assignedNums.join(', ')}`); return; 
      }
      const emptyIdx = l1Grid.indexOf(0);
      const row = Math.floor(idx / 3), col = idx % 3, er = Math.floor(emptyIdx / 3), ec = emptyIdx % 3;
      if (Math.abs(row - er) + Math.abs(col - ec) === 1) {
        const newGrid = [...l1Grid]; [newGrid[emptyIdx], newGrid[idx]] = [newGrid[idx], newGrid[emptyIdx]]; setL1Grid(newGrid);
        if (newGrid.every((v, i) => v === l1Target[i])) { setTimeout(nextLevel, 1000); addLog("✨ 棋洞任務完成！"); }
      } else showFeedback("旁邊沒有空位！");
    };
    return (
      <div className="flex flex-col items-center animate-in fade-in font-sans text-center">
        <h3 className="text-2xl font-black text-indigo-700 mb-6 tracking-tight text-center">第一關：星際棋洞 (九宮格)</h3>
        <div className="flex flex-col md:flex-row gap-10 items-center justify-center w-full">
          <div className="bg-indigo-950 p-4 rounded-[3rem] shadow-2xl border-[8px] border-indigo-900 relative">
             <div className="grid grid-cols-3 gap-3">
                {l1Grid.map((n, i) => (
                  <button key={i} onClick={() => handleMove(i)} className={`w-20 h-20 md:w-28 md:h-28 rounded-[1.5rem] flex items-center justify-center text-4xl font-black transition-all ${n === 0 ? 'bg-indigo-900/30 border-2 border-dashed border-indigo-400/30' : role === 'member' && assignedNums.includes(n) ? 'bg-white text-indigo-600 shadow-xl ring-4 ring-blue-400 border-b-4 border-indigo-200' : role === 'member' ? 'bg-gray-100 text-gray-300 opacity-60 grayscale' : 'bg-white text-indigo-600 shadow-xl'}`}>{n === 0 ? <RefreshCcw className="text-indigo-400 opacity-10" /> : n}</button>
                ))}
             </div>
          </div>
          {role === 'leader' && (
            <div className="bg-yellow-50 p-6 rounded-[2.5rem] border-4 border-yellow-200 shadow-xl relative animate-in slide-in-from-right">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1 rounded-full shadow-md text-center text-center">目標卡</div>
              <div className="grid grid-cols-3 gap-2 mt-2">{l1Target.map((n, i) => (<div key={i} className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black ${n === 0 ? 'bg-yellow-200/50 border border-dashed border-yellow-300' : 'bg-white text-yellow-700 shadow-sm'}`}>{n === 0 ? "" : n}</div>))}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLevel2 = () => {
    const currentTargetId = l2Sequence[l2CurrentStep];
    const mc = numPlayers - 1;
    const handleStep = (item) => {
      if (role === 'leader') { showFeedback("小隊長在外圍指揮即可！"); return; }
      if (item.id !== currentTargetId) {
        if (l2Lives <= 1) resetToL1("失誤過多");
        else { setL2Lives(l => l - 1); showFeedback(`點錯數字！目前應找：${currentTargetId}`); }
        return;
      }
      const newCoords = [...l2MemberCoords];
      newCoords[memberSlot] = { x: item.x, y: item.y, isAtCenter: false };
      let broken = false;
      if (mc > 1) {
        for (let i = 0; i < mc; i++) {
          const p1 = newCoords[i]; const p2 = newCoords[(i + 1) % mc];
          const d = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
          if (d > L2_MAX_ELASTIC_DIST) { broken = true; break; }
        }
      }
      if (broken) {
        if (l2Lives <= 1) resetToL1("手牽太長斷掉了！");
        else { setL2Lives(l => l - 1); showFeedback("⚠️ 手拉太長斷開了！強制彈回。"); }
        return;
      }
      setL2MemberCoords(newCoords);
      if (l2CurrentStep === 49) nextLevel();
      else { 
        setL2CurrentStep(s => s + 1); 
        setL2CurrentNum(n => n + 1);
        addLog(`👣 隊員 ${String.fromCharCode(65+memberSlot)} 踩在 ${item.id} 號。`); 
      }
    };
    const handleReturn = () => {
      if (role === 'leader') return;
      const angle = (memberSlot * 360 / mc) * (Math.PI / 180);
      const newCoords = [...l2MemberCoords];
      newCoords[memberSlot] = { x: 50 + L2_INNER_RADIUS * Math.cos(angle), y: 50 + L2_INNER_RADIUS * Math.sin(angle), isAtCenter: true };
      setL2MemberCoords(newCoords);
    };
    return (
      <div className="flex flex-col items-center animate-in fade-in font-sans text-center text-center">
        <div className="w-full flex flex-col md:flex-row justify-between items-center mb-6 bg-white/70 p-5 rounded-[2.5rem] border border-indigo-100 shadow-sm gap-4">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-full border-4 border-purple-400 bg-white flex items-center justify-center shadow-lg"><CharacterIcon type="alien" color={alienColor} size="w-10 h-10" /></div>
             <div className="text-left text-center"><div className="text-[10px] font-black text-purple-600 uppercase">小隊長指揮中</div><div className="text-sm font-black text-gray-700">目標：請踩 {l2CurrentNum}</div></div>
          </div>
          <div className="flex flex-col items-center bg-indigo-50 px-6 py-2 rounded-3xl border border-indigo-100 min-w-[150px]"><div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">任務進度</div><div className="text-2xl font-black text-indigo-600 text-center">{l2CurrentStep} <span className="text-sm text-indigo-300">/ 50</span></div></div>
          <div className="flex gap-4 text-center text-center"><div className="bg-gray-800 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black shadow-lg text-center"><Clock size={16}/> {Math.floor(l2TimeLeft/60)}:{(l2TimeLeft%60).toString().padStart(2,'0')}</div><div className="bg-red-500 text-white px-4 py-2 rounded-2xl flex items-center gap-1 font-black shadow-lg text-center">{[...Array(l2Lives)].map((_,i)=><Heart key={i} size={16} fill="currentColor"/>)}</div></div>
        </div>
        <div className="relative w-full max-w-2xl aspect-square bg-gray-900 rounded-full border-[10px] border-indigo-950 shadow-2xl overflow-hidden mb-6 mx-auto">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
             {mc > 1 && Array.from({ length: mc }).map((_, i) => {
               const p1 = l2MemberCoords[i]; const p2 = l2MemberCoords[(i + 1) % mc];
               if (!p1 || !p2) return null;
               const d = Math.sqrt(Math.pow(p1.x-p2.x,2)+Math.pow(p1.y-p2.y,2));
               const c = d > L2_MAX_ELASTIC_DIST*0.8 ? "stroke-red-400" : d > L2_MAX_ELASTIC_DIST*0.6 ? "stroke-yellow-400" : "stroke-blue-400";
               return <line key={i} x1={`${p1.x}%`} y1={`${p1.y}%`} x2={`${p2.x}%`} y2={`${p2.y}%`} className={`${c} transition-all`} strokeWidth="4" strokeDasharray={d > L2_MAX_ELASTIC_DIST * 0.7 ? "4,4" : ""} />;
             })}
          </svg>
          {l2MemberCoords.map((pos, i) => (
              <div key={i} className={`absolute w-12 h-12 rounded-full border-2 bg-white flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-700 z-30 ${role === 'member' && i === memberSlot ? 'ring-4 ring-blue-400 scale-125' : 'opacity-80 scale-90'}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <CharacterIcon type="member" size="w-8 h-8" /><div className="absolute -top-7 bg-indigo-600 text-white text-[8px] px-2 rounded-full font-black text-center text-center">隊員 {String.fromCharCode(65 + i)}</div>
              </div>
          ))}
          {l2Grid.map((item) => {
            const isT = item.id === currentTargetId; const isP = item.id < l2CurrentNum;
            const occupied = l2MemberCoords.some(m => Math.abs(m.x - item.x) < 0.1 && Math.abs(m.y - item.y) < 0.1);
            return (
              <button key={item.id} onClick={() => handleStep(item)} style={{ left: `${item.x}%`, top: `${item.y}%` }} className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all -translate-x-1/2 -translate-y-1/2 z-0 ${isP ? (occupied ? 'bg-blue-600 text-white border-white z-40' : 'bg-green-500/20 text-green-500/40 scale-75') : 'bg-gray-800 text-gray-100 border-2 border-gray-600 hover:bg-gray-700'} ${role === 'leader' && isT ? 'bg-orange-500 text-white ring-4 ring-orange-300 scale-125 animate-pulse z-40' : ''}`}>{item.id}</button>
            );
          })}
        </div>
        {role === 'member' && (<button onClick={handleReturn} className="px-8 py-3 bg-indigo-100 text-indigo-700 rounded-full font-black text-sm flex items-center gap-2 hover:bg-indigo-200 transition-all shadow-md mt-2"><RotateCcw size={16} /> 返回中心內圈重新出發</button>)}
      </div>
    );
  };

  const renderLevel3 = () => {
    if (l3State === 'jinnang') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in text-center text-center">
          <div className="bg-orange-100 p-12 rounded-[4rem] shadow-2xl border-4 border-orange-200 relative mb-8 group cursor-pointer" onClick={() => setL3State('assignment')}>
             <div className="absolute inset-0 bg-orange-400/10 rounded-[4rem] animate-ping text-center text-center text-center" />
             <Box size={120} className="text-orange-500 group-hover:scale-110 transition-transform text-center text-center text-center" />
             <div className="absolute -top-4 -right-4 bg-red-500 text-white p-4 rounded-full shadow-lg font-black animate-bounce text-center text-center text-center">妙計</div>
          </div>
          <h3 className="text-3xl font-black text-orange-600 mb-4 text-center">星際錦囊</h3>
          <p className="text-gray-500 max-w-sm leading-relaxed mb-8 text-center text-center">「拼出錦囊妙計，完成任務。」<br/><b>請隊長點擊錦囊，開始【分派拼圖任務】！</b></p>
        </div>
      );
    }

    if (l3State === 'assignment') {
      const allAssigned = l3Cards.every(c => c.assignedTo !== null);
      return (
        <div className="flex flex-col items-center animate-in fade-in font-sans text-center text-center text-center">
           <h3 className="text-2xl font-black text-indigo-700 mb-4 text-center">領隊任務分配區</h3>
           <div className="bg-indigo-50 p-6 rounded-[2.5rem] border-2 border-indigo-100 mb-8 w-full max-w-2xl text-center text-center text-center">
              <div className="flex justify-between items-center mb-6 text-center text-center">
                <p className="text-sm font-bold text-gray-500 text-center">點擊字卡，指派給隊員：</p>
                <button onClick={autoAssignL3} className="px-4 py-2 bg-white border border-indigo-200 rounded-full text-xs font-black text-indigo-600 shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-1 text-center text-center"><UserPlus size={14}/> 自動平均分配</button>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                 {l3Cards.map((c, i) => (
                   <div key={i} className="flex flex-col gap-2 text-center">
                     <button 
                       onClick={() => {
                         const nextMember = c.assignedTo === null ? 0 : (c.assignedTo + 1) % (numPlayers - 1);
                         const newCards = [...l3Cards]; newCards[i].assignedTo = nextMember; setL3Cards(newCards);
                       }}
                       className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-md transition-all text-center
                         ${c.assignedTo !== null ? c.color : 'bg-gray-200 scale-95 opacity-50'}`}
                     >
                       {c.char}
                     </button>
                     <div className="text-[10px] font-black text-indigo-400 text-center">
                        {c.assignedTo !== null ? `隊員 ${String.fromCharCode(65+c.assignedTo)}` : "未指派"}
                     </div>
                   </div>
                 ))}
              </div>
           </div>
           {role === 'leader' ? (
             <button disabled={!allAssigned} onClick={() => setL3State('puzzling')} className={`px-12 py-4 rounded-full font-black text-white shadow-xl transition-all ${allAssigned ? 'bg-indigo-600 hover:bg-indigo-700 scale-105' : 'bg-gray-300'}`}>確認分配並開始拼圖挑戰</button>
           ) : (
             <div className="p-6 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 animate-pulse text-center">等待小隊長分配任務...</div>
           )}
        </div>
      );
    }

    if (l3State === 'puzzling') {
      const activeCard = l3Cards[l3ActiveCardIdx];
      return (
        <div className="flex flex-col items-center animate-in fade-in font-sans h-[680px] relative text-center">
          <div className="w-full flex justify-between items-center mb-6 bg-white p-4 rounded-3xl border shadow-sm text-center">
             <div className="flex items-center gap-4 text-center"><div className="bg-orange-100 p-2 rounded-xl text-orange-600 text-center"><BookOpen size={24}/></div><div className="text-left text-center text-center"><div className="text-[10px] font-black text-orange-500 uppercase">錦囊任務：組裝字卡</div><div className="text-sm font-black text-gray-700 italic">由隊員【抓取】下方零件，拼入上方格點</div></div></div>
             <div className="bg-gray-800 text-white px-6 py-2 rounded-2xl flex items-center gap-2 font-black text-center text-center"><Clock size={18}/> {Math.floor(l3TimeLeft / 60)}:{(l3TimeLeft % 60).toString().padStart(2, '0')}</div>
          </div>

          <div className="grid grid-cols-4 gap-4 w-full mb-4 text-center">
            {role === 'leader' ? (
              l3Cards.map((c, i) => (
                <div key={i} className={`relative aspect-square rounded-[2rem] flex flex-col items-center justify-center shadow-xl border-4 ${c.isSolved ? 'bg-green-50 text-green-600 border-green-400' : 'bg-white border-gray-100 opacity-60'}`}>
                  {c.isSolved ? <CheckCircle2 size={32}/> : <div className="text-2xl font-black opacity-20">{c.char}</div>}
                  <div className="text-[8px] mt-1 font-black">隊員 {String.fromCharCode(65+c.assignedTo)}</div>
                </div>
              ))
            ) : (
              l3Cards.map((c, i) => {
                if (c.assignedTo !== memberSlot) return null;
                return (
                  <button key={i} onClick={() => setL3ActiveCardIdx(i)} className={`relative aspect-square rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-xl transition-all ${c.color} ${c.isSolved ? 'ring-8 ring-green-400 scale-95' : 'opacity-90 hover:scale-105'}`}>
                    {c.isSolved ? <CheckCircle2 size={40}/> : c.char}
                  </button>
                );
              })
            )}
          </div>

          {l3ActiveCardIdx !== null && (
            <div 
              ref={puzzleBoardRef}
              className="absolute inset-0 z-50 bg-white/95 rounded-[3.5rem] p-6 shadow-2xl flex flex-col items-center overflow-hidden animate-in zoom-in duration-300 touch-none text-center"
              onPointerMove={handlePuzzlePointerMove}
              onPointerUp={handlePuzzlePointerUp}
              onPointerLeave={handlePuzzlePointerUp}
            >
              <div className="w-full flex justify-between items-center mb-2 pointer-events-auto text-center">
                <h4 className="text-xl font-black text-gray-400 italic text-center text-center">正在拼接大字：【{activeCard.char}】</h4>
                <button onClick={() => setL3ActiveCardIdx(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-center"><X/></button>
              </div>

              <div className="relative w-full h-[520px] border-t-2 border-dashed border-gray-100 pointer-events-auto text-center">
                {/* 拼接架 */}
                <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-gray-100 rounded-3xl border-4 border-dashed border-gray-200 grid grid-cols-3 grid-rows-3 pointer-events-none overflow-hidden text-center text-center">
                   {Array.from({length:9}).map((_, i) => (
                     <div key={i} className="border border-white/40 bg-gray-200/50 rounded-lg flex items-center justify-center text-[10px] text-gray-300 font-bold text-center text-center">格子 {i+1}</div>
                   ))}
                   {activeCard.pieces.filter(p => p.isCorrect).map(p => (
                     <div 
                       key={p.id} 
                       className={`absolute w-[33.3%] h-[33.3%] ${activeCard.color} rounded-lg flex items-center justify-center overflow-hidden shadow-inner border border-white/20 text-center`}
                       style={{ left: `${(p.id % 3) * 33.3}%`, top: `${Math.floor(p.id / 3) * 33.3}%` }}
                     >
                        <div className="text-[300px] font-black text-white pointer-events-none text-center" style={{ transform: `translate(${(1 - (p.id % 3)) * 100}px, ${(1 - Math.floor(p.id / 3)) * 100}px)`, lineHeight: '300px' }}>{activeCard.char}</div>
                     </div>
                   ))}
                </div>
                <div className="absolute top-[70%] left-0 w-full h-px bg-indigo-100 text-center" />
                <div className="absolute top-[72%] left-1/2 -translate-x-1/2 text-[10px] font-black text-indigo-300 uppercase tracking-widest text-center text-center">零件存放區 (抓取碎片拼接)</div>

                {/* 尚未拼接的碎片 (顯示局部字體) */}
                {activeCard.pieces.filter(p => !p.isCorrect).map(p => (
                  <div 
                    key={p.id} 
                    onPointerDown={(e) => handlePiecePointerDown(e, p.id)}
                    className={`absolute w-16 h-16 ${activeCard.color} rounded-xl flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing transition-transform overflow-hidden
                      ${draggingPieceId === p.id ? 'scale-125 z-50 shadow-2xl brightness-110' : 'z-40'}`} 
                    style={{ 
                      left: `${p.x}%`, top: `${p.y}%`, 
                      transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
                      touchAction: 'none', userSelect: 'none'
                    }}>
                    <div className="absolute top-0.5 right-1 z-10 text-white/40 text-center"><RotateCw size={10}/></div>
                    <div className="text-[160px] font-black text-white pointer-events-none text-center" style={{ transform: `translate(${(1 - (p.id % 3)) * 53}px, ${(1 - Math.floor(p.id / 3)) * 53}px)`, lineHeight: '160px' }}>{activeCard.char}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (l3State === 'sorting') {
      return (
        <div className="flex flex-col items-center animate-in slide-in-from-bottom font-sans text-center text-center">
           <h3 className="text-3xl font-black text-indigo-700 mb-2 text-center text-center">最後挑戰：妙計排列</h3>
           <p className="text-gray-500 mb-8 text-center text-center">字卡拼接完成！請小隊合力，按正確順序點擊字牌。</p>
           <div className="flex flex-wrap gap-2 mb-10 min-h-[6rem] items-center justify-center bg-indigo-50 p-6 rounded-[2.5rem] border-2 border-dashed border-indigo-200 w-full text-center">
              {l3SortingOrder.map((char, i) => {
                const card = l3Cards.find(c => c.char === char);
                return (<div key={i} className={`${card?.color || 'bg-gray-400'} w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg animate-in zoom-in text-center`}>{char}</div>);
              })}
              {l3SortingOrder.length < 8 && <div className="text-indigo-300 font-bold animate-pulse text-center">請依序選擇字牌...</div>}
           </div>
           <div className="grid grid-cols-4 gap-4 mb-8 text-center">
              {l3Cards.map((card, i) => (<button key={i} disabled={l3SortingOrder.includes(card.char)} onClick={() => handleSortCard(card.char)} className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-white shadow-xl transition-all ${card.color} ${l3SortingOrder.includes(card.char) ? 'opacity-10 scale-90 grayscale' : 'hover:scale-110 active:rotate-6'}`}>{card.char}</button>))}
           </div>
           <button onClick={() => setL3SortingOrder([])} className="flex items-center gap-2 text-gray-400 font-bold hover:text-red-500 text-center"><RefreshCcw size={16}/> 清除重排</button>
        </div>
      );
    }
  };

  const renderLevel4 = () => {
    const counts = { maze: l4Elements.filter(e => e.type === 'maze').length, crate: l4Elements.filter(e => e.type === 'crate').length, bush: l4Elements.filter(e => e.type === 'bush').length, real_chest: l4Elements.filter(e => e.type === 'real_chest').length, trap_chest: l4Elements.filter(e => e.type === 'trap_chest').length, star: l4Elements.filter(e => e.type === 'star').length, mine: l4Elements.filter(e => e.type === 'mine').length };
    return (
      <div className="flex flex-col items-center w-full animate-in fade-in relative font-sans text-center text-center">
        <h3 className="text-xl font-bold text-indigo-700 mb-4 tracking-tight text-center">第四關：尋寶大進擊 (拼裝地圖)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full relative text-left">
          {l4ShowUnlockModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl text-center text-center text-center">
              <div className={`bg-white p-8 rounded-[2.5rem] shadow-2xl text-center max-w-[220px] border-t-8 border-orange-400 ${l4IsShaking ? 'animate-bounce' : ''}`}>
                <Trophy className="mx-auto mb-4 text-orange-500" size={40}/><h4 className="font-black text-sm text-gray-800 mb-2 text-center">找到真寶箱！</h4><input type="text" autoFocus className="w-full text-center p-2 text-xl font-black border-2 border-gray-100 rounded-xl uppercase outline-none mb-4 focus:border-orange-200 text-center text-center text-center" value={l4SolveInput} onChange={(e)=>setL4SolveInput(e.target.value)} /><div className="flex gap-2 text-center text-center"><button onClick={() => setL4ShowUnlockModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-400 rounded-xl font-bold text-[10px] text-center text-center">取消</button><button onClick={() => { if (l4SolveInput.toUpperCase() === l4Password) { setL4ShowUnlockModal(false); setL4SolveInput(''); setTimeout(nextLevel, 1000); } else { setL4IsShaking(true); showFeedback("密碼錯誤!"); setTimeout(()=>setL4IsShaking(false), 500); } }} className="flex-[2] py-2 bg-orange-500 text-white rounded-xl font-bold text-[10px] text-center text-center">解鎖</button></div>
              </div>
            </div>
          )}
          {l4Mode === 'edit' && (
            <div className="lg:col-span-1 space-y-4 animate-in slide-in-from-left text-center">
              <div className="bg-indigo-50 p-2.5 rounded-[2.5rem] border border-indigo-100 shadow-sm text-center text-center">
                <div className="grid grid-cols-4 gap-0.5 text-center text-center">{[ { id: 'maze', icon: <Square size={28}/>, label: "牆壁", color: "text-blue-500" }, { id: 'crate', icon: <Box size={28}/>, label: "箱子", color: "text-orange-700" }, { id: 'bush', icon: <Leaf size={28}/>, label: "叢林", color: "text-green-600" }, { id: 'real_chest', icon: <Trophy size={28}/>, label: "真寶", color: "text-yellow-500" }, { id: 'trap_chest', icon: <Skull size={28}/>, label: "陷阱", color: "text-red-400" }, { id: 'mine', icon: <ShieldAlert size={28}/>, label: "地雷", color: "text-red-900" }, { id: 'star', icon: <Star size={28}/>, label: "星星", color: "text-yellow-300" }, { id: 'eraser', icon: <Eraser size={28}/>, label: "抹除", color: "text-gray-600" } ].map(tool => {
                    const r = tool.id === 'eraser' ? null : L4_LIMITS[tool.id] - counts[tool.id];
                    return (<button key={tool.id} onClick={() => setL4ToolType(tool.id)} disabled={tool.id !== 'eraser' && counts[tool.id] >= L4_LIMITS[tool.id]} className={`flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all text-center ${l4ToolType === tool.id ? 'bg-white border-indigo-400 shadow-md scale-105 z-10' : 'border-transparent opacity-70 hover:opacity-100'}`}><div className={tool.color}>{tool.icon}</div><span className="text-[11px] font-black mt-0.5 leading-none tracking-tighter text-center">{tool.label}</span>{r !== null && <div className="text-[14px] font-black text-gray-700 mt-1 bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-100 ring-2 ring-indigo-50 leading-none text-center">{r}</div>}</button>);
                  })}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-[2.5rem] border border-orange-100 shadow-sm text-center text-center"><div className="text-[10px] font-bold text-orange-600 mb-2 uppercase tracking-widest text-center text-center">🔐 設定密碼</div><input type="text" placeholder="四位數" className="w-full text-center py-2 rounded-xl border-2 border-orange-200 uppercase font-black focus:border-orange-400 outline-none text-base text-center" value={l4Password} onChange={(e) => setL4Password(e.target.value.toUpperCase())} /></div>
              <button onClick={() => setL4Elements([])} className="w-full py-2.5 bg-red-50 text-red-500 rounded-2xl font-bold text-[10px] hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 text-center text-center"><Trash2 size={12}/> 全部清除</button>
            </div>
          )}
          <div className={`lg:col-span-3 h-[480px] bg-white rounded-[2.5rem] border-4 border-dashed border-gray-100 relative shadow-inner overflow-hidden text-center ${l4Mode==='edit' ? 'cursor-crosshair bg-gray-50/20' : 'cursor-default'}`} onClick={(e) => { 
              if (l4Mode === 'challenge') return; const r = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX-r.left)/r.width)*100, y = ((e.clientY-r.top)/r.height)*100; const gx = Math.floor(x/CELL_W), gy = Math.floor(y/CELL_H);
              if (gx===0 && gy===0) { showFeedback("起點位置不可擺放物件！"); return; }
              const exIdx = l4Elements.findIndex(el => el.gx === gx && el.gy === gy);
              if (l4ToolType === 'eraser') { if (exIdx !== -1) setL4Elements(p => p.filter((_, idx) => idx !== exIdx)); return; }
              if (exIdx !== -1) { showFeedback("此位置已有物件！"); return; }
              if (counts[l4ToolType] >= L4_LIMITS[l4ToolType]) { showFeedback("數量上限已達！"); return; }
              setL4Elements([...l4Elements, { gx, gy, type: l4ToolType }]); 
            }}>
            <div className="absolute top-0 left-0 flex flex-col items-center justify-center pointer-events-none text-center" style={{ width: `${CELL_W}%`, height: `${CELL_H}%` }}><div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping text-center" /><div className="w-4/5 h-4/5 border-4 border-blue-500 rounded-full flex items-center justify-center bg-white shadow-lg ring-4 ring-blue-100 text-center text-center text-center"><MapPin className="text-blue-600 text-center text-center" size={24} /></div><div className="absolute -bottom-6 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md animate-bounce text-center text-center text-center">START</div></div>
            {l4Elements.map((el, i) => (
              <div key={i} className={`absolute transition-all ${l4Mode === 'challenge' && el.type === 'mine' && !l4RadarActive ? 'opacity-0 scale-0' : 'opacity-100'}`} style={{ left: `${el.gx * CELL_W + CELL_W/2}%`, top: `${el.gy * CELL_H + CELL_H/2}%`, transform: 'translate(-50%, -50%)', width: `${CELL_W}%`, height: `${CELL_H}%` }}>
                <div className="w-full h-full flex items-center justify-center text-center text-center">
                  {el.type === 'maze' && <div className="w-[98%] h-[98%] bg-indigo-600 rounded-sm border-2 border-indigo-400 opacity-20 text-center text-center text-center" />}
                  {el.type === 'crate' && <div className="w-[85%] h-[85%] bg-amber-800 rounded flex items-center justify-center border-2 border-amber-900 shadow-md text-center text-center" />}
                  {el.type === 'bush' && <Leaf size={18} className="text-green-500 text-center text-center" fill="currentColor" />}
                  {el.type === 'star' && <Star size={14} className="text-yellow-300 fill-yellow-300 animate-pulse text-center" />}
                  {el.type === 'mine' && <ShieldAlert size={18} className={`text-red-900 ${l4RadarActive ? 'animate-ping' : ''} text-center`} />}
                  {(el.type === 'real_chest' || el.type === 'trap_chest') && (<Trophy size={26} className={`drop-shadow-xl ${l4Mode === 'challenge' ? 'animate-bounce' : ''} ${l4RadarActive && el.type === 'real_chest' ? 'text-yellow-400 scale-125 ring-4 ring-yellow-200 rounded-full bg-white p-1' : 'text-orange-400'} text-center`} />)}
                </div>
              </div>
            ))}
            {l4Mode === 'challenge' && <div className="absolute transition-all duration-150 z-20 text-center" style={{ left: `${l4PlayerPos.x}%`, top: `${l4PlayerPos.y}%`, transform: 'translate(-50%, -50%)' }}><CharacterIcon type="member" size="w-10 h-10 text-center" /></div>}
          </div>
          <div className="lg:col-span-4 flex justify-center mt-6 text-center text-center">
            {l4Mode === 'edit' ? (<button onClick={() => startGame(4)} className="px-12 py-5 bg-indigo-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 text-center text-center text-center"><Flag size={24} /> 發布團隊謎題</button>) : (
              <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-100/50 p-6 rounded-[3rem] border border-gray-200 shadow-sm text-center text-center text-center">
                {role === 'member' && (<div className="grid grid-cols-3 gap-2 text-center text-center text-center text-center"><div/><button onClick={() => moveL4Player(0, -CELL_H)} className="w-12 h-12 bg-white rounded-xl shadow active:bg-indigo-50 flex items-center justify-center text-indigo-500 transition-all text-center"><ChevronUp size={24}/></button><div/><button onClick={() => moveL4Player(-CELL_W, 0)} className="w-12 h-12 bg-white rounded-xl shadow active:bg-indigo-50 flex items-center justify-center text-indigo-500 transition-all text-center text-center"><ChevronLeft size={24}/></button><button onClick={() => moveL4Player(0, CELL_H)} className="w-12 h-12 bg-white rounded-xl shadow active:bg-indigo-50 flex items-center justify-center text-indigo-500 transition-all text-center text-center"><ChevronDown size={24}/></button><button onClick={() => moveL4Player(CELL_W, 0)} className="w-12 h-12 bg-white rounded-xl shadow active:bg-indigo-50 flex items-center justify-center text-indigo-500 transition-all text-center text-center text-center"><ChevronRightIcon size={24}/></button></div>)}
                <div className="flex flex-col gap-3 text-center text-center">
                  {role === 'leader' && <button disabled={l4RadarActive} onClick={() => { setL4RadarActive(true); setTimeout(() => setL4RadarActive(false), 2500); }} className="px-10 py-4 bg-purple-600 text-white rounded-3xl font-black shadow-lg flex items-center gap-2 transition-all text-center text-center"><Radar size={22} /> 雷達真偽掃描</button>}
                  <button onClick={() => setL4Mode('edit')} className="px-8 py-3 bg-white text-gray-400 border-2 border-gray-200 rounded-3xl font-bold text-sm hover:bg-gray-50 text-center"><Settings size={16} className="inline mr-1 text-center" /> 返回重新拼裝</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (level) {
      case 1: return renderLevel1();
      case 2: return renderLevel2();
      case 3: return renderLevel3();
      case 4: return renderLevel4();
      default: return renderLevel1();
    }
  };

  // --- 6. 主渲染邏輯 ---

  useEffect(() => {
    let intv; if (gameState === 'playing') intv = setInterval(() => {
        if (level === 2) setL2TimeLeft(t => t > 0 ? t - 1 : 0);
        if (level === 3) setL3TimeLeft(t => t > 0 ? t - 1 : 0);
    }, 1000);
    return () => clearInterval(intv);
  }, [gameState, level]);

  if (gameState === 'lobby') return renderLobby();
  if (gameState === 'setup') return renderSetup();
  
  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-4 font-sans text-center text-center text-center text-center">
        <div className="bg-white rounded-[3.5rem] p-12 max-w-lg w-full shadow-2xl border-b-[12px] border-yellow-100 animate-in zoom-in text-center text-center text-center text-center text-center">
          <CharacterIcon type="alien" color="#FFD700" size="w-32 h-32 mx-auto mb-8 text-center" />
          <h1 className="text-4xl font-black text-orange-600 mb-2 leading-none text-center">任務完美達成!</h1>
          <p className="text-gray-600 mb-8 font-medium text-center">團隊配合無間，成功找回友誼色彩！</p>
          <button onClick={() => setGameState('lobby')} className="w-full py-5 bg-orange-500 text-white rounded-3xl font-black text-xl hover:bg-orange-600 transition-all text-center">返回母艦</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden text-center text-center">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm text-center">
        <div className="flex items-center gap-3 text-center text-center text-center text-center">
          <CharacterIcon type="alien" color={alienColor} size="w-12 h-12 text-center" />
          <div className="hidden sm:block text-left text-center">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">團隊友情進度</div>
            <div className="w-28 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden shadow-inner text-center"><div className="h-full bg-yellow-400 transition-all duration-1000 shadow-[0_0_10px_rgba(255,215,0,0.5)] text-center" style={{ width: `${alienAura}%` }}></div></div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center text-center text-center">
          <div className="flex items-center gap-2 text-center text-center">
            <div className={`px-4 py-2 rounded-2xl text-xs font-black border transition-all flex items-center gap-2 shadow-sm ${role === 'leader' ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' : 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'} text-center`}>{role === 'leader' ? <UserCheck size={16}/> : <Users size={16}/>}{role === 'leader' ? '領導者' : `隊員 ${String.fromCharCode(memberSlot + 65)}`}</div>
            <button onClick={() => { setRole(prev => prev === 'leader' ? 'member' : 'leader'); showFeedback(`切換模式成功`); }} className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm active:rotate-180 border border-gray-100 text-center" title="切換身分"><RefreshCcw size={20} className="text-center" /></button>
          </div>
          {role === 'member' && numPlayers > 2 && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-center">
               {[...Array(numPlayers - 1)].map((_, i) => (<button key={i} onClick={() => { setMemberSlot(i); showFeedback(`切換至隊員 ${String.fromCharCode(65 + i)}`); }} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-all ${memberSlot === i ? 'bg-white text-blue-600 shadow-md scale-110 z-10' : 'text-gray-400 hover:bg-gray-50'} text-center`}>{String.fromCharCode(65 + i)}</button>))}
            </div>
          )}
          <button onClick={() => setGameState('setup')} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-2xl border border-gray-100 shadow-sm text-center"><Settings size={20} className="text-center" /></button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center text-center text-center">
        {gameState === 'failed' && (<div className="absolute inset-0 z-[60] bg-red-600/95 flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in zoom-in text-center text-center text-center"><ShieldAlert size={100} className="mb-6 animate-bounce text-center text-center text-center" /><h2 className="text-5xl font-black mb-4 tracking-tighter uppercase text-center leading-none text-center">全隊遣返重啟！</h2><p className="text-xl opacity-90 max-w-sm font-medium text-center mt-4 text-center">失敗是邁向默契的必經之路。準備重新傳送！</p><div className="mt-10 flex items-center gap-3 font-mono bg-black/30 px-6 py-3 rounded-full animate-pulse border border-white/20 text-center text-center"><RefreshCcw size={20} className="animate-spin text-center" /> 重啟傳送中...</div></div>)}
        <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl p-6 md:p-8 border-b-[12px] border-indigo-100 relative transition-all overflow-hidden text-center text-center text-center">{renderContent()}</div>
        {feedback && <div className="mt-8 px-8 py-3 bg-indigo-600 text-white text-sm font-black rounded-full shadow-2xl animate-bounce border-4 border-white ring-4 ring-indigo-200 text-center text-center">{feedback}</div>}
      </main>
      <aside className="p-3 bg-white border-t flex gap-2 overflow-x-auto no-scrollbar scroll-smooth text-center"><div className="flex-shrink-0 bg-indigo-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 flex items-center gap-1 shadow-sm uppercase tracking-widest text-center text-center text-center">MISSION LOG:</div>{gameLog.map((log, i) => (<div key={i} className="flex-shrink-0 bg-gray-50 px-4 py-1.5 rounded-2xl text-[10px] shadow-sm text-gray-600 border border-gray-100 flex items-center gap-1.5 animate-in slide-in-from-left text-center text-center"><ArrowRight size={12} className="text-indigo-400 text-center text-center" /> {log}</div>))}</aside>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default App;