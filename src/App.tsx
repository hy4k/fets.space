import { useState, useEffect } from 'react';
import { 
  Monitor, 
  Cpu, 
  Settings, 
  QrCode, 
  Database, 
  Plus, 
  Search, 
  LogOut, 
  LogIn,
  Layout,
  Camera,
  HardDrive,
  Cpu as Processor,
  MemoryStick,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Printer,
  Shield,
  Zap,
  Activity,
  Pencil,
  Download,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, login, logout } from './lib/firebase';
import { Workstation, OperationType } from './types';
import { handleFirestoreError, cn } from './lib/utils';

// --- Components ---

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-[#E4E3E0] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
      <p className="font-mono text-xs tracking-widest uppercase opacity-50">Initializing Core...</p>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'detail'>('home');
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [selectedStation, setSelectedStation] = useState<Workstation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Workstation | null>(null);

  useEffect(() => {
    // Basic routing via URL params
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const viewParam = params.get('view');
    
    if (id) {
      setCurrentId(id);
      setView('detail');
    } else if (viewParam === 'print') {
      setIsPrinting(true);
      setView('home');
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view === 'home') {
      const q = query(collection(db, 'workstations'), orderBy('id', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as Workstation);
        setWorkstations(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'workstations');
      });
      return () => unsubscribe();
    }
  }, [view]);

  useEffect(() => {
    if (view === 'detail' && currentId) {
      const fetchStation = async () => {
        setIsFetchingDetail(true);
        try {
          const docRef = doc(db, 'workstations', currentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Workstation;
            setSelectedStation(data);
            setEditForm(data);
          } else {
            setSelectedStation(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `workstations/${currentId}`);
        } finally {
          setIsFetchingDetail(false);
        }
      };
      fetchStation();
    }
  }, [view, currentId]);

  const handleUpdate = async (newData: Workstation) => {
    try {
      const updatedData = {
        ...newData,
        lastAuditAt: new Date().toISOString()
      };
      
      if (newData.id !== selectedStation?.id) {
        if (workstations.find(ws => ws.id === newData.id)) {
          alert('Node ID already exists!');
          return;
        }
        await setDoc(doc(db, 'workstations', newData.id), updatedData);
        await deleteDoc(doc(db, 'workstations', selectedStation!.id));
        setCurrentId(newData.id);
      } else {
        await updateDoc(doc(db, 'workstations', newData.id), updatedData);
      }
      setSelectedStation(updatedData);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workstations/${newData.id}`);
    }
  };

  const handleCreateStations = async () => {
    // Check if we are resetting
    if (workstations.length > 0) {
      if (!window.confirm('Are you sure you want to COMPLETELY WIPE the database and reset to the default AW01-AW35 nodes?')) return;
      try {
        for (const ws of workstations) {
          await deleteDoc(doc(db, 'workstations', ws.id));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'workstations');
        return;
      }
    }

    // Helper to generate 35 workstations + 1 admin + 1 server
    const batch: Workstation[] = [];
    
    // Workstations AW01 - AW35
    for (let i = 1; i <= 35; i++) {
      const id = `AW${i.toString().padStart(2, '0')}`;
      batch.push({
        id,
        name: `Workstation ${id}`,
        type: 'workstation',
        brandCpu: 'Dell Precision',
        brandMonitor: 'Dell UltraSharp',
        processor: 'Intel Core i7-12700',
        ram: '32GB DDR4',
        hdd: '1TB NVMe SSD',
        cameraAligned: 'CCTV Zone A-04',
        exams: ['PEARSON VIEW', 'PSI'],
        lastAuditAt: new Date().toISOString()
      });
    }

    // Admin
    batch.push({
      id: 'AADM',
      name: 'Central Admin System',
      type: 'admin',
      brandCpu: 'HP EliteDesk',
      brandMonitor: 'Dual HP 24"',
      processor: 'Intel Core i9-13900',
      ram: '64GB DDR5',
      hdd: '2TB NVMe SSD',
      cameraAligned: 'Security Hub 01',
      exams: ['CMA US'],
      lastAuditAt: new Date().toISOString()
    });

    // Server
    batch.push({
      id: 'ASRV',
      name: 'Main Exam Server',
      type: 'server',
      brandCpu: 'Dell PowerEdge R750',
      brandMonitor: 'Rack Console',
      processor: '2x Intel Xeon Platinum',
      ram: '256GB ECC',
      hdd: '10TB RAID 10',
      cameraAligned: 'Server Room North',
      exams: ['ITTS'],
      lastAuditAt: new Date().toISOString()
    });

    try {
      for (const item of batch) {
        await setDoc(doc(db, 'workstations', item.id), item);
      }
      alert('Database initialized with 37 systems.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workstations');
    }
  };

  const handleCreateNew = async () => {
    const id = window.prompt('Enter Unique Node ID (e.g., AW36, AADM02):');
    if (!id || id.trim() === '') return;
    
    // Check if exists
    if (workstations.find(ws => ws.id === id)) {
      alert('ID already exists!');
      return;
    }

    const newNode: Workstation = {
      id: id.trim(),
      name: `New Resource ${id}`,
      type: 'workstation',
      brandCpu: 'Generic',
      brandMonitor: 'Generic',
      processor: 'Unknown',
      ram: 'Unknown',
      hdd: 'Unknown',
      cameraAligned: 'Not Specified',
      exams: [],
      lastAuditAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'workstations', newNode.id), newNode);
      setCurrentId(newNode.id);
      setView('detail');
      setIsEditing(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workstations/${newNode.id}`);
    }
  };

  const [isPrinting, setIsPrinting] = useState(false);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const downloadQR = (stationId: string, label: string) => {
    const svg = document.getElementById(`qr-${stationId}-${label}`) as unknown as SVGSVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Use 4x scaling for high print quality
      const scale = 4;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx?.scale(scale, scale);
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${stationId}-${label}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadAllQRs = async () => {
    setIsDownloadingAll(true);
    const zip = new JSZip();
    
    for (const ws of workstations) {
      const items = [
        { label: 'CPU', id: `qr-${ws.id}-CPU` },
        { label: 'DSK', id: `qr-${ws.id}-DSK` },
        { label: 'MON', id: `qr-${ws.id}-MON` }
      ];

      for (const item of items) {
        const svg = document.getElementById(item.id) as unknown as SVGSVGElement;
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const scale = 5; // higher resolution output
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              ctx?.scale(scale, scale);
              ctx?.drawImage(img, 0, 0);
              const pngData = canvas.toDataURL("image/png").split(',')[1];
              zip.file(`${ws.id}-${item.label}.png`, pngData, { base64: true });
              resolve();
            };
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
          });
        }
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "fets-qrs.zip");
    setIsDownloadingAll(false);
  };

  const chunkArrays = <T,>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  const PrintView = () => {
    // 5 systems per page = 15 stickers per page (Grid of 3 columns x 5 rows)
    const pages = chunkArrays(workstations, 5);
    
    const qrTypes = [
      { location: 'CPU UNIT', color: '#EF4444', label: 'CPU' },
      { location: 'DESK SURFACE', color: '#10B981', label: 'DSK' },
      { location: 'MONITOR REAR', color: '#3B82F6', label: 'MON' }
    ];

    return (
      <div className="fixed inset-0 bg-[#E4E3E0] z-[100] overflow-y-auto p-4 sm:p-8 print:static print:h-auto print:overflow-visible print:bg-white print:p-0 font-sans">
        <div className="max-w-[210mm] mx-auto print:max-w-none">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-black/10 print:hidden">
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">A4 Sticker Export</h2>
              <p className="text-xs font-mono opacity-50">5 Systems per page (3 colored stickers each)</p>
            </div>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <button 
                onClick={() => setIsPrinting(false)}
                className="px-6 py-2 border-2 border-black font-bold uppercase tracking-widest rounded hover:bg-black hover:text-white transition-all"
              >
                Exit
              </button>
              <button 
                onClick={downloadAllQRs}
                disabled={isDownloadingAll}
                className="px-6 py-2 bg-black text-white font-bold uppercase tracking-widest rounded flex items-center gap-2 hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
              >
                {isDownloadingAll ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download size={18} />}
                {isDownloadingAll ? 'Zipping...' : 'ZIP All PNGs'}
              </button>
              <button 
                onClick={() => window.print()}
                className="px-8 py-2 bg-emerald-500 text-white font-black uppercase tracking-widest rounded flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <Printer size={18} />
                Print A4
              </button>
            </div>
          </div>

          <div className="space-y-4 print:space-y-0">
            {pages.map((page, pageIndex) => (
              <div 
                key={pageIndex} 
                className="bg-white mx-auto print:mx-0 print:border-none shadow-lg print:shadow-none w-[210mm] h-[297mm] break-after-page box-border p-[10mm] flex flex-col justify-start gap-[5mm]"
              >
                {page.map(ws => (
                  <div key={ws.id} className="grid grid-cols-3 gap-[8mm] pb-[5mm] border-b-2 border-dashed border-black/10 last:border-0">
                    {qrTypes.map(item => (
                      <div key={item.label} className="flex flex-col items-center justify-center p-3 border-2 border-black/10 rounded-2xl relative group bg-white">
                        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-xl" style={{ backgroundColor: item.color }} />
                        <QRCodeSVG 
                          id={`qr-${ws.id}-${item.label}`}
                          value={`https://fets.space/?id=${ws.id}`} 
                          size={160}
                          level="H"
                          fgColor={item.color}
                          includeMargin={false}
                          className="w-full h-auto mb-3 mt-2"
                        />
                        <div className="text-center w-full mt-auto">
                           <div className="flex justify-between items-center w-full border-t border-black/10 pt-2 mb-1">
                             <span className="font-mono font-black text-xl tracking-tighter" style={{ color: item.color }}>{ws.id}</span>
                             <span className="font-mono text-[10px] font-black uppercase py-1 px-2 rounded-md text-white" style={{ backgroundColor: item.color }}>{item.label}</span>
                           </div>
                           <p className="font-mono text-[8px] uppercase font-bold opacity-40">{item.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingScreen />;
  if (isPrinting) return <PrintView />;

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-black p-4 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => (window.location.search = '', setView('home'))}>
          <div className="bg-black text-white p-1 rounded">
            <Database size={18} />
          </div>
          <span className="font-mono font-bold tracking-tighter text-lg">fets.space</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('home')}
            className={cn(
              "font-mono text-xs uppercase tracking-widest px-3 py-1 rounded transition-colors",
              view === 'home' ? "bg-black text-white" : "hover:bg-black/5"
            )}
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 mb-24">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 sm:space-y-12"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                  <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter uppercase mb-2">Stations</h1>
                  <p className="font-mono text-xs opacity-50 uppercase tracking-widest">{workstations.length} Active Node Map</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {true && (
                    <button 
                      onClick={handleCreateNew}
                      className="flex-1 sm:flex-none p-4 bg-emerald-500 text-white flex items-center justify-center rounded-2xl hover:bg-emerald-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                      title="Add Node"
                    >
                      <Plus size={24} />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsPrinting(true)}
                    className="flex-1 sm:flex-none p-4 bg-white border-2 border-black flex items-center justify-center rounded-2xl hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    <Printer size={24} />
                  </button>
                </div>
              </div>

              {/* Simple Station Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 px-1">
                {workstations.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setCurrentId(ws.id);
                      setView('detail');
                    }}
                    className={cn(
                      "group flex flex-col items-center justify-center aspect-square border-2 border-black rounded-[1.5rem] hover:bg-black hover:text-white transition-all shadow-[sidebar_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none",
                      ws.type === 'admin' ? "bg-amber-300" : ws.type === 'server' ? "bg-blue-300" : "bg-white",
                      "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    )}
                  >
                    <span className={cn("font-mono text-[9px] sm:text-[10px] opacity-40 group-hover:opacity-50 uppercase mb-1", ws.type !== 'workstation' && "font-black opacity-60")}>
                      {ws.type === 'admin' ? 'ADMIN' : ws.type === 'server' ? 'SERVER' : 'NODE'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase">{ws.id}</span>
                  </button>
                ))}
                
                {workstations.length === 0 && (
                   <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-black/10 rounded-[3rem]">
                      <p className="font-mono text-xs opacity-40 uppercase tracking-widest">Database Empty</p>
                      <button onClick={handleCreateStations} className="mt-4 px-8 py-3 bg-black text-white font-black uppercase tracking-widest rounded-xl">Initialize</button>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'detail' && (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-md mx-auto pb-12"
            >
              {isFetchingDetail ? (
                <div className="text-center p-12 bg-white border-4 border-black rounded-[40px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                   <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                   <h2 className="text-xl font-black uppercase mb-4 tracking-widest text-neutral-400">Locating Asset...</h2>
                </div>
              ) : selectedStation ? (
                <div className="space-y-6">
                  {isEditing ? (
                    <div className="bg-white border-2 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active Edit Mode</div>
                        <button onClick={() => setIsEditing(false)} className="text-xs font-mono uppercase opacity-50 underline decoration-2">Cancel</button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">Node ID (Displayed on Dashboard)</label>
                          <input 
                            value={editForm?.id || ''} 
                            onChange={e => setEditForm(prev => prev ? {...prev, id: e.target.value.toUpperCase()} : null)}
                            className="w-full text-2xl font-black italic uppercase p-5 bg-neutral-50 border-2 border-black/5 rounded-3xl focus:border-black outline-none transition-all"
                            placeholder="e.g. AW01"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">Node Alias</label>
                          <input 
                            value={editForm?.name || ''} 
                            onChange={e => setEditForm(prev => prev ? {...prev, name: e.target.value} : null)}
                            className="w-full text-lg font-bold uppercase p-4 bg-neutral-50 border-2 border-black/5 rounded-2xl focus:border-black outline-none transition-all"
                            placeholder="e.g. Master Terminal"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">Type</label>
                            <select 
                              value={editForm?.type}
                              onChange={e => setEditForm(prev => prev ? {...prev, type: e.target.value as any} : null)}
                              className="w-full p-4 bg-neutral-50 border-2 border-black/5 rounded-2xl font-bold appearance-none bg-no-repeat bg-[right_1rem_center]"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundSize: '1rem' }}
                            >
                              <option value="workstation">Workstation</option>
                              <option value="admin">Admin</option>
                              <option value="server">Server</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">Camera</label>
                            <input 
                              value={editForm?.cameraAligned || ''} 
                              onChange={e => setEditForm(prev => prev ? {...prev, cameraAligned: e.target.value} : null)}
                              className="w-full p-4 bg-neutral-50 border-2 border-black/5 rounded-2xl font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">RAM</label>
                            <input 
                              value={editForm?.ram || ''} 
                              onChange={e => setEditForm(prev => prev ? {...prev, ram: e.target.value} : null)}
                              className="w-full p-4 bg-neutral-50 border-2 border-black/5 rounded-2xl font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">Storage</label>
                            <input 
                              value={editForm?.hdd || ''} 
                              onChange={e => setEditForm(prev => prev ? {...prev, hdd: e.target.value} : null)}
                              className="w-full p-4 bg-neutral-50 border-2 border-black/5 rounded-2xl font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">Processor</label>
                          <input 
                            value={editForm?.processor || ''} 
                            onChange={e => setEditForm(prev => prev ? {...prev, processor: e.target.value} : null)}
                            className="w-full p-4 bg-neutral-50 border-2 border-black/5 rounded-2xl font-bold"
                            placeholder="e.g. Intel Core i7"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">Brand CPU</label>
                            <input 
                              value={editForm?.brandCpu || ''} 
                              onChange={e => setEditForm(prev => prev ? {...prev, brandCpu: e.target.value} : null)}
                              className="w-full p-4 bg-neutral-50 border-2 border-black/5 rounded-2xl font-bold"
                              placeholder="e.g. Dell Precision"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase font-black opacity-30 ml-2">Brand Monitor</label>
                            <input 
                              value={editForm?.brandMonitor || ''} 
                              onChange={e => setEditForm(prev => prev ? {...prev, brandMonitor: e.target.value} : null)}
                              className="w-full p-4 bg-neutral-50 border-2 border-black/5 rounded-2xl font-bold"
                              placeholder="e.g. Dell UltraSharp"
                            />
                          </div>
                        </div>

                        <div className="pt-8 border-t border-black/10 flex flex-col gap-3">
                          <button 
                            onClick={() => editForm && handleUpdate(editForm)}
                            className="w-full py-6 bg-black text-white font-black uppercase tracking-widest rounded-[2rem] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                            <CheckCircle2 size={24} className="text-emerald-400" />
                            Push Node Update
                          </button>
                          
                          <button 
                            onClick={async () => {
                              if (!selectedStation || !window.confirm(`Permanently delete ${selectedStation.id}?`)) return;
                              try {
                                await deleteDoc(doc(db, 'workstations', selectedStation.id));
                                setView('home');
                              } catch (e) {
                                handleFirestoreError(e, OperationType.DELETE, `workstations/${selectedStation.id}`);
                              }
                            }}
                            className="w-full py-4 text-red-500 font-mono text-[10px] uppercase font-bold hover:bg-red-50 rounded-2xl transition-colors"
                          >
                            Delete Node from Cloud
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Modern Header Card */}
                      <div className="bg-black text-white p-8 sm:p-12 rounded-[3rem] sm:rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl opacity-50" />
                        <div className="relative z-10">
                          <div className="flex justify-between items-center mb-8 sm:mb-10">
                            <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[9px] sm:text-[10px] uppercase font-black tracking-widest border border-emerald-500/20">
                               System Active
                            </div>
                            {true && (
                              <button 
                                onClick={() => {
                                  setEditForm(selectedStation);
                                  setIsEditing(true);
                                }}
                                className="bg-white text-black p-3 sm:p-4 rounded-[18px] sm:rounded-3xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                              >
                                <Pencil size={20} className="sm:hidden" />
                                <Pencil size={24} className="hidden sm:block" />
                              </button>
                            )}
                          </div>
                          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] opacity-40 mb-2 block">Reference ID</span>
                          <h2 className="text-7xl sm:text-9xl font-black italic tracking-tighter uppercase -ml-1 sm:-ml-2 leading-none">{selectedStation.id}</h2>
                          <div className="mt-8 sm:mt-12 flex items-center gap-4 sm:gap-6">
                            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                              {selectedStation.type === 'server' ? <Database size={24} className="sm:hidden" /> : <Cpu size={24} className="sm:hidden" />}
                              {selectedStation.type === 'server' ? <Database size={28} className="hidden sm:block" /> : <Cpu size={28} className="hidden sm:block" />}
                            </div>
                            <div>
                               <p className="text-[9px] sm:text-[10px] font-mono uppercase opacity-40 mb-1">Assigned Name</p>
                               <h4 className="text-lg sm:text-xl font-black uppercase text-emerald-400 leading-tight">{selectedStation.name}</h4>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info Panel */}
                      <div className="bg-white border-4 border-black rounded-[3.5rem] p-6 sm:p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-6 sm:space-y-10">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 sm:p-6 bg-neutral-50 rounded-3xl border-2 border-black/5">
                               <p className="text-[9px] sm:text-[10px] font-mono uppercase opacity-30 mb-2 font-black leading-tight">CPU</p>
                               <p className="font-black text-xs sm:text-sm">{selectedStation.processor || 'Unknown'}</p>
                               <p className="text-[9px] font-mono opacity-50 mt-1 uppercase leading-none">{selectedStation.brandCpu || 'No Brand'}</p>
                            </div>
                            <div className="p-4 sm:p-6 bg-neutral-50 rounded-3xl border-2 border-black/5">
                               <p className="text-[9px] sm:text-[10px] font-mono uppercase opacity-30 mb-2 font-black leading-tight">Memory/Storage</p>
                               <p className="font-black text-xs sm:text-sm">{selectedStation.ram || 'Unknown'}</p>
                               <p className="text-[9px] font-mono opacity-50 mt-1 uppercase leading-none">{selectedStation.hdd}</p>
                            </div>
                            <div className="p-4 sm:p-6 bg-neutral-50 rounded-3xl border-2 border-black/5">
                               <p className="text-[9px] sm:text-[10px] font-mono uppercase opacity-30 mb-2 font-black leading-tight">Monitor</p>
                               <p className="font-black text-xs sm:text-sm">{selectedStation.brandMonitor || 'Unknown'}</p>
                            </div>
                            <div className="p-4 sm:p-6 bg-neutral-50 rounded-3xl border-2 border-black/5">
                               <p className="text-[9px] sm:text-[10px] font-mono uppercase opacity-30 mb-2 font-black leading-tight">Camera Coverage</p>
                               <p className="font-black text-xs sm:text-sm">{selectedStation.cameraAligned || 'Unknown'}</p>
                            </div>
                         </div>

                         <div>
                           <div className="flex justify-between items-center mb-6">
                             <h4 className="font-mono text-[10px] uppercase font-black tracking-[0.2em] opacity-30 flex items-center gap-2">
                               <Zap size={14} /> Softwares Installed
                             </h4>
                           </div>
                           <div className="grid grid-cols-1 gap-2">
                             {['CMA US', 'PEARSON VIEW', 'PSI', 'CELPIP', 'ITTS'].map((exam) => {
                               const isReady = selectedStation.exams.includes(exam as any);
                               return (
                                 <button 
                                   key={exam}
                                   onClick={() => {
                                     // always allow toggling exams now that auth is public
                                     const newExams = isReady 
                                       ? selectedStation.exams.filter(e => e !== exam)
                                       : [...selectedStation.exams, exam as any];
                                     handleUpdate({ ...selectedStation, exams: newExams });
                                   }}
                                   className={cn(
                                     "flex items-center justify-between p-5 rounded-2xl border-2 transition-all active:scale-[0.98]",
                                     isReady ? "bg-black border-black text-white" : "bg-neutral-50 border-neutral-100 opacity-50"
                                   )}
                                 >
                                   <span className="font-black uppercase tracking-tight text-sm">{exam}</span>
                                   <div className={cn(
                                     "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                                     isReady ? "bg-emerald-500 text-black" : "bg-neutral-200"
                                   )}>
                                     {isReady && <CheckCircle2 size={16} />}
                                   </div>
                                 </button>
                               );
                             })}
                           </div>
                         </div>

                         <button 
                           onClick={() => setView('home')}
                           className="w-full py-7 bg-white border-4 border-black rounded-[3rem] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                         >
                           <ArrowLeft size={24} /> Exit Audit
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-12 bg-white border-4 border-black rounded-[40px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                  <AlertCircle size={80} className="mx-auto mb-6 text-red-500" />
                  <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter italic">Invalid Scan</h2>
                  <p className="text-neutral-500 mb-12 text-lg">Asset <code className="bg-neutral-100 px-3 py-1 rounded text-black">{currentId}</code> unregistered.</p>
                  <button onClick={() => setView('home')} className="w-full py-4 bg-black text-white font-black uppercase tracking-widest rounded-2xl">
                    Back to Hub
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
