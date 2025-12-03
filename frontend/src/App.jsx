import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Server, Cpu, Zap, Shield, ShieldAlert, Terminal, 
  AlertTriangle, WifiOff, Settings, ZapOff, Database, 
  Clock, AlertOctagon, RefreshCw, Play, BrainCircuit, LayoutDashboard, 
  Globe, AlertCircle, CheckCircle
} from "lucide-react";

// --- STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap');

  :root {
    --bg-dark: #050b14;
    --bg-panel: #0d121f; 
    --bg-panel-trans: rgba(13, 18, 31, 0.85);
    --primary: #00f2ff;
    --secondary: #7000ff;
    --success: #00ff9d;
    --warning: #ffbf00;
    --danger: #ff0055;
    --text-main: #e0e6ed;
    --text-muted: #94a3b8;
    --grid-line: rgba(0, 242, 255, 0.05);
  }

  * { box-sizing: border-box; }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: var(--bg-dark); }
  ::-webkit-scrollbar-thumb { background: rgba(0, 242, 255, 0.3); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--primary); }

  body {
    margin: 0;
    background-color: var(--bg-dark);
    font-family: 'Inter', sans-serif;
    color: var(--text-main);
    overflow: hidden;
    background-image: 
      linear-gradient(var(--grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: 40px 40px;
    height: 100vh;
  }

  .app-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    height: 100vh;
    gap: 1rem;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 242, 255, 0.2);
    padding-bottom: 0.8rem;
    flex-shrink: 0;
  }

  .nav-tabs {
    display: flex;
    gap: 0.5rem;
    background: rgba(0,0,0,0.3);
    padding: 4px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .nav-item {
    padding: 0.4rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-muted);
    transition: all 0.2s;
  }

  .nav-item.active {
    background: rgba(0, 242, 255, 0.15);
    color: var(--primary);
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.1);
  }

  .title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.2rem;
    color: var(--primary);
    text-transform: uppercase;
    letter-spacing: 2px;
    display: flex; align-items: center; gap: 0.8rem;
  }

  .status-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
    border: 1px solid currentColor;
  }
  .status-badge.connected { color: var(--success); background: rgba(0, 255, 157, 0.1); border-color: var(--success); }
  .status-badge.disconnected { color: var(--danger); background: rgba(255, 0, 85, 0.1); border-color: var(--danger); }
  .status-badge.mock { color: var(--warning); background: rgba(255, 191, 0, 0.1); border-color: var(--warning); }

  /* --- LAYOUT SECTIONS --- */
  
  /* Dashboard Grid: 3 Columns (Servers | Vis | Logs) */
  .dashboard-grid {
    display: grid;
    grid-template-columns: 320px 1fr 320px;
    grid-template-rows: minmax(0, 1fr);
    gap: 1rem;
    flex-grow: 1;
    min-height: 0;
  }

  /* Brain View Grid */
  .brain-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    flex-grow: 1;
    min-height: 0;
  }

  /* Server Stack (Left Column) */
  .server-stack {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }
  
  .server-card-wrapper {
    flex: 1; 
    min-height: 0;
  }

  /* Common Panel */
  .glass-panel {
    background: var(--bg-panel-trans);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .glass-panel::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--primary), transparent); opacity: 0.5;
  }

  /* Server Card Styles */
  .server-card { padding: 1rem; justify-content: space-between; }
  .server-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .metric-row { display: flex; justify-content: space-between; margin-bottom: 0.3rem; font-family: 'JetBrains Mono'; font-size: 0.75rem; color: var(--text-muted); }
  .val-bold { font-weight: bold; color: var(--text-main); }
  .bar-bg { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-bottom: 0.6rem; }
  .bar-fill { height: 100%; background: var(--primary); transition: width 0.5s ease; }

  /* Visualizer */
  .vis-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, rgba(0,242,255,0.03) 0%, transparent 70%); }
  
  .ai-core { width: 100px; height: 100px; border-radius: 50%; background: radial-gradient(circle, #2a0a4d 0%, #000 100%); border: 2px solid var(--secondary); display: flex; align-items: center; justify-content: center; position: relative; z-index: 10; }
  .ai-core-inner { width: 60%; height: 60%; background: var(--secondary); border-radius: 50%; filter: blur(10px); opacity: 0.6; animation: pulse 2s infinite; }
  @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(0.95); opacity: 0.5; } }

  .decision-text { margin-top: 1.5rem; text-align: center; font-family: 'JetBrains Mono'; color: var(--success); height: 30px; font-size: 0.9rem; }

  /* Logs */
  .terminal-window { 
    flex-grow: 1; 
    overflow-y: auto; 
    font-family: 'JetBrains Mono'; 
    font-size: 0.75rem; 
    padding: 0; 
  }
  
  .terminal-header {
    display: flex; 
    align-items: center; 
    gap: 8px; 
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.1); 
    background: var(--bg-panel); 
    position: sticky; 
    top: 0; 
    z-index: 20;
    color: var(--success);
    font-weight: bold;
  }

  .log-entry { padding: 0.3rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 0.8rem; }
  .log-time { color: var(--text-muted); width: 70px; flex-shrink: 0; }
  .log-server { color: var(--primary); font-weight: bold; width: 60px; flex-shrink: 0; }
  .log-msg { color: var(--text-main); }

  /* Brain View Code Blocks */
  .code-block {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: var(--text-muted);
    background: rgba(0,0,0,0.3);
    padding: 1rem;
    border-radius: 8px;
    overflow: auto;
    flex-grow: 1;
    border: 1px solid rgba(255,255,255,0.05);
    white-space: pre-wrap;
  }
  .code-highlight { color: var(--secondary); font-weight: bold; }

  /* Control Center */
  .control-center { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; height: 160px; flex-shrink: 0; padding: 1rem; margin-top: auto; }
  .control-col { display: flex; flex-direction: column; gap: 0.5rem; height: 100%; justify-content: center; }
  .control-title { display: flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: bold; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid rgba(0,242,255,0.2); padding-bottom: 0.3rem; }
  .control-btn { background: rgba(0,0,0,0.3); border: 1px solid var(--text-muted); color: var(--text-muted); padding: 0.35rem 0.6rem; border-radius: 4px; cursor: pointer; font-family: 'JetBrains Mono'; font-size: 0.7rem; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; }
  .control-btn:hover { border-color: var(--text-main); color: var(--text-main); background: rgba(255,255,255,0.05); }
  .control-btn.active { border-color: var(--danger); background: rgba(255,0,85,0.1); color: var(--danger); box-shadow: 0 0 10px rgba(255,0,85,0.1); }
  input[type=range] { width: 100%; accent-color: var(--primary); height: 4px; }
  .traffic-btn { background: var(--primary); color: #000; font-weight: bold; border: none; padding: 0.6rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-family: 'JetBrains Mono'; font-size: 0.85rem; margin-top: 0.2rem; transition: transform 0.1s; width: 100%; }
  .traffic-btn:hover { box-shadow: 0 0 15px rgba(0, 242, 255, 0.4); }
  .traffic-btn:active { transform: scale(0.98); }
`;

// --- MOCK DATA ---
const generateMockData = () => {
  const time = new Date().toLocaleTimeString();
  return {
    serverA: { reachable: true, health: { metrics: { cpuLoadPercent: 45, memoryUsedPercent: 60, avgLatencyMs: 25, recentErrors: 0 } } },
    serverB: { reachable: true, health: { metrics: { cpuLoadPercent: 30, memoryUsedPercent: 40, avgLatencyMs: 22, recentErrors: 0 } } },
    lastDecision: { 
      chosenServer: "B", summary: "Latency optimization", severity: "info", timestamp: time,
      promptUsed: "Mock Prompt...", rawResponse: "{}"
    },
    history: []
  };
};

// --- COMPONENTS ---

function ServerCard({ name, data, isSelected }) {
  const isReachable = data?.reachable || false;
  const metrics = data?.health?.metrics || {};
  return (
    <div className="glass-panel server-card" style={{borderColor: isSelected ? 'var(--success)' : (isReachable ? 'rgba(255,255,255,0.1)' : 'var(--danger)')}}>
      <div className="server-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color={isReachable ? 'var(--success)' : 'var(--danger)'} />
          <span style={{fontWeight: 600}}>{name}</span>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: isReachable ? 'var(--success)' : 'var(--danger)' }}>{isReachable ? "ONLINE" : "OFFLINE"}</div>
      </div>
      {isReachable && (
        <>
          <div className="metric-row"><span>CPU</span><span className="val-bold">{metrics.cpuLoadPercent?.toFixed(1)}%</span></div>
          <div className="bar-bg"><div className="bar-fill" style={{ width: `${metrics.cpuLoadPercent}%`, background: metrics.cpuLoadPercent > 80 ? 'var(--danger)' : 'var(--primary)' }}></div></div>
          
          <div className="metric-row"><span>RAM</span><span className="val-bold">{metrics.memoryUsedPercent?.toFixed(1)}%</span></div>
          <div className="bar-bg"><div className="bar-fill" style={{ width: `${metrics.memoryUsedPercent}%`, background: 'var(--secondary)' }}></div></div>
          
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', marginTop:'auto'}}>
            <span style={{color:'var(--text-muted)'}}>Latency: <span style={{color:'var(--text-main)', fontFamily:'JetBrains Mono'}}>{metrics.avgLatencyMs}ms</span></span>
            <span style={{color:'var(--text-muted)'}}>Errors: <span style={{color: metrics.recentErrors > 0 ? 'var(--danger)' : 'var(--success)', fontFamily:'JetBrains Mono'}}>{metrics.recentErrors}</span></span>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="glass-panel info-card" style={{borderColor: color ? color : 'rgba(255,255,255,0.1)'}}>
       <Icon size={28} color={color || 'var(--primary)'} />
       <div className="info-val" style={{color: color || 'var(--text-main)'}}>{value}</div>
       <div className="info-label">{label}</div>
    </div>
  );
}

function Visualizer({ decision, isOffline }) {
  if (isOffline) {
    return (
      <div className="glass-panel vis-container" style={{ gap: '15px', flexDirection:'column' }}>
         <WifiOff size={48} color="var(--danger)" />
         <h3 style={{ color: 'var(--danger)', margin: 0 }}>SYSTEM OFFLINE</h3>
         <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Waiting for backend connection...</p>
      </div>
    );
  }

  // SVG coordinates
  const centerX = 200; const centerY = 150;
  const serverAY = 350; const serverBY = 350;
  const serverAX = 100; const serverBX = 300;
  const userY = 20;

  const targetX = decision?.chosenServer === "A" ? serverAX : serverBX;

  return (
    <div className="glass-panel vis-container">
      <div style={{ position: 'absolute', top: 12, left: 15, color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block'}}></span>
        LIVE TRAFFIC ROUTING
      </div>

      <svg width="100%" height="100%" viewBox="0 0 400 400" style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Connections */}
        <motion.path d={`M ${centerX} ${userY} L ${centerX} ${centerY - 60}`} stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
        <path d={`M ${centerX} ${centerY + 60} C ${centerX} 250 ${serverAX} 250 ${serverAX} ${serverAY - 40}`} stroke="rgba(0, 242, 255, 0.2)" strokeWidth="2" fill="none" />
        <path d={`M ${centerX} ${centerY + 60} C ${centerX} 250 ${serverBX} 250 ${serverBX} ${serverBY - 40}`} stroke="rgba(112, 0, 255, 0.2)" strokeWidth="2" fill="none" />

        {decision && (
          <motion.circle r="5" fill="#fff">
            <animateMotion dur="0.8s" repeatCount="indefinite" path={`M ${centerX} ${centerY + 60} C ${centerX} 250 ${targetX} 250 ${targetX} ${serverAY - 40}`} />
             <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" />
          </motion.circle>
        )}

        <circle cx={centerX} cy={userY} r="8" fill="var(--text-main)" />
      </svg>

      <motion.div className="ai-core" animate={{ boxShadow: decision?.chosenServer === 'A' ? '0 0 30px var(--primary)' : '0 0 30px var(--secondary)' }}>
        <div className="ai-core-inner"></div>
        <Shield size={32} color="white" style={{ position: 'relative', zIndex: 20 }} />
      </motion.div>

      <div className="decision-text">
        <AnimatePresence mode="wait">
          <motion.div key={decision?.timestamp} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
            {decision ? `ROUTING TO SERVER ${decision.chosenServer}` : "ANALYZING TRAFFIC..."}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function HistoryLog({ history }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

  return (
    <div className="glass-panel terminal-window">
       <div className="terminal-header">
          <Terminal size={14} color="var(--success)" />
          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>SYSTEM LOGS</span>
       </div>
      
      {history.length === 0 && <div style={{padding: '0.5rem', color: 'var(--text-muted)'}}>No logs available...</div>}

      {/* Render logs in natural order (newest at bottom), with slow motion animation */}
      {history.map((h, idx) => (
        <motion.div 
          key={idx} 
          className="log-entry" 
          initial={{ opacity: 0, x: -20, height: 0 }} 
          animate={{ opacity: 1, x: 0, height: 'auto' }} 
          transition={{ duration: 1.2, ease: "easeOut" }} // Slow motion effect
        >
          <span className="log-time">[{new Date(h.timestamp).toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second: '2-digit'})}]</span>
          <span className="log-server" style={{ color: h.chosenServer === 'A' ? 'var(--primary)' : 'var(--secondary)' }}>
            SERVER {h.chosenServer}
          </span>
          <span className="log-msg" style={{fontSize: '0.75rem'}}>{h.summary}</span>
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function BrainView({ decision }) {
  if (!decision) return <div className="glass-panel" style={{alignItems:'center', justifyContent:'center'}}>Waiting for AI Telemetry...</div>;

  return (
    <div className="brain-grid">
      {/* Input / Prompt */}
      <div className="glass-panel">
        <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 10, color: 'var(--primary)'}}>
          <Terminal size={18} />
          <span style={{fontWeight: 'bold'}}>INPUT: LLM PROMPT CONSTRUCTION</span>
        </div>
        <div className="code-block">
          {decision.promptUsed || "Checking backend for prompt exposure..."}
        </div>
      </div>

      {/* Output / Reasoning */}
      <div className="glass-panel">
        <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 10, color: 'var(--secondary)'}}>
          <BrainCircuit size={18} />
          <span style={{fontWeight: 'bold'}}>OUTPUT: MODEL REASONING</span>
        </div>
        <div className="code-block">
          {decision.rawResponse ? (
             <>
               <span style={{color: 'var(--text-muted)'}}>{`// Received from Mistral/Ollama`}</span>
               <br/>
               <span className="code-highlight">{decision.rawResponse}</span>
             </>
          ) : "Waiting for model response..."}
        </div>
      </div>
    </div>
  );
}

