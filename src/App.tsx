import { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Database,
  Plus,
  Search,
  Monitor,
  ArrowLeft,
  Printer,
  Pencil,
  Download,
  FileDown,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ScanLine,
  Shield,
  ClipboardCheck,
  StickyNote,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './lib/firebase';
import {
  Workstation,
  OperationType,
  CentreId,
  CENTRES,
  CentreInfo,
  EXAM_LIST,
  STATUS_META,
  SystemStatus,
  LogKind,
  LOG_KIND_META,
  SystemLog,
  centreOf,
  statusOf,
} from './types';
import { handleFirestoreError, cn } from './lib/utils';

// Sticker set: one QR for each physical placement on a system.
const STICKER_TYPES = [
  { key: 'MON', location: 'MONITOR', color: '#2E45C8' },
  { key: 'CPU', location: 'CPU UNIT', color: '#D43A2F' },
  { key: 'WST', location: 'WORKSTATION', color: '#0B7B5E' },
] as const;

const qrUrl = (id: string) => `https://fets.space/?id=${id}`;

function chunkArrays<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return 'unknown';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const svgToPng = (svg: SVGSVGElement, scale = 5): Promise<string> =>
  new Promise((resolve) => {
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx?.scale(scale, scale);
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  });

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-paper texture-paper flex items-center justify-center">
    <div className="flex flex-col items-center gap-5">
      <div className="w-11 h-11 border-[3px] border-ink border-t-transparent rounded-full animate-spin" />
      <p className="font-mono text-[11px] tracking-[0.35em] uppercase text-ink-soft">Loading registry</p>
    </div>
  </div>
);

const StatusDot = ({ status, size = 8 }: { status: SystemStatus; size?: number }) => (
  <span
    className={cn('inline-block rounded-full shrink-0', status === 'fault' && 'animate-pulse')}
    style={{ width: size, height: size, backgroundColor: STATUS_META[status].color }}
  />
);

const openIssueCount = (ws: Workstation) => (ws.logs ?? []).filter((l) => !l.resolved).length;

// Module-level so React doesn't remount them (and drop input focus) on every render.

const Field = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-mono uppercase font-semibold text-ink-soft tracking-wider ml-1">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3.5 bg-paper/60 border border-line rounded-xl font-medium text-sm focus:border-ink outline-none transition-colors"
    />
  </div>
);

const Sticker = ({
  ws,
  type,
  centreName,
  size = 160,
}: {
  ws: Workstation;
  type: (typeof STICKER_TYPES)[number];
  centreName: string;
  size?: number;
}) => (
  <div className="flex flex-col items-center justify-center p-3 border border-line rounded-2xl relative bg-white overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: type.color }} />
    <QRCodeSVG
      id={`qr-${ws.id}-${type.key}`}
      value={qrUrl(ws.id)}
      size={size}
      level="H"
      fgColor="#1A1712"
      includeMargin={false}
      className="w-full h-auto mb-3 mt-3"
    />
    <div className="text-center w-full mt-auto">
      <div className="flex justify-between items-center w-full border-t border-line pt-2 mb-1 gap-2">
        <span className="font-display text-xl" style={{ color: type.color }}>{ws.id}</span>
        <span
          className="font-mono text-[9px] font-bold uppercase py-1 px-2 rounded text-white tracking-wider"
          style={{ backgroundColor: type.color }}
        >
          {type.location}
        </span>
      </div>
      <p className="font-mono text-[8px] uppercase font-semibold text-ink-soft tracking-widest">
        {centreName} · fets.space
      </p>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'detail'>('home');
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [selectedStation, setSelectedStation] = useState<Workstation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Workstation | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCentreId, setActiveCentreId] = useState<CentreId>(() => {
    const saved = localStorage.getItem('fets-centre');
    return saved === 'cochin' ? 'cochin' : 'calicut';
  });

  const activeCentre = CENTRES.find((c) => c.id === activeCentreId)!;

  useEffect(() => {
    localStorage.setItem('fets-centre', activeCentreId);
  }, [activeCentreId]);

  useEffect(() => {
    // Basic routing via URL params — QR codes land on /?id=AW01
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setCurrentId(id);
      setView('detail');
    } else if (params.get('view') === 'print') {
      setIsPrinting(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'workstations'), orderBy('id', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setWorkstations(snapshot.docs.map((d) => d.data() as Workstation)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'workstations'),
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view === 'detail' && currentId) {
      const fetchStation = async () => {
        setIsFetchingDetail(true);
        try {
          const docSnap = await getDoc(doc(db, 'workstations', currentId));
          if (docSnap.exists()) {
            const data = docSnap.data() as Workstation;
            setSelectedStation(data);
            setEditForm(data);
            setActiveCentreId(centreOf(data));
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

  const centreStations = useMemo<Workstation[]>(
    () => workstations.filter((ws) => centreOf(ws) === activeCentreId),
    [workstations, activeCentreId],
  );

  const visibleStations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return centreStations;
    return centreStations.filter(
      (ws) => ws.id.toLowerCase().includes(term) || ws.name.toLowerCase().includes(term),
    );
  }, [centreStations, searchTerm]);

  const stats = useMemo(() => {
    const operational = centreStations.filter((ws) => statusOf(ws) === 'operational').length;
    return {
      total: centreStations.length,
      workstations: centreStations.filter((ws) => ws.type === 'workstation').length,
      operational,
      attention: centreStations.length - operational,
    };
  }, [centreStations]);

  const goHome = () => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
    setView('home');
    setIsEditing(false);
  };

  const openStation = (id: string) => {
    setCurrentId(id);
    setSelectedStation(null);
    setView('detail');
  };

  const handleUpdate = async (newData: Workstation) => {
    try {
      const updatedData = { ...newData, lastAuditAt: new Date().toISOString() };
      if (newData.id !== selectedStation?.id) {
        if (workstations.find((ws) => ws.id === newData.id)) {
          alert('System ID already exists!');
          return;
        }
        await setDoc(doc(db, 'workstations', newData.id), updatedData);
        await deleteDoc(doc(db, 'workstations', selectedStation!.id));
        setCurrentId(newData.id);
      } else {
        await updateDoc(doc(db, 'workstations', newData.id), updatedData as { [key: string]: any });
      }
      setSelectedStation(updatedData);
      setEditForm(updatedData);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workstations/${newData.id}`);
    }
  };

  const [isReporting, setIsReporting] = useState(false);
  const [reportKind, setReportKind] = useState<LogKind>('fault');
  const [reportText, setReportText] = useState('');

  const submitReport = async () => {
    if (!selectedStation) return;
    const meta = LOG_KIND_META[reportKind];
    const otherCentre = CENTRES.find((c) => c.id !== centreOf(selectedStation))!;
    const entry: SystemLog = {
      at: new Date().toISOString(),
      kind: reportKind,
      text: reportText.trim() || meta.label,
      // Transfers and notes are records, not open issues
      resolved: reportKind === 'transfer' || reportKind === 'note',
    };
    if (reportKind === 'transfer') {
      entry.text = `Moved to ${otherCentre.name}${reportText.trim() ? ' — ' + reportText.trim() : ''}`;
    }
    const updates: { [key: string]: any } = { logs: [...(selectedStation.logs ?? []), entry] };
    if (reportKind === 'transfer') updates.centre = otherCentre.id;
    else if (meta.autoStatus) updates.status = meta.autoStatus;

    try {
      await updateDoc(doc(db, 'workstations', selectedStation.id), updates);
      const updated = { ...selectedStation, ...updates } as Workstation;
      setSelectedStation(updated);
      setEditForm(updated);
      if (reportKind === 'transfer') setActiveCentreId(otherCentre.id);
      setIsReporting(false);
      setReportText('');
      setReportKind('fault');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workstations/${selectedStation.id}`);
    }
  };

  const resolveLog = async (index: number) => {
    if (!selectedStation) return;
    const logs = [...(selectedStation.logs ?? [])];
    logs[index] = { ...logs[index], resolved: true };
    const updates: { [key: string]: any } = { logs };
    // All issues closed → system is back in service
    if (!logs.some((l) => !l.resolved)) updates.status = 'operational';
    try {
      await updateDoc(doc(db, 'workstations', selectedStation.id), updates);
      const updated = { ...selectedStation, ...updates } as Workstation;
      setSelectedStation(updated);
      setEditForm(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workstations/${selectedStation.id}`);
    }
  };

  const markAudited = async (ws: Workstation) => {
    try {
      const updated = { ...ws, lastAuditAt: new Date().toISOString() };
      await updateDoc(doc(db, 'workstations', ws.id), { lastAuditAt: updated.lastAuditAt });
      setSelectedStation(updated);
      setEditForm(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workstations/${ws.id}`);
    }
  };

  // Seeds the ACTIVE centre only — never touches the other centre's systems.
  const handleInitializeCentre = async (centre: CentreInfo) => {
    const countStr = window.prompt(`How many workstations for ${centre.name} centre?`, '35');
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    if (!count || count < 1 || count > 99) {
      alert('Enter a number between 1 and 99.');
      return;
    }

    const batch: Workstation[] = [];
    for (let i = 1; i <= count; i++) {
      const id = `${centre.prefix}W${i.toString().padStart(2, '0')}`;
      batch.push({
        id,
        name: `Workstation ${id}`,
        type: 'workstation',
        centre: centre.id,
        status: 'operational',
        notes: '',
        os: 'Windows 11',
        logs: [],
        brandCpu: 'Dell Precision',
        brandMonitor: 'Dell UltraSharp',
        processor: 'Intel Core i7-12700',
        ram: '32GB DDR4',
        hdd: '1TB NVMe SSD',
        cameraAligned: 'Not Specified',
        exams: [],
        lastAuditAt: new Date().toISOString(),
      });
    }
    batch.push({
      id: `${centre.prefix}ADM`,
      name: `${centre.name} Admin System`,
      type: 'admin',
      centre: centre.id,
      status: 'operational',
      notes: '',
      os: 'Windows 11',
      logs: [],
      brandCpu: 'HP EliteDesk',
      brandMonitor: 'Dual HP 24"',
      processor: 'Intel Core i9-13900',
      ram: '64GB DDR5',
      hdd: '2TB NVMe SSD',
      cameraAligned: 'Security Hub 01',
      exams: [],
      lastAuditAt: new Date().toISOString(),
    });
    batch.push({
      id: `${centre.prefix}SRV`,
      name: `${centre.name} Exam Server`,
      type: 'server',
      centre: centre.id,
      status: 'operational',
      notes: '',
      os: 'Windows Server',
      logs: [],
      brandCpu: 'Dell PowerEdge R750',
      brandMonitor: 'Rack Console',
      processor: '2x Intel Xeon Platinum',
      ram: '256GB ECC',
      hdd: '10TB RAID 10',
      cameraAligned: 'Server Room',
      exams: [],
      lastAuditAt: new Date().toISOString(),
    });

    const clash = batch.find((item) => workstations.some((ws) => ws.id === item.id));
    if (clash) {
      alert(`ID ${clash.id} already exists — cannot initialize.`);
      return;
    }

    try {
      for (const item of batch) {
        await setDoc(doc(db, 'workstations', item.id), item);
      }
      alert(`${centre.name} initialized with ${batch.length} systems.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workstations');
    }
  };

  const handleCreateNew = async () => {
    const id = window.prompt(`Enter unique system ID (e.g., ${activeCentre.prefix}W36):`);
    if (!id || id.trim() === '') return;
    const cleanId = id.trim().toUpperCase();
    if (workstations.find((ws) => ws.id === cleanId)) {
      alert('ID already exists!');
      return;
    }
    const newNode: Workstation = {
      id: cleanId,
      name: `Workstation ${cleanId}`,
      type: 'workstation',
      centre: activeCentreId,
      status: 'operational',
      notes: '',
      os: '',
      logs: [],
      brandCpu: '',
      brandMonitor: '',
      processor: '',
      ram: '',
      hdd: '',
      cameraAligned: '',
      exams: [],
      lastAuditAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'workstations', newNode.id), newNode);
      openStation(newNode.id);
      setIsEditing(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workstations/${newNode.id}`);
    }
  };

  const downloadQR = async (stationId: string, label: string) => {
    const svg = document.getElementById(`qr-${stationId}-${label}`) as unknown as SVGSVGElement;
    if (!svg) return;
    const png = await svgToPng(svg, 5);
    const a = document.createElement('a');
    a.download = `QR-${stationId}-${label}.png`;
    a.href = png;
    a.click();
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Colour A3 PDF for outside sticker printing — 12 systems (36 stickers) per page.
  const downloadPdfA3 = async () => {
    if (centreStations.length === 0) return;
    setIsExportingPdf(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a3' });
      const PAGE_W = 297;
      const PAGE_H = 420;
      const M = 12; // page margin
      const GROUP_GAP = 9; // between the two system-groups in a row
      const STICKER_GAP = 4; // between stickers of one system
      const ROW_GAP = 6;
      const groupW = (PAGE_W - 2 * M - GROUP_GAP) / 2;
      const stW = (groupW - 2 * STICKER_GAP) / 3;
      const stH = 54;
      const perRow = 2; // systems per row
      const rowsPerPage = Math.floor((PAGE_H - 2 * M + ROW_GAP) / (stH + ROW_GAP));
      const perPage = perRow * rowsPerPage;

      const hex2rgb = (h: string): [number, number, number] => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
      ];

      for (let idx = 0; idx < centreStations.length; idx++) {
        const ws = centreStations[idx];
        const slot = idx % perPage;
        if (idx > 0 && slot === 0) pdf.addPage();
        const row = Math.floor(slot / perRow);
        const col = slot % perRow;
        const gx = M + col * (groupW + GROUP_GAP);
        const gy = M + row * (stH + ROW_GAP);

        for (let s = 0; s < STICKER_TYPES.length; s++) {
          const type = STICKER_TYPES[s];
          const x = gx + s * (stW + STICKER_GAP);
          const y = gy;
          const [r, g, b] = hex2rgb(type.color);

          // sticker outline
          pdf.setDrawColor(208, 204, 194);
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(x, y, stW, stH, 2.5, 2.5, 'FD');

          // top colour bar
          pdf.setFillColor(r, g, b);
          pdf.rect(x + 0.3, y + 0.3, stW - 0.6, 1.8, 'F');

          // QR code
          const svg = document.getElementById(`qr-${ws.id}-${type.key}`) as unknown as SVGSVGElement;
          if (svg) {
            const png = await svgToPng(svg, 6);
            const qrSize = stW - 10;
            pdf.addImage(png, 'PNG', x + (stW - qrSize) / 2, y + 4.5, qrSize, qrSize);
          }

          const ty = y + 4.5 + (stW - 10) + 3; // divider line position
          pdf.setDrawColor(225, 221, 212);
          pdf.line(x + 4, ty, x + stW - 4, ty);

          // system ID
          pdf.setTextColor(r, g, b);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(13);
          pdf.text(ws.id, x + 4, ty + 5.8);

          // location badge
          pdf.setFontSize(5.5);
          const bw = pdf.getTextWidth(type.location) + 3;
          pdf.setFillColor(r, g, b);
          pdf.roundedRect(x + stW - 4 - bw, ty + 2.2, bw, 3.8, 1, 1, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.text(type.location, x + stW - 4 - bw + 1.5, ty + 4.9);

          // footer
          pdf.setTextColor(152, 148, 140);
          pdf.setFontSize(5);
          pdf.text(`${activeCentre.name.toUpperCase()} · FETS.SPACE`, x + stW / 2, y + stH - 2.8, { align: 'center' });
        }
      }

      pdf.save(`fets-${activeCentre.id}-stickers-A3.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const downloadAllQRs = async () => {
    setIsDownloadingAll(true);
    const zip = new JSZip();
    for (const ws of centreStations) {
      for (const st of STICKER_TYPES) {
        const svg = document.getElementById(`qr-${ws.id}-${st.key}`) as unknown as SVGSVGElement;
        if (svg) {
          const png = await svgToPng(svg, 5);
          zip.file(`${ws.id}-${st.key}.png`, png.split(',')[1], { base64: true });
        }
      }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `fets-${activeCentre.id}-qrs.zip`);
    setIsDownloadingAll(false);
  };


  // --- Print View: A4 sheets, 5 systems per page × 3 stickers ---

  const PrintView = () => {
    const pages = chunkArrays<Workstation>(centreStations, 5);
    return (
      <div className="fixed inset-0 bg-paper z-[100] overflow-y-auto p-4 sm:p-8 print:static print:h-auto print:overflow-visible print:bg-white print:p-0 font-sans">
        <div className="max-w-[210mm] mx-auto print:max-w-none">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 bg-card p-5 sm:p-6 rounded-2xl border border-line print:hidden">
            <div>
              <h2 className="font-display text-xl sm:text-2xl uppercase">QR Sticker Sheets</h2>
              <p className="font-mono text-[11px] text-ink-soft mt-1">
                {activeCentre.name} · {centreStations.length} systems · 3 stickers each (Monitor / CPU / Workstation)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setIsPrinting(false)}
                className="px-4 py-2.5 border border-ink/20 font-semibold text-sm rounded-xl hover:bg-ink hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={downloadAllQRs}
                disabled={isDownloadingAll}
                className="px-4 py-2.5 bg-card border border-ink/20 font-semibold text-sm rounded-xl flex items-center gap-2 hover:bg-ink hover:text-white transition-colors disabled:opacity-50"
              >
                {isDownloadingAll
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Download size={16} />}
                {isDownloadingAll ? 'Zipping…' : 'Download PNGs'}
              </button>
              <button
                onClick={downloadPdfA3}
                disabled={isExportingPdf}
                className="px-4 py-2.5 bg-ink text-white font-semibold text-sm rounded-xl flex items-center gap-2 hover:opacity-85 transition-opacity disabled:opacity-50"
              >
                {isExportingPdf
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <FileDown size={16} />}
                {isExportingPdf ? 'Building PDF…' : 'PDF A3'}
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 text-white font-bold text-sm rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
                style={{ backgroundColor: activeCentre.accent }}
              >
                <Printer size={16} />
                Print A4
              </button>
            </div>
          </div>

          {centreStations.length === 0 && (
            <div className="text-center py-20 font-mono text-xs text-ink-soft uppercase tracking-widest print:hidden">
              No systems in {activeCentre.name} yet
            </div>
          )}

          <div className="space-y-4 print:space-y-0">
            {pages.map((page, pageIndex) => (
              <div
                key={pageIndex}
                className="bg-white mx-auto print:mx-0 shadow-lg print:shadow-none w-[210mm] h-[297mm] break-after-page box-border p-[10mm] flex flex-col justify-start gap-[5mm]"
              >
                {page.map((ws) => (
                  <div key={ws.id} className="grid grid-cols-3 gap-[8mm] pb-[5mm] border-b border-dashed border-line last:border-0">
                    {STICKER_TYPES.map((type) => (
                      <Sticker key={type.key} ws={ws} type={type} centreName={activeCentre.name} />
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
    <div className="min-h-screen bg-paper texture-paper text-ink font-sans selection:bg-ink selection:text-paper">
      {/* Navigation */}
      <nav className="border-b border-line px-4 sm:px-6 py-3 flex justify-between items-center bg-paper/80 backdrop-blur-md sticky top-0 z-50">
        <button className="flex items-center gap-2.5" onClick={goHome}>
          <div className="text-white p-1.5 rounded-lg" style={{ backgroundColor: activeCentre.accent }}>
            <ScanLine size={16} />
          </div>
          <span className="font-display text-base uppercase tracking-tight">fets·space</span>
        </button>

        {/* Centre switcher */}
        <div className="flex items-center bg-ink/5 rounded-full p-1 border border-line">
          {CENTRES.map((centre) => (
            <button
              key={centre.id}
              onClick={() => {
                setActiveCentreId(centre.id);
                if (view !== 'home') goHome();
              }}
              className={cn(
                'px-3.5 sm:px-5 py-1.5 rounded-full font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all',
                activeCentreId === centre.id ? 'text-white shadow-sm' : 'text-ink-soft hover:text-ink',
              )}
              style={activeCentreId === centre.id ? { backgroundColor: centre.accent } : undefined}
            >
              {centre.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key={`home-${activeCentreId}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-7 sm:space-y-10"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
                <div>
                  <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-ink-soft mb-2">
                    Exam Centre Registry
                  </p>
                  <h1 className="font-display text-5xl sm:text-7xl uppercase leading-[0.9]" style={{ color: activeCentre.accent }}>
                    {activeCentre.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 font-mono text-[11px] sm:text-xs text-ink-soft">
                    <span><strong className="text-ink">{stats.total}</strong> systems</span>
                    <span className="flex items-center gap-1.5">
                      <StatusDot status="operational" />
                      <strong className="text-ink">{stats.operational}</strong> operational
                    </span>
                    {stats.attention > 0 && (
                      <span className="flex items-center gap-1.5">
                        <StatusDot status="fault" />
                        <strong className="text-ink">{stats.attention}</strong> need attention
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={handleCreateNew}
                    className="flex-1 sm:flex-none px-4 py-3.5 text-white flex items-center justify-center gap-2 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
                    style={{ backgroundColor: activeCentre.accent }}
                  >
                    <Plus size={18} /> Add System
                  </button>
                  <button
                    onClick={() => setIsPrinting(true)}
                    className="flex-1 sm:flex-none px-4 py-3.5 bg-card border border-line flex items-center justify-center gap-2 rounded-2xl font-bold text-sm hover:border-ink transition-colors"
                  >
                    <QrCode size={18} /> QR Sheets
                  </button>
                </div>
              </div>

              {/* Search */}
              {centreStations.length > 0 && (
                <div className="relative max-w-md">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by ID or name…"
                    className="w-full pl-11 pr-10 py-3 bg-card border border-line rounded-2xl text-sm font-medium focus:border-ink outline-none transition-colors"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Station grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5 sm:gap-3">
                {visibleStations.map((ws, i) => (
                  <motion.button
                    key={ws.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.012, 0.4), duration: 0.2 }}
                    onClick={() => openStation(ws.id)}
                    className={cn(
                      'group relative flex flex-col items-center justify-center aspect-square border rounded-2xl transition-all',
                      'hover:border-ink hover:shadow-[0_8px_24px_-12px_rgba(26,23,18,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
                      statusOf(ws) === 'fault'
                        ? 'border-red-400 bg-red-50'
                        : statusOf(ws) === 'maintenance'
                          ? 'border-amber-300 bg-amber-50'
                          : statusOf(ws) === 'away'
                            ? 'border-dashed border-line bg-paper/60 opacity-70'
                            : 'border-line bg-card',
                    )}
                  >
                    <span className="absolute top-2 right-2">
                      <StatusDot status={statusOf(ws)} size={7} />
                    </span>
                    {ws.type !== 'workstation' && (
                      <span
                        className="absolute top-2 left-2 font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: ws.type === 'admin' ? '#D98E04' : activeCentre.accent }}
                      >
                        {ws.type === 'admin' ? 'ADM' : 'SRV'}
                      </span>
                    )}
                    <span className="font-display text-xl sm:text-2xl uppercase">{ws.id}</span>
                    {openIssueCount(ws) > 0 && (
                      <span className="absolute bottom-1.5 font-mono text-[8px] font-bold uppercase text-red-600">
                        {openIssueCount(ws)} issue{openIssueCount(ws) > 1 ? 's' : ''}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              {centreStations.length === 0 && (
                <div className="py-20 text-center bg-card border border-dashed border-line rounded-[2rem]">
                  <Database size={32} className="mx-auto mb-4 text-ink-soft" />
                  <p className="font-mono text-xs text-ink-soft uppercase tracking-widest mb-6">
                    No systems registered for {activeCentre.name}
                  </p>
                  <button
                    onClick={() => handleInitializeCentre(activeCentre)}
                    className="px-8 py-3.5 text-white font-bold uppercase tracking-wider text-sm rounded-xl active:scale-95 transition-transform"
                    style={{ backgroundColor: activeCentre.accent }}
                  >
                    Initialize {activeCentre.name}
                  </button>
                </div>
              )}

              {centreStations.length > 0 && visibleStations.length === 0 && (
                <p className="text-center font-mono text-xs text-ink-soft uppercase tracking-widest py-10">
                  No matches for “{searchTerm}”
                </p>
              )}
            </motion.div>
          )}

          {view === 'detail' && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              className="max-w-md mx-auto"
            >
              {isFetchingDetail ? (
                <div className="text-center p-12 bg-card border border-line rounded-[2rem]">
                  <div className="w-10 h-10 border-[3px] border-ink border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                  <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Locating asset…</p>
                </div>
              ) : selectedStation ? (
                isEditing ? (
                  /* ---- EDIT MODE ---- */
                  <div className="bg-card border border-line rounded-[2rem] p-6 sm:p-8 space-y-5">
                    <div className="flex justify-between items-center">
                      <div className="text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: activeCentre.accent }}>
                        Editing {selectedStation.id}
                      </div>
                      <button onClick={() => setIsEditing(false)} className="text-xs font-mono uppercase text-ink-soft underline underline-offset-4">
                        Cancel
                      </button>
                    </div>

                    <Field label="System ID" value={editForm?.id || ''} onChange={(v) => setEditForm((p) => p && { ...p, id: v.toUpperCase() })} placeholder="e.g. AW01" />
                    <Field label="Name" value={editForm?.name || ''} onChange={(v) => setEditForm((p) => p && { ...p, name: v })} placeholder="e.g. Master Terminal" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase font-semibold text-ink-soft tracking-wider ml-1">Type</label>
                        <select
                          value={editForm?.type}
                          onChange={(e) => setEditForm((p) => p && { ...p, type: e.target.value as Workstation['type'] })}
                          className="w-full p-3.5 bg-paper/60 border border-line rounded-xl font-medium text-sm"
                        >
                          <option value="workstation">Workstation</option>
                          <option value="admin">Admin</option>
                          <option value="server">Server</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase font-semibold text-ink-soft tracking-wider ml-1">Centre</label>
                        <select
                          value={centreOf(editForm ?? selectedStation)}
                          onChange={(e) => setEditForm((p) => p && { ...p, centre: e.target.value as CentreId })}
                          className="w-full p-3.5 bg-paper/60 border border-line rounded-xl font-medium text-sm"
                        >
                          {CENTRES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase font-semibold text-ink-soft tracking-wider ml-1">Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(STATUS_META) as SystemStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setEditForm((p) => p && { ...p, status: s })}
                            className={cn(
                              'flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all',
                              statusOf(editForm ?? selectedStation) === s ? 'border-ink bg-ink text-white' : 'border-line bg-paper/60 text-ink-soft',
                            )}
                          >
                            <StatusDot status={s} size={7} />
                            {STATUS_META[s].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Processor" value={editForm?.processor || ''} onChange={(v) => setEditForm((p) => p && { ...p, processor: v })} placeholder="e.g. Intel Core i7" />
                      <Field label="RAM" value={editForm?.ram || ''} onChange={(v) => setEditForm((p) => p && { ...p, ram: v })} placeholder="e.g. 32GB DDR4" />
                      <Field label="Operating System" value={editForm?.os || ''} onChange={(v) => setEditForm((p) => p && { ...p, os: v })} placeholder="e.g. Windows 11" />
                      <Field label="Storage" value={editForm?.hdd || ''} onChange={(v) => setEditForm((p) => p && { ...p, hdd: v })} placeholder="e.g. 1TB SSD" />
                      <Field label="Camera" value={editForm?.cameraAligned || ''} onChange={(v) => setEditForm((p) => p && { ...p, cameraAligned: v })} placeholder="e.g. CCTV Zone A" />
                      <Field label="CPU Brand" value={editForm?.brandCpu || ''} onChange={(v) => setEditForm((p) => p && { ...p, brandCpu: v })} placeholder="e.g. Dell Precision" />
                      <Field label="Monitor" value={editForm?.brandMonitor || ''} onChange={(v) => setEditForm((p) => p && { ...p, brandMonitor: v })} placeholder="e.g. Dell UltraSharp" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase font-semibold text-ink-soft tracking-wider ml-1">Notes</label>
                      <textarea
                        value={editForm?.notes || ''}
                        onChange={(e) => setEditForm((p) => p && { ...p, notes: e.target.value })}
                        rows={3}
                        placeholder="Maintenance history, issues, reminders…"
                        className="w-full p-3.5 bg-paper/60 border border-line rounded-xl font-medium text-sm focus:border-ink outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-line space-y-3">
                      <button
                        onClick={() => editForm && handleUpdate(editForm)}
                        className="w-full py-4 text-white font-bold uppercase tracking-widest text-sm rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        style={{ backgroundColor: activeCentre.accent }}
                      >
                        <CheckCircle2 size={18} /> Save Changes
                      </button>
                      <button
                        onClick={async () => {
                          if (!selectedStation || !window.confirm(`Permanently delete ${selectedStation.id}?`)) return;
                          try {
                            await deleteDoc(doc(db, 'workstations', selectedStation.id));
                            goHome();
                          } catch (e) {
                            handleFirestoreError(e, OperationType.DELETE, `workstations/${selectedStation.id}`);
                          }
                        }}
                        className="w-full py-3 text-red-600 font-mono text-[10px] uppercase font-semibold hover:bg-red-50 rounded-xl transition-colors"
                      >
                        Delete this system
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ---- DETAIL (scan landing) MODE ---- */
                  <div className="space-y-5">
                    {/* Header card */}
                    <div className="text-white p-5 sm:p-7 rounded-[2rem] relative overflow-hidden" style={{ backgroundColor: '#1A1712' }}>
                      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-30" style={{ backgroundColor: activeCentre.accent }} />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 text-white/80">
                              {activeCentre.name} Centre
                            </span>
                            <span
                              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full"
                              style={{ backgroundColor: STATUS_META[statusOf(selectedStation)].color + '33', color: STATUS_META[statusOf(selectedStation)].color }}
                            >
                              <StatusDot status={statusOf(selectedStation)} size={6} />
                              {STATUS_META[statusOf(selectedStation)].label}
                            </span>
                          </div>
                          <button
                            onClick={() => { setEditForm(selectedStation); setIsEditing(true); }}
                            className="bg-white text-ink p-3 rounded-xl active:scale-90 transition-transform"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <h2 className="font-display text-4xl sm:text-5xl uppercase leading-none">{selectedStation.id}</h2>
                          <div className="min-w-0">
                            <p className="text-[8px] font-mono uppercase text-white/40 mb-0.5">{selectedStation.type}</p>
                            <h4 className="font-bold text-sm leading-tight truncate">{selectedStation.name}</h4>
                          </div>
                        </div>
                        {/* Micro specs inside the ID card */}
                        <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-2 gap-x-5 gap-y-2">
                          {[
                            { k: 'CPU', v: [selectedStation.processor, selectedStation.brandCpu].filter(Boolean).join(' · ') },
                            { k: 'RAM', v: selectedStation.ram },
                            { k: 'OS', v: selectedStation.os },
                            { k: 'Disk', v: selectedStation.hdd },
                            { k: 'Monitor', v: selectedStation.brandMonitor },
                            { k: 'CCTV', v: selectedStation.cameraAligned },
                          ].map((row) => (
                            <div key={row.k} className="flex items-baseline justify-between gap-2 min-w-0">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-white/35 shrink-0">{row.k}</span>
                              <span className="font-mono text-[11px] text-white/85 text-right truncate">{row.v || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Issue & movement log */}
                    <div className="bg-card border border-line rounded-[2rem] p-5 sm:p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-mono text-[10px] uppercase font-semibold tracking-[0.2em] text-ink-soft flex items-center gap-2">
                          <AlertCircle size={13} /> Issue & Movement Log
                          {openIssueCount(selectedStation) > 0 && (
                            <span className="bg-red-600 text-white rounded-full px-2 py-0.5 text-[9px] font-bold normal-case tracking-normal">
                              {openIssueCount(selectedStation)} open
                            </span>
                          )}
                        </h4>
                        <button
                          onClick={() => setIsReporting(!isReporting)}
                          className={cn(
                            'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95',
                            isReporting ? 'bg-paper border border-line text-ink-soft' : 'bg-ink text-white',
                          )}
                        >
                          {isReporting ? <X size={13} /> : <Plus size={13} />}
                          {isReporting ? 'Cancel' : 'Report'}
                        </button>
                      </div>

                      {isReporting && (
                        <div className="p-4 bg-paper/70 border border-line rounded-2xl space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {(Object.keys(LOG_KIND_META) as LogKind[]).map((kind) => (
                              <button
                                key={kind}
                                onClick={() => setReportKind(kind)}
                                className={cn(
                                  'px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all',
                                  reportKind === kind ? 'text-white border-transparent' : 'bg-card border-line text-ink-soft',
                                )}
                                style={reportKind === kind ? { backgroundColor: LOG_KIND_META[kind].color } : undefined}
                              >
                                {LOG_KIND_META[kind].label}
                              </button>
                            ))}
                          </div>
                          {reportKind === 'transfer' && (
                            <p className="text-[11px] font-mono text-ink-soft">
                              System will be moved to{' '}
                              <strong className="text-ink">{CENTRES.find((c) => c.id !== centreOf(selectedStation))!.name}</strong>.
                            </p>
                          )}
                          <textarea
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            rows={2}
                            placeholder={reportKind === 'transfer' ? 'Reason for transfer (optional)…' : 'Describe the issue…'}
                            className="w-full p-3 bg-card border border-line rounded-xl text-sm focus:border-ink outline-none transition-colors resize-none"
                          />
                          <button
                            onClick={submitReport}
                            className="w-full py-3 text-white font-bold uppercase tracking-wider text-xs rounded-xl active:scale-[0.98] transition-transform"
                            style={{ backgroundColor: LOG_KIND_META[reportKind].color }}
                          >
                            Log {LOG_KIND_META[reportKind].label}
                          </button>
                        </div>
                      )}

                      {(selectedStation.logs ?? []).length === 0 && !isReporting && (
                        <p className="text-xs text-ink-soft font-mono text-center py-3">No issues recorded. All clear.</p>
                      )}

                      <div className="space-y-2">
                        {(selectedStation.logs ?? []).map((log, i) => ({ log, i })).reverse().map(({ log, i }) => (
                          <div
                            key={i}
                            className={cn(
                              'flex items-start gap-3 p-3.5 rounded-xl border',
                              log.resolved ? 'border-line/60 opacity-55' : 'border-line bg-paper/50',
                            )}
                          >
                            <span
                              className="mt-1 inline-block w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: LOG_KIND_META[log.kind]?.color ?? '#999999' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center gap-2 mb-0.5">
                                <span
                                  className="font-mono text-[9px] uppercase font-bold tracking-wider"
                                  style={{ color: LOG_KIND_META[log.kind]?.color }}
                                >
                                  {LOG_KIND_META[log.kind]?.label ?? log.kind}
                                </span>
                                <span className="font-mono text-[9px] text-ink-soft shrink-0">{timeAgo(log.at)}</span>
                              </div>
                              <p className="text-sm font-medium leading-snug">{log.text}</p>
                            </div>
                            {!log.resolved ? (
                              <button
                                onClick={() => resolveLog(i)}
                                className="shrink-0 px-2.5 py-1.5 rounded-lg border border-line text-[10px] font-bold uppercase text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                Resolve
                              </button>
                            ) : (
                              log.kind !== 'transfer' && log.kind !== 'note' && (
                                <span className="shrink-0 font-mono text-[9px] uppercase text-emerald-700 font-bold mt-1">Resolved</span>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Software / notes / audit */}
                    <div className="bg-card border border-line rounded-[2rem] p-5 sm:p-6 space-y-5">
                      {/* Software */}
                      <div>
                        <h4 className="font-mono text-[10px] uppercase font-semibold tracking-[0.2em] text-ink-soft mb-3 flex items-center gap-2">
                          <Cpu size={13} /> Exam Software
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {EXAM_LIST.map((exam) => {
                            const isReady = selectedStation.exams.includes(exam);
                            return (
                              <button
                                key={exam}
                                onClick={() => {
                                  const newExams = isReady
                                    ? selectedStation.exams.filter((e) => e !== exam)
                                    : [...selectedStation.exams, exam];
                                  handleUpdate({ ...selectedStation, exams: newExams });
                                }}
                                className={cn(
                                  'flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all active:scale-95',
                                  isReady ? 'bg-ink border-ink text-white' : 'bg-paper/60 border-line text-ink-soft',
                                )}
                              >
                                {isReady && <CheckCircle2 size={14} style={{ color: '#34D399' }} />}
                                {exam}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedStation.notes && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                          <p className="text-[9px] font-mono uppercase text-amber-700 mb-1.5 font-semibold tracking-wider flex items-center gap-1.5">
                            <StickyNote size={12} /> Notes
                          </p>
                          <p className="text-sm font-medium whitespace-pre-wrap">{selectedStation.notes}</p>
                        </div>
                      )}

                      {/* Audit */}
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-line">
                        <p className="font-mono text-[10px] text-ink-soft uppercase tracking-wider">
                          Last audit · <strong className="text-ink">{timeAgo(selectedStation.lastAuditAt)}</strong>
                        </p>
                        <button
                          onClick={() => markAudited(selectedStation)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white active:scale-95 transition-transform"
                          style={{ backgroundColor: activeCentre.accent }}
                        >
                          <ClipboardCheck size={14} /> Mark Audited
                        </button>
                      </div>
                    </div>

                    {/* QR stickers for this system */}
                    <div className="bg-card border border-line rounded-[2rem] p-5 sm:p-7">
                      <h4 className="font-mono text-[10px] uppercase font-semibold tracking-[0.2em] text-ink-soft mb-1 flex items-center gap-2">
                        <QrCode size={13} /> Asset Stickers
                      </h4>
                      <p className="text-xs text-ink-soft mb-4">Tap a sticker to download as PNG for printing.</p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {STICKER_TYPES.map((type) => (
                          <button key={type.key} onClick={() => downloadQR(selectedStation.id, type.key)} className="active:scale-95 transition-transform text-left">
                            <Sticker ws={selectedStation} type={type} size={120} centreName={activeCentre.name} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={goHome}
                      className="w-full py-4 bg-card border border-line rounded-2xl font-bold uppercase tracking-widest text-sm hover:border-ink transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={18} /> Back to {activeCentre.name}
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center p-10 bg-card border border-line rounded-[2rem]">
                  <AlertCircle size={56} className="mx-auto mb-5 text-red-500" />
                  <h2 className="font-display text-3xl uppercase mb-3">Invalid Scan</h2>
                  <p className="text-ink-soft mb-8 text-sm">
                    System <code className="bg-paper px-2 py-0.5 rounded font-mono text-ink">{currentId}</code> is not registered.
                  </p>
                  <button onClick={goHome} className="w-full py-3.5 bg-ink text-white font-bold uppercase tracking-widest text-sm rounded-2xl">
                    Back to Registry
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