function ControlCenter({ targetServer, setTargetServer }) {
  const [latency, setLatency] = useState(0);
  const [errorRate, setErrorRate] = useState(0);
  const [failures, setFailures] = useState({ db: false, nullPtr: false, timeout: false });
  const [loading, setLoading] = useState(false);

  const baseUrl = targetServer === 'A' ? 'http://localhost:8080' : 'http://localhost:8081';

  const sendCommand = async (endpoint, params = {}) => {
    try {
      await axios.get(`${baseUrl}/control/${endpoint}`, { params });
    } catch (err) {
      console.error(`Cmd failed: ${endpoint}`, err);
    }
  };

  const handleToggle = (key, endpoint) => {
    const newVal = !failures[key];
    setFailures(prev => ({ ...prev, [key]: newVal }));
    sendCommand(endpoint, { enabled: newVal });
  };

  const handleTrafficSpike = async () => {
    setLoading(true);
    for(let i=0; i<50; i++) {
        axios.get(`${baseUrl}/api/resource`).catch(() => {});
        await new Promise(r => setTimeout(r, 50));
    }
    setTimeout(() => setLoading(false), 500);
  };

  const resetAll = () => {
    setLatency(0); setErrorRate(0);
    setFailures({ db: false, nullPtr: false, timeout: false });
    sendCommand('reset');
  };

  return (
    <div className="glass-panel control-center">
      <div className="control-col">
        <div className="control-title"><Settings size={14} /> TARGET SYSTEM</div>
        <div style={{display:'flex', gap:'8px', marginBottom: '5px'}}>
            <button className={`control-btn ${targetServer==='A' ? 'active' : ''}`} style={{flex:1, justifyContent:'center'}} onClick={() => setTargetServer('A')}>NODE A</button>
            <button className={`control-btn ${targetServer==='B' ? 'active' : ''}`} style={{flex:1, justifyContent:'center'}} onClick={() => setTargetServer('B')}>NODE B</button>
        </div>
        <button className="control-btn" onClick={resetAll} style={{marginTop: 'auto'}}>
            <RefreshCw size={12} /> RESET SYSTEM NORMAL
        </button>
      </div>

      <div className="control-col">
        <div className="control-title"><Clock size={14} /> DEGRADATION</div>
        <div className="slider-container">
            <div className="slider-label"><span>Latency</span> <span>{latency}ms</span></div>
            <input type="range" min="0" max="5000" step="100" value={latency} onChange={(e) => {
                setLatency(e.target.value);
                sendCommand('delay', { ms: e.target.value });
            }} />
        </div>
        <div className="slider-container">
            <div className="slider-label"><span>Error Rate</span> <span>{errorRate}%</span></div>
            <input type="range" min="0" max="100" step="5" value={errorRate} onChange={(e) => {
                setErrorRate(e.target.value);
                sendCommand('error-rate', { percent: e.target.value });
            }} />
        </div>
      </div>

      <div className="control-col">
        <div className="control-title"><AlertOctagon size={14} /> FAULTS</div>
        <button className={`control-btn ${failures.db ? 'active' : ''}`} onClick={() => handleToggle('db', 'db-failure')}>
            <Database size={12} /> DB FAILURE {failures.db ? '[ON]' : '[OFF]'}
        </button>
        <button className={`control-btn ${failures.nullPtr ? 'active' : ''}`} onClick={() => handleToggle('nullPtr', 'nullpointer')}>
            <ZapOff size={12} /> NULL PTR {failures.nullPtr ? '[ON]' : '[OFF]'}
        </button>
        <button className={`control-btn ${failures.timeout ? 'active' : ''}`} onClick={() => handleToggle('timeout', 'timeout')}>
            <Clock size={12} /> TIMEOUT {failures.timeout ? '[ON]' : '[OFF]'}
        </button>
      </div>

      <div className="control-col">
        <div className="control-title"><Activity size={14} /> STRESS TEST</div>
        <div style={{flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <button className="traffic-btn" onClick={handleTrafficSpike} disabled={loading}>
              {loading ? <RefreshCw className="spin" size={16}/> : <Play size={16} />}
              {loading ? 'SENDING...' : 'SEND 50 REQ'}
          </button>
          <div style={{fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem', lineHeight: '1.2'}}>
              Triggers high load logic
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---

function App() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [useMock, setUseMock] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [controlTarget, setControlTarget] = useState('A'); 

  useEffect(() => {
    const fetchData = async () => {
      if (useMock) {
        const newData = generateMockData();
        setData(newData);
        setHistory(prev => [...prev, newData.lastDecision].slice(-50));
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/metrics", { timeout: 2000 });
        setData(res.data);
        if (res.data.history) {
           setHistory(res.data.history);
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
        setData(null); 
      }
    };

    const interval = setInterval(fetchData, 2000);
    fetchData(); 

    return () => clearInterval(interval);
  }, [useMock]);

  // Derived Stats for Summary Cards
  const totalErrors = (data?.serverA?.health?.metrics?.recentErrors || 0) + (data?.serverB?.health?.metrics?.recentErrors || 0);
  const aiStatus = data?.lastDecision ? "ACTIVE" : "IDLE";

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        
        {/* Header */}
        <header className="header">
          <div className="title">
            <Activity size={20} />
            <span>AI LOAD BALANCER</span>
          </div>
          
          <div className="nav-tabs">
            <div className={`nav-item ${tab==='dashboard'?'active':''}`} onClick={()=>setTab('dashboard')}>
              <LayoutDashboard size={14} /> DASHBOARD
            </div>
            <div className={`nav-item ${tab==='brain'?'active':''}`} onClick={()=>setTab('brain')}>
              <BrainCircuit size={14} /> AI NEURAL VIEW
            </div>
          </div>

          <div style={{display:'flex', gap: '15px', alignItems: 'center'}}>
            <div className="mode-toggle" onClick={() => setUseMock(!useMock)}>
               {useMock ? "Disable Demo Mode" : "Enable Demo Mode"}
            </div>

            <div className={`status-badge ${useMock ? 'mock' : (data ? 'connected' : 'disconnected')}`}>
               STATUS: {useMock ? "DEMO MODE" : (data ? "ONLINE" : "DISCONNECTED")}
            </div>
          </div>
        </header>

        {tab === 'dashboard' ? (
          <div className="dashboard-grid">
            
            {/* Left: Server Stack */}
            <div className="server-stack">
              <div className="server-card-wrapper">
                  <ServerCard 
                  name="Primary Node (A)" 
                  data={data ? data.serverA : { reachable: false }} 
                  isSelected={data?.lastDecision?.chosenServer === "A"} 
                  />
              </div>
              <div className="server-card-wrapper">
                  <ServerCard 
                  name="Secondary Node (B)" 
                  data={data ? data.serverB : { reachable: false }} 
                  isSelected={data?.lastDecision?.chosenServer === "B"} 
                  />
              </div>
            </div>

            {/* Middle: Vis - Now centered */}
            <div className="glass-panel vis-container">
               <Visualizer decision={data?.lastDecision} isOffline={!data && !useMock} />
            </div>

            {/* Right: Logs */}
            <div className="logs-section" style={{height:'100%'}}>
               <HistoryLog history={history} />
            </div>

          </div>
        ) : (
          <BrainView decision={data?.lastDecision} />
        )}

        {/* Bottom: Control Center */}
        <ControlCenter targetServer={controlTarget} setTargetServer={setControlTarget} />

      </div>
    </>
  );
}

export default App;