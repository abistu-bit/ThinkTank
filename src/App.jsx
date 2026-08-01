import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import CardSwap, { Card } from './CardSwap';
import { supabase } from './supabaseClient';
import {
  Droplet, TreePine, BookOpen, Trash2, HeartPulse, LifeBuoy, Users, Award,
  Bell, ChevronRight, ChevronLeft, Check, X, Clock, Calendar, MapPin, Plus,
  LogOut, BarChart3, Megaphone, Building2,
  ClipboardList, Sparkles, RefreshCw, ArrowLeft, FileCheck2,
  Printer, PenLine, ShieldCheck, Wallet, Search, Command, Sun, Moon,
  Scissors, Flame, KeyRound, Undo2, Image, QrCode, User, Download, XCircle,
  CheckCircle2, AlertCircle, Info, AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend, Sector
} from "recharts";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import QRCode from 'react-qr-code';
import SpotlightCard from './SpotlightCard';
import html2canvas from 'html2canvas';

/* ============================================================
   CONSTANTS & SEED DATA
   ============================================================ */

const STORAGE_KEY = "seva-ledger-db-v2";
const TODAY = new Date("2026-07-31T00:00:00");

const CATEGORIES = [
  { name: "Blood Donation", icon: Droplet },
  { name: "Tree Plantation", icon: TreePine },
  { name: "Literacy Drive", icon: BookOpen },
  { name: "Cleanliness Drive", icon: Trash2 },
  { name: "Health Camp", icon: HeartPulse },
  { name: "Disaster Relief", icon: LifeBuoy },
  { name: "Elderly Care", icon: Users },
];

const MILESTONES = [
  { events: 3, label: "Bronze Badge", image: "/badge-bronze.jpg" },
  { events: 5, label: "Silver Badge", image: "/badge-silver.jpg" },
  { events: 10, label: "Gold Badge", image: "/badge-gold.jpg" },
];

const DEPARTMENTS = ["CSE", "ECE", "Mechanical", "Civil"];

function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}


function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateShort(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function monthKey(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}
function daysUntil(iso) {
  const d = new Date(iso + "T00:00:00");
  return Math.round((d - TODAY) / 86400000);
}
function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("");
}
function verificationCode(personId, hrs) {
  const raw = personId + "-" + hrs + "-seva";
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
  return "SVL-" + h.toString(36).toUpperCase().slice(0, 8);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
        background: "var(--paper-hi)", padding: "12px 16px", borderRadius: "8px",
        boxShadow: "0 10px 24px -8px var(--shadow)", border: "1px solid var(--paper-line)",
        animation: "seva-pop 0.15s ease-out"
      }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)" }}>{label}</h4>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: entry.color || entry.payload.fill || "var(--ink)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.15)" }} />
            {entry.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* ============================================================
   STYLES
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

body { margin: 0; overflow: hidden; }
.seva-root {
  --paper: #F0F4FF;
  --paper-hi: #FFFFFF;
  --paper-line: #E0E7FF;
  --paper-hover: #EEF2FF;
  --ink: #1E1B4B;
  --ink-soft: #6366A0;
  --stamp: #E11D48;
  --brass: #D97706;
  --moss: #059669;
  --spark: #F59E0B;
  --violet: #7C3AED;
  --sky: #0EA5E9;
  --shadow: rgba(99,102,241,.2);
  --accent: #6366F1;
  --accent-2: #EC4899;
  --accent-3: #F97316;
  
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  height: 100vh;
  line-height: 1.5;
  transition: background .25s ease, color .25s ease;
  overflow: hidden;
}
.seva-root[data-theme="dark"] {
  --paper: #0D0F1A;
  --paper-hi: #13162A;
  --paper-line: #1E2340;
  --paper-hover: #181B30;
  --ink: #E0E7FF;
  --ink-soft: #818CF8;
  --stamp: #F43F5E;
  --brass: #FBBF24;
  --moss: #34D399;
  --spark: #FCD34D;
  --violet: #A78BFA;
  --sky: #38BDF8;
  --shadow: rgba(0,0,0,.6);
  --accent: #818CF8;
  --accent-2: #F472B6;
  --accent-3: #FB923C;
}
.seva-root *, .seva-root *::before, .seva-root *::after { box-sizing: border-box; }
.seva-root button, .seva-root input, .seva-root textarea, .seva-root select { font-family: inherit; }
.seva-root :focus-visible { outline: 2.5px solid var(--brass); outline-offset: 2px; }
.seva-root h1, .seva-root h2, .seva-root h3 { font-family: var(--font-display); margin: 0; }
.seva-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.seva-root ::-webkit-scrollbar-thumb { background: var(--paper-line); border-radius: 6px; }
@media (prefers-reduced-motion: reduce) { .seva-root * { animation-duration: .001ms !important; transition-duration: .001ms !important; } }

/* ---- brand mark ---- */
.wheel-mark { color: currentColor; flex-shrink: 0; }
.wheel-mark.spin { animation: seva-spin 46s linear infinite; }
@keyframes seva-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ---- landing ---- */
.landing { min-height: 100vh; display: flex; flex-direction: column; }
.landing-top { display:flex; align-items:center; justify-content:space-between; padding: 22px 40px; border-bottom: 1px solid var(--paper-line); }
.brand-lockup { display:flex; align-items:center; gap:10px; font-family: var(--font-display); font-weight:700; font-size:19px; letter-spacing:.02em; }
.brand-lockup small { display:block; font-family: var(--font-mono); font-weight:400; font-size:10.5px; color: var(--ink-soft); letter-spacing:.14em; text-transform:uppercase; }
.landing-hero { padding: 60px 40px 36px; max-width: 980px; }
.eyebrow { font-family: var(--font-mono); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--stamp); margin-bottom: 18px; display:flex; align-items:center; gap:8px; }
.landing-hero h1 { font-size: 50px; line-height: 1.08; font-weight: 700; max-width: 760px; letter-spacing:-.01em; }
.landing-hero h1 .torn { position:relative; white-space:nowrap; }
.landing-hero p.sub { font-size: 17px; color: var(--ink-soft); max-width: 560px; margin-top: 20px; }
.stat-strip { display:flex; gap: 0; margin-top: 38px; border-top: 1px solid var(--paper-line); border-bottom: 1px solid var(--paper-line); }
.stat-strip .cell { flex:1; padding: 18px 24px; border-right: 1px solid var(--paper-line); }
.stat-strip .cell:last-child { border-right:none; }
.stat-strip .num { font-family: var(--font-mono); font-size: 28px; font-weight: 600; color: var(--stamp); }
.stat-strip .lbl { font-size: 12.5px; color: var(--ink-soft); margin-top: 4px; }

.role-picker { padding: 8px 40px 70px; display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 20px; max-width: 1080px; }
.role-card { background: var(--paper-hi); border: 1.5px solid var(--paper-line); border-radius: 4px; padding: 26px 24px; text-align:left; cursor:pointer; transition: transform .15s ease, box-shadow .15s ease; position:relative; color: var(--ink); }
.role-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px -12px var(--shadow); border-color: var(--ink); }
.role-card .idx { font-family: var(--font-mono); font-size:11px; color: var(--ink-soft); letter-spacing:.1em; }
.role-card h3 { font-size: 21px; margin-top: 8px; }
.role-card p { font-size: 13.5px; color: var(--ink-soft); margin-top: 8px; }
.role-card .go { margin-top: 16px; display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color: var(--stamp); }
.role-card::before { content:""; position:absolute; top:14px; right:14px; width:26px; height:26px; border:1.5px solid var(--paper-line); border-radius:50%; }

.persona-panel { padding: 0 40px 70px; max-width: 1080px; }
.persona-panel .back { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color: var(--ink-soft); background:none; border:none; cursor:pointer; margin-bottom:18px; padding:0; }
.persona-list { display:grid; grid-template-columns: repeat(auto-fill, minmax(230px,1fr)); gap: 14px; }
.persona-btn { display:flex; align-items:center; gap: 12px; background: var(--paper-hi); border: 1.5px solid var(--paper-line); border-radius: 4px; padding: 14px 16px; text-align:left; cursor:pointer; color: var(--ink); }
.persona-btn:hover { border-color: var(--ink); }
.avatar { width:38px; height:38px; border-radius:50%; background: var(--ink); color: var(--paper); display:flex; align-items:center; justify-content:center; font-family: var(--font-mono); font-weight:600; font-size:14px; flex-shrink:0; }
.persona-btn .who b { display:block; font-size:14px; }
.persona-btn .who span { font-size:12px; color: var(--ink-soft); }

/* ---- app shell ---- */
.shell { display:flex; height:100vh; overflow:hidden; background: var(--paper); }
.sidebar { width:260px; flex-shrink:0; background: linear-gradient(170deg, #1E1B4B 0%, #312E81 60%, #4338CA 100%); color: #fff; display:flex; flex-direction:column; padding: 30px 16px; position: relative; height: 100vh; border-right: none; }
.seva-root[data-theme="dark"] .sidebar { background: linear-gradient(170deg, #060610 0%, #0D0F1A 60%, #13162A 100%); border-right: 1px solid #1E2340; }
.sidebar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse at top left, rgba(99,102,241,0.3) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(236,72,153,0.15) 0%, transparent 60%); pointer-events: none; }
.sidebar-brand { display:flex; align-items:center; gap:12px; padding: 4px 8px 32px; font-family: var(--font-display); font-weight:700; font-size: 20px; color: #fff; }
.sidebar-nav { display:flex; flex-direction:column; gap:4px; flex:1; overflow-y:auto; }
.nav-group-title { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.45); letter-spacing: 0.12em; text-transform: uppercase; margin: 14px 0 6px 10px; }
.nav-btn { display:flex; align-items:center; gap:12px; padding: 11px 14px; border-radius: 14px; background:none; border:none; color: rgba(255,255,255,0.65); font-size: 14px; font-weight:500; text-align:left; cursor:pointer; width:100%; transition: all 0.2s ease; }
.nav-btn:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateX(2px); }
.seva-root[data-theme="dark"] .nav-btn:hover { background: rgba(255,255,255,.06); color: #fff; }
.nav-btn.active { background: rgba(255,255,255,0.15); color: #fff; font-weight:700; box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 4px 16px rgba(0,0,0,.2); backdrop-filter: blur(8px); }
.nav-btn.active .nav-icon-wrap { background: linear-gradient(135deg, #818CF8, #C084FC); border-radius: 8px; padding: 4px; color: #fff; }
.seva-root[data-theme="dark"] .nav-btn.active { background: rgba(129,140,248,0.15); box-shadow: 0 0 0 1px rgba(129,140,248,0.3); }
.sidebar-foot { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 16px; display:flex; flex-direction:column; gap:4px; flex-shrink:0; }
.sidebar-foot button { display:flex; align-items:center; gap:10px; background:none; border:none; color: rgba(255,255,255,0.6); font-size: 13px; cursor:pointer; padding: 10px 14px; width:100%; text-align:left; border-radius: 12px; transition: all 0.2s ease; }
.sidebar-foot button:hover { color: #fff; background: rgba(255,255,255,0.08); }
.seva-root[data-theme="dark"] .sidebar-foot button:hover { color: #fff; background: rgba(255,255,255,.04); }

.main { flex:1; min-width:0; display:flex; flex-direction:column; height: 100vh; }
.topbar { display:flex; align-items:center; justify-content:space-between; padding: 24px 40px; background: var(--paper); z-index:5; gap: 16px; flex-shrink:0; border-bottom: none; }
.topbar h2 { font-size: 20px; white-space:nowrap; }
.topbar .right { display:flex; align-items:center; gap: 10px; }
.cmdk-trigger { display:flex; align-items:center; gap:8px; background: var(--paper-hi); border: 1.5px solid var(--paper-line); border-radius: 20px; padding: 8px 14px; font-size:12.5px; color: var(--ink-soft); cursor:pointer; }
.cmdk-trigger:hover { border-color: var(--ink); }
.cmdk-trigger kbd { font-family: var(--font-mono); background: var(--paper); border: 1px solid var(--paper-line); border-radius: 3px; padding: 1px 5px; font-size: 10.5px; }
.icon-btn { position:relative; background: var(--paper-hi); border: 1.5px solid var(--paper-line); border-radius: 4px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color: var(--ink); flex-shrink:0; }
.icon-btn:hover { border-color: var(--ink); }
.icon-btn .dot { position:absolute; top:-4px; right:-4px; background: var(--stamp); color:#fff; font-family: var(--font-mono); font-size:10px; min-width:16px; height:16px; border-radius:8px; display:flex; align-items:center; justify-content:center; padding: 0 3px; }
.who-badge { display:flex; align-items:center; gap:9px; }
.who-badge .who b { display:block; font-size:13.5px; }
.who-badge .who span { font-size:11px; color: var(--ink-soft); text-transform:uppercase; letter-spacing:.06em; }

.notif-drop { position:absolute; right: 0; top: calc(100% + 14px); width: 360px; max-height: 480px; overflow-y:auto; background: var(--paper-hi); border: 1px solid var(--paper-line); border-radius: 12px; box-shadow: 0 16px 40px -12px var(--shadow); z-index: 20; display:flex; flex-direction:column; }
.notif-drop .notif-header { padding: 16px 20px; border-bottom: 1px solid var(--paper-line); font-family: var(--font-display); font-weight: 700; font-size: var(--text-base); position:sticky; top:0; background:var(--paper-hi); z-index:2; }
.notif-drop .item { padding: 16px 20px; border-bottom: 1px solid var(--paper-line); font-size: var(--text-sm); display:flex; gap:12px; align-items:flex-start; position:relative; }
.notif-drop .item:last-child { border-bottom:none; }
.notif-drop .item::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:transparent; transition:background .2s ease; }
.notif-drop .item[data-tone="info"]::before { background: #3B82F6; }
.notif-drop .item[data-tone="success"]::before { background: var(--moss); }
.notif-drop .item[data-tone="warn"]::before { background: var(--spark); }
.notif-drop .item-icon { flex-shrink:0; margin-top:2px; }
.notif-drop .item-content { flex:1; line-height: 1.5; color: var(--ink); }
.notif-drop .item-content strong { font-weight: 700; color: var(--ink); }
.notif-drop .item .t { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--ink-soft); margin-top:6px; font-variant-numeric: tabular-nums; }
.notif-drop .empty { padding: 32px 20px; font-size: var(--text-sm); color: var(--ink-soft); text-align:center; }

.content { padding: 4px 40px 60px; width: 100%; box-sizing: border-box; flex: 1; overflow-y: auto; overflow-x: hidden; }
.section-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:10px; width:100%; }
.section-head h3 { font-size: 18px; font-weight:700; }
.section-head p.hint { font-size: 12.5px; color: var(--ink-soft); margin-top:4px; line-height:1.5; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 20px; color: var(--ink-soft); }
.empty-state h4 { font-size: 16px; font-weight: 600; color: var(--ink); margin: 16px 0 8px; }
.empty-state p { font-size: 13.5px; max-width: 400px; line-height: 1.5; margin: 0; }

.stat-row { display:grid; grid-template-columns: repeat(auto-fit, minmax(120px,1fr)); gap: 14px; margin-bottom: 24px; width:100%; }
.stat-card { background: var(--paper-hi); border: none; border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(99,102,241,0.06); position: relative; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.12); }
.stat-card::before { content: ''; position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; opacity: 0.08; background: var(--accent); }
.stat-card .lbl { font-size: 11.5px; color: var(--ink-soft); text-transform:uppercase; letter-spacing:.07em; font-weight:600; }
.stat-card .row { display:flex; align-items:flex-end; justify-content:space-between; gap:10px; margin-top:8px; }
.stat-card .val { font-family: var(--font-mono); font-size: 30px; font-weight:700; line-height:1; }
.stat-card .sub { font-size: 12px; color: var(--ink-soft); margin-top:6px; }

.wheel-progress { position:relative; display:flex; align-items:center; justify-content:center; }
.wheel-progress-label { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.wheel-progress-label strong { font-family: var(--font-mono); font-size:26px; }
.wheel-progress-label span { font-size:11px; color: var(--ink-soft); max-width:90px; margin-top:2px; }

.grid-2 { display:grid; grid-template-columns: 1.3fr 1fr; gap: 20px; width:100%; margin-bottom: 20px; }
@media (max-width: 980px) { .grid-2 { grid-template-columns: 1fr; } }

.card { background: var(--paper-hi); border: none; border-radius: 24px; padding: 28px; width:100%; box-sizing:border-box; box-shadow: 0 2px 20px rgba(99,102,241,0.06); min-width: 0; transition: box-shadow 0.2s ease; }

/* ---- search/filter bar ---- */
.filter-bar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 18px; align-items:center; width:100%; }
.search-box { display:flex; align-items:center; gap:8px; background: var(--paper-hi); border: 1.5px solid var(--paper-line); border-radius: 6px; padding: 10px 14px; flex: 1; min-width: 200px; color: var(--ink-soft); }
.search-box input { border:none; background:none; outline:none; font-size:13.5px; color: var(--ink); flex:1; }
.chip-select { display:flex; gap:6px; flex-wrap:wrap; width:100%; margin-bottom:16px; }
.chip-opt { font-size:12px; font-weight:600; border:1.5px solid var(--paper-line); background: var(--paper-hi); color: var(--ink-soft); border-radius:20px; padding: 6px 14px; cursor:pointer; transition: all .12s ease; }
.chip-opt:hover { border-color: var(--ink); color: var(--ink); }
.chip-opt.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

/* ---- drive card / modal ---- */
.activity-card { background: var(--paper-hi); border: 1.5px solid var(--paper-line); border-radius: 6px; padding: 20px 22px; margin-bottom: 12px; position:relative; cursor:pointer; transition: border-color .15s ease, box-shadow .15s ease; width:100%; box-sizing:border-box; }
.activity-card:hover { border-color: var(--ink); box-shadow: 0 4px 16px -8px var(--shadow); }
.activity-card .top { display:flex; align-items:flex-start; justify-content:space-between; gap: 12px; }
.activity-card h4 { font-size: 15.5px; font-weight:600; margin:0; }
.activity-card .meta { display:flex; flex-wrap:wrap; gap: 14px; margin-top: 10px; font-size: 12.5px; color: var(--ink-soft); }
.activity-card .meta span { display:flex; align-items:center; gap:5px; }
.activity-card .desc { font-size: 13px; color: var(--ink-soft); margin-top: 10px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.activity-card .foot { display:flex; align-items:center; justify-content:space-between; margin-top: 16px; }
.cat-chip { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; color: var(--ink); background: var(--paper); border:1px solid var(--paper-line); border-radius: 20px; padding: 4px 10px 4px 8px; }
.soon-chip { font-family: var(--font-mono); font-size: 10.5px; color: var(--stamp); border: 1px solid var(--stamp); border-radius: 20px; padding: 3px 9px; }
.cap-meter { height: 5px; border-radius: 3px; background: var(--paper-line); overflow:hidden; margin-top:10px; width: 160px; }
.cap-meter i { display:block; height:100%; background: var(--moss); transition: width .3s ease; }
.cap-meter.full i { background: var(--stamp); }

.overlay { position:fixed; inset:0; background: rgba(20,20,20,.45); backdrop-filter: blur(2px); display:flex; align-items:flex-start; justify-content:center; z-index:100; padding: 6vh 16px; overflow-y:auto; }
.modal-box { background: var(--paper-hi); border: 1.5px solid var(--paper-line); border-radius: 6px; max-width: 620px; width:100%; box-shadow: 0 30px 60px -20px rgba(0,0,0,.5); animation: seva-pop .18s ease; }
@keyframes seva-pop { from { opacity:0; transform: translateY(8px) scale(.98); } to { opacity:1; transform:none; } }
.modal-head { display:flex; align-items:flex-start; justify-content:space-between; padding: 22px 24px 0; }
.modal-close { background:none; border:none; color: var(--ink-soft); cursor:pointer; padding:4px; }
.modal-body { padding: 14px 24px 24px; }
.modal-body h3 { font-size: 22px; margin-top: 10px; }
.modal-body .meta { display:flex; flex-wrap:wrap; gap: 16px; margin: 14px 0; font-size: 13px; color: var(--ink-soft); }
.modal-body .meta span { display:flex; align-items:center; gap:6px; }
.modal-body .desc { font-size: 14px; color: var(--ink-soft); line-height:1.6; }
.modal-foot { display:flex; align-items:center; justify-content:space-between; margin-top: 22px; padding-top:18px; border-top: 1px solid var(--paper-line); }

.stamp { display:inline-block; border:2px solid currentColor; border-radius:3px; padding:2px 10px; font-family: var(--font-mono); text-transform:uppercase; letter-spacing:.08em; font-size:10.5px; font-weight:600; transform:rotate(-4deg); position:relative; background: var(--paper-hi); }
.stamp::after { content:""; position:absolute; inset:2px; border:1px solid currentColor; border-radius:2px; opacity:.45; }
.stamp-moss { color: var(--moss); }
.stamp-brass { color: var(--brass); }
.stamp-red { color: var(--stamp); }
.stamp-ink { color: var(--ink-soft); }

.btn { display:inline-flex; align-items:center; gap:7px; font-size: 13px; font-weight:600; border-radius: 10px; padding: 9px 18px; cursor:pointer; border: 1.5px solid var(--paper-line); background: none; color: var(--ink); transition: all 0.2s ease; }
.btn-primary { background: linear-gradient(135deg, var(--accent) 0%, var(--violet) 100%); color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(99,102,241,0.35); }
.btn-primary:hover { filter: brightness(1.1); box-shadow: 0 6px 20px rgba(99,102,241,0.45); transform: translateY(-1px); }
.btn-outline { border-color: var(--accent); color: var(--accent); }
.btn-outline:hover { background: var(--accent); color: #fff; }
.btn-ghost { border-color: var(--paper-line); }
.btn-ghost:hover { border-color: var(--ink); }
.btn-danger { border-color: var(--stamp); color: var(--stamp); }
.btn-danger:hover { background: var(--stamp); color:#fff; }
.btn:disabled { opacity:.45; cursor:not-allowed; }
.btn-sm { padding: 6px 12px; font-size:12px; }
.btn-block { width:100%; justify-content:center; }

.tabs { display:flex; gap: 4px; border-bottom: 2px solid var(--paper-line); margin-bottom: 20px; overflow-x:auto; }
.tab { padding: 10px 4px; margin-right: 22px; background:none; border:none; border-bottom: 2.5px solid transparent; margin-bottom: -2px; font-size: 13.5px; font-weight:600; color: var(--ink-soft); cursor:pointer; white-space:nowrap; transition: color 0.2s ease; }
.tab:hover { color: var(--ink); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

.ledger-table { width:100%; border-collapse: separate; border-spacing: 0; font-size: var(--text-sm); }
.ledger-table th { text-align:left; font-family: var(--font-display); font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color: var(--ink-soft); padding: 12px 16px; border-bottom: 1px solid var(--paper-line); white-space:nowrap; position: sticky; top: 0; background: var(--paper-hi); z-index: 10; box-shadow: 0 1px 0 var(--paper-line); }
.ledger-table td { padding: 14px 16px; border-bottom: 1px solid var(--paper-line); vertical-align: middle; transition: all 0.2s ease; background: var(--paper-hi); }
.ledger-table tbody tr { transition: transform 0.2s ease; }
.ledger-table tbody tr:hover td { background: var(--paper); }
.ledger-table tbody tr:hover td:first-child { box-shadow: inset 3px 0 0 var(--ink); }
.seva-root[data-theme="dark"] .ledger-table tbody tr:hover td { background: rgba(255,255,255,.02); }
.ledger-table-wrap { width:100%; overflow-x:auto; position: relative; max-height: 500px; overflow-y: auto; }
.ledger-table td.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.rowno { font-family: var(--font-mono); color: var(--ink-soft); font-size:var(--text-xs); font-variant-numeric: tabular-nums; }
.status-badge { display:inline-flex; align-items:center; justify-content:center; padding:4px 10px; border-radius:20px; font-size:var(--text-xs); font-weight:700; font-family:var(--font-display); text-transform:uppercase; letter-spacing:0.05em; line-height:1; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
.status-badge.approved { background: linear-gradient(135deg, rgba(62,107,76,0.15), rgba(62,107,76,0.05)); color:var(--moss); border: 1px solid rgba(62,107,76,0.2); }
.status-badge.pending { background: linear-gradient(135deg, rgba(224,167,46,0.15), rgba(224,167,46,0.05)); color:var(--spark); border: 1px solid rgba(224,167,46,0.2); }
.status-badge.rejected { background: linear-gradient(135deg, rgba(158,43,54,0.15), rgba(158,43,54,0.05)); color:var(--stamp); border: 1px solid rgba(158,43,54,0.2); }
.table-progress-bar { width: 48px; height: 5px; background: var(--paper-line); border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; margin-left: 10px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
.table-progress-bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--moss), #528a64); transition: width 0.4s ease-out; }
.sortable-th { cursor: pointer; user-select: none; transition: color 0.2s ease; }
.sortable-th:hover { color: var(--ink); }
.sort-icon { display: inline-flex; align-items: center; margin-left: 4px; color: inherit; opacity: 0.6; }

.form-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width:640px){ .form-grid { grid-template-columns:1fr; } }
.field { display:flex; flex-direction:column; gap:7px; }
.field.full { grid-column: 1 / -1; }
.field label { font-size:12.5px; font-weight:600; color: var(--ink-soft); letter-spacing:.01em; }
.field input, .field textarea, .field select { border: 1.5px solid var(--paper-line); background: var(--paper); border-radius: 4px; padding: 10px 12px; font-size: 13.5px; color: var(--ink); width:100%; box-sizing:border-box; }
.field input:focus, .field textarea:focus, .field select:focus { border-color: var(--ink); outline: none; }
.field textarea { resize: vertical; min-height: 100px; }

.empty-state { text-align:center; padding: 50px 20px; color: var(--ink-soft); }
.empty-state .wheel-mark { margin: 0 auto 14px; opacity:.5; }
.empty-state h4 { font-size:15px; color: var(--ink); margin-bottom:6px; }
.empty-state p { font-size:13px; max-width:320px; margin: 0 auto; }

.toast-stack { position:fixed; bottom: 20px; right: 20px; display:flex; flex-direction:column; gap:10px; z-index: 200; width: 300px; }
.toast { background: var(--paper-hi); color: var(--ink); border-radius: 16px; padding: 14px 16px; font-size: 13px; box-shadow: 0 12px 32px -8px var(--shadow); border-left: 4px solid var(--accent); animation: seva-slide .25s ease; backdrop-filter: blur(8px); }
.toast.warn { border-left-color: var(--stamp); }
.toast.success { border-left-color: var(--moss); }
@keyframes seva-slide { from { transform: translateX(24px); opacity:0; } to { transform: translateX(0); opacity:1; } }

.leaderboard { display:flex; flex-direction:column; gap:2px; }
.lb-row { display:flex; align-items:center; gap: 12px; padding: 10px 6px; border-bottom: 1px solid var(--paper-line); }
.lb-rank { font-family: var(--font-mono); font-weight:700; width: 26px; color: var(--ink-soft); }
.lb-rank.top { color: var(--brass); }
.lb-name { flex:1; font-size:13.5px; }
.lb-name span { display:block; font-size:11.5px; color: var(--ink-soft); }
.lb-hrs { font-family: var(--font-mono); font-weight:600; font-size:14px; }

/* ---- certificate ---- */
.cert-card { background: var(--paper-hi); border: 2px solid var(--ink); border-radius: 4px; padding: 30px 32px; margin-bottom: 18px; position:relative; overflow:hidden; }
.cert-card::before { content:""; position:absolute; inset:8px; border: 1px dashed var(--paper-line); pointer-events:none; }
.cert-card .seal { position:absolute; top:20px; right:24px; }
.cert-card .eyebrow { color: var(--brass); }
.cert-card h4 { font-size: 23px; margin-top:6px; }
.cert-card p { font-size: 13px; color: var(--ink-soft); margin-top:8px; max-width:460px; }
.cert-card .sign { display:flex; justify-content:space-between; align-items:flex-end; margin-top:28px; flex-wrap:wrap; gap:12px; }
.cert-card .sign .line { border-top: 1px solid var(--ink-soft); padding-top:6px; font-size:11px; color: var(--ink-soft); width: 180px; }
.cert-card .vcode { font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-soft); letter-spacing:.05em; }

/* ---- perforated logbook stub ---- */
.stub { display:flex; gap:0; margin-bottom: 12px; border: 1.5px dashed var(--paper-line); border-radius: 4px; background: var(--paper-hi); position:relative; overflow:hidden; }
.stub .notch-col { width: 16px; flex-shrink:0; background-image: radial-gradient(circle, var(--paper) 3px, transparent 3.2px); background-size: 16px 18px; background-position: 4px 0; border-right: 1.5px dashed var(--paper-line); }
.stub .body { flex:1; padding: 14px 16px; display:flex; flex-wrap:wrap; align-items:center; gap: 14px; justify-content:space-between; }
.stub .info b { font-size: 13.5px; display:block; }
.stub .info .drive-note { font-size: 12px; color: var(--ink-soft); margin-top:3px; max-width: 340px; }
.stub .figures { display:flex; align-items:center; gap: 18px; }
.stub .hrs { font-family: var(--font-mono); font-size: 18px; font-weight:600; }
.stub .hrs span { display:block; font-size: 9.5px; color: var(--ink-soft); text-transform:uppercase; font-weight:400; }

/* ---- field heatmap ---- */
.field-wrap { display:flex; gap: 3px; overflow-x:auto; padding-bottom: 4px; }
.field-col { display:flex; flex-direction:column; gap:3px; }
.field-cell { width: 11px; height: 11px; border-radius: 2px; background: var(--paper-line); opacity:.5; }
.field-legend { display:flex; align-items:center; gap:6px; margin-top:10px; font-size: 11px; color: var(--ink-soft); }
.field-legend .field-cell { opacity:1; }

/* ---- sparkline ---- */
.spark-svg { display:block; }

/* ---- command palette ---- */
.cmdk-box { background: var(--paper-hi); border: 1.5px solid var(--paper-line); border-radius: 6px; width: 100%; max-width: 560px; margin-top: 8vh; box-shadow: 0 30px 70px -20px rgba(0,0,0,.55); overflow:hidden; animation: seva-pop .15s ease; }
.cmdk-input-row { display:flex; align-items:center; gap:10px; padding: 14px 18px; border-bottom: 1.5px solid var(--paper-line); }
.cmdk-input-row input { flex:1; border:none; background:none; outline:none; font-size:15px; color: var(--ink); }
.cmdk-results { max-height: 360px; overflow-y:auto; padding: 8px; }
.cmdk-group-label { font-family: var(--font-mono); font-size: 10.5px; text-transform:uppercase; letter-spacing:.08em; color: var(--ink-soft); padding: 8px 10px 4px; }
.cmdk-item { display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding: 9px 10px; border-radius: 4px; background:none; border:none; font-size: 13.5px; color: var(--ink); cursor:pointer; }
.cmdk-item:hover, .cmdk-item.sel { background: var(--paper-line); }
.cmdk-item .sub { color: var(--ink-soft); font-size: 11.5px; margin-left:auto; }
.cmdk-empty { padding: 30px; text-align:center; color: var(--ink-soft); font-size:13px; }

/* ---- approval swipe stack ---- */
.stack-wrap { display:flex; flex-direction:column; align-items:center; padding: 20px 0 40px; width:100%; }
.stack-progress { font-family: var(--font-mono); font-size: 12px; color: var(--ink-soft); margin-bottom: 20px; }
.stack-card-wrap { position:relative; width: 100%; max-width: 540px; min-height: 320px; }
.stack-ghost { position:absolute; inset:0; border: 1.5px solid var(--paper-line); border-radius: 10px; background: var(--paper-hi); }
.stack-ghost.g1 { transform: translateY(10px) scale(.97); opacity:.5; }
.stack-ghost.g2 { transform: translateY(20px) scale(.94); opacity:.3; }
.stack-card { position:relative; border: 1.5px solid var(--ink); border-radius: 10px; background: var(--paper-hi); padding: 28px 30px; box-shadow: 0 20px 40px -18px var(--shadow); animation: seva-pop .2s ease; }
.stack-card.leaving-approve { animation: swipe-right .3s ease forwards; }
.stack-card.leaving-reject { animation: swipe-left .3s ease forwards; }
@keyframes swipe-right { to { transform: translateX(120%) rotate(10deg); opacity:0; } }
@keyframes swipe-left { to { transform: translateX(-120%) rotate(-10deg); opacity:0; } }
.stack-card .who { display:flex; align-items:center; gap: 12px; margin-bottom: 16px; }
.stack-card h4 { font-size: 18px; font-weight:700; }
.stack-card .drivename { font-size: 13px; color: var(--ink-soft); margin-top:4px; }
.stack-card .hrs-big { font-family: var(--font-mono); font-size: 34px; font-weight:700; margin: 14px 0 6px; }
.stack-card .note-box { background: var(--paper); border: 1px solid var(--paper-line); border-radius: 4px; padding: 12px 14px; font-size: 13px; color: var(--ink-soft); margin: 10px 0 20px; }
.stack-actions { display:flex; gap: 12px; margin-top:20px; }
.stack-actions .btn { flex:1; justify-content:center; padding: 13px; font-size:14px; }
.stack-actions .kbd-hint { font-family: var(--font-mono); font-size: 10px; opacity:.6; margin-left: 6px; }
.reject-reason { margin-top: 14px; display:flex; gap:8px; }
.reject-reason input { flex:1; border:1.5px solid var(--paper-line); border-radius:4px; padding: 9px 11px; font-size:13px; background: var(--paper); color: var(--ink); }

/* ---- confetti ---- */
.confetti-layer { position:fixed; inset:0; pointer-events:none; z-index: 300; overflow:hidden; }
.confetti-piece { position:absolute; top:-20px; width: 8px; height: 14px; animation: confetti-fall linear forwards; }
@keyframes confetti-fall { to { transform: translateY(105vh) rotate(540deg); opacity: .9; } }
.badge-burst { position:fixed; inset:0; z-index: 290; display:flex; align-items:center; justify-content:center; pointer-events:none; }
.badge-burst-card { background: var(--ink); color: var(--paper); border-radius: 8px; padding: 26px 34px; text-align:center; box-shadow: 0 30px 70px -20px rgba(0,0,0,.6); animation: seva-pop .3s ease; pointer-events:auto; }
.badge-burst-card h4 { font-size: 20px; margin-top:10px; }
.badge-burst-card p { font-size:12.5px; color: rgba(242,236,217,.7); margin-top:6px; }

.sync-line { display:flex; align-items:center; gap:6px; font-size: 11.5px; color: var(--ink-soft); font-family: var(--font-mono); }

.loading-screen { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; background: var(--paper); color: var(--ink); }
.skeleton-block { background: linear-gradient(90deg, var(--paper-line) 25%, var(--paper-hi) 50%, var(--paper-line) 75%); background-size: 200% 100%; animation: seva-shimmer 1.4s infinite; border-radius: 4px; }
@keyframes seva-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 860px) {
  .shell { flex-direction: column; }
  .sidebar { width:100%; height:auto; flex-direction:row; align-items:center; overflow-x:auto; padding: 12px; position: static; }
  .sidebar-brand { padding: 4px 10px; }
  .sidebar-nav { flex-direction:row; overflow-y:visible; overflow-x:auto; }
  .sidebar-foot { flex-direction:row; border-top:none; border-left: 1px solid rgba(242,236,217,.18); margin: 0 0 0 8px; padding: 0 0 0 12px; flex-shrink:0; }
  .landing-hero h1 { font-size: 34px; }
  .role-picker { grid-template-columns: 1fr; }
  .stat-strip { flex-wrap:wrap; }
  .stat-strip .cell { flex: 1 1 50%; border-bottom: 1px solid var(--paper-line); }
  .grid-2 { grid-template-columns: 1fr; }
  .content { padding: 20px 16px 50px; }
  .topbar { padding: 14px 16px; }
  .topbar h2 { display:none; }
  .cmdk-trigger span.lbl-full { display:none; }
}
`;

/* ============================================================
   SMALL PRESENTATIONAL PIECES
   ============================================================ */

function WheelMark({ size = 34, spin = false }) {
  const spokes = Array.from({ length: 8 });
  return (
    <svg className={spin ? "wheel-mark spin" : "wheel-mark"} viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {spokes.map((_, i) => (
        <line key={i} x1="20" y1="20" x2="20" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="4.2" fill="currentColor" />
    </svg>
  );
}

function WheelProgress({ percent, value, label, size = 148, color = "var(--stamp)" }) {
  const r = size / 2 - 15;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, percent));
  const offset = c * (1 - clamped);
  const ticks = Array.from({ length: 12 });
  return (
    <div className="wheel-progress" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <g transform={`translate(${size / 2},${size / 2})`}>
          {ticks.map((_, i) => (
            <line key={i} x1="0" y1={-(r + 9)} x2="0" y2={-(r + 3)} stroke="var(--paper-line)" strokeWidth="2" transform={`rotate(${i * 30})`} />
          ))}
          <circle r={r} fill="none" stroke="var(--paper-line)" strokeWidth="9" />
          <circle r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90)" style={{ transition: "stroke-dashoffset .5s ease" }} />
        </g>
      </svg>
      <div className="wheel-progress-label"><strong>{value}</strong><span>{label}</span></div>
    </div>
  );
}

function Sparkline({ values, color = "var(--stamp)", width = 88, height = 28 }) {
  if (!values || values.length < 2) return <div style={{ height }} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg className="spark-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) * step} cy={height - ((values[values.length - 1] - min) / range) * (height - 4) - 2} r="2.5" fill={color} />
    </svg>
  );
}

const STATUS_MAP = {
  published: { text: "Published", cls: "stamp-moss" },
  pending_approval: { text: "Awaiting approval", cls: "stamp-brass" },
  rejected: { text: "Rejected", cls: "stamp-red" },
  completed: { text: "Completed", cls: "stamp-ink" },
  approved: { text: "Approved", cls: "stamp-moss" },
  pending: { text: "Pending", cls: "stamp-brass" },
};

function Stamp({ status }) {
  const m = STATUS_MAP[status] || { text: status, cls: "stamp-ink" };
  return <span className={`stamp ${m.cls}`}>{m.text}</span>;
}

function CategoryIcon({ name, size = 14 }) {
  const found = CATEGORIES.find((c) => c.name === name);
  const Icon = found ? found.icon : Sparkles;
  return <Icon size={size} />;
}

function EmptyState({ icon: Icon = ClipboardList, title, body }) {
  return (
    <div className="empty-state">
      <Icon size={30} className="wheel-mark" />
      <h4>{title}</h4>
      <p>{body}</p>
    </div>
  );
}

function ToastStack({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => <div key={t.id} className={`toast ${t.tone}`}>{t.message}</div>)}
    </div>
  );
}

/* ---- Field heatmap: a farmer's-almanac style contribution grid ---- */
function FieldHeatmap({ logs, weeks = 16 }) {
  const byDate = useMemo(() => {
    const map = {};
    logs.filter((l) => l.status === "approved").forEach((l) => { map[l.date] = (map[l.date] || 0) + l.hours; });
    return map;
  }, [logs]);
  const max = Math.max(1, ...Object.values(byDate));
  const totalDays = weeks * 7;
  const start = new Date(TODAY);
  start.setDate(start.getDate() - totalDays + 1);
  // align to Sunday
  start.setDate(start.getDate() - start.getDay());
  const cols = [];
  let cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      const hrs = byDate[iso] || 0;
      const inRange = cursor <= TODAY;
      col.push({ iso, hrs, inRange });
      cursor.setDate(cursor.getDate() + 1);
    }
    cols.push(col);
  }
  function cellColor(hrs, inRange) {
    if (!inRange) return "transparent";
    if (hrs <= 0) return "var(--paper-line)";
    const t = Math.min(1, hrs / max);
    const stops = ["#D8C68F", "#B98C3E", "#8A6A2E", "#5B4A22"];
    const idx = Math.min(stops.length - 1, Math.floor(t * stops.length));
    return stops[idx];
  }
  return (
    <div>
      <div className="field-wrap">
        {cols.map((col, i) => (
          <div className="field-col" key={i}>
            {col.map((cell, j) => (
              <div key={j} className="field-cell" title={cell.inRange ? `${fmtDateShort(cell.iso)} — ${cell.hrs} hrs` : ""}
                style={{ background: cellColor(cell.hrs, cell.inRange), opacity: cell.inRange ? 1 : 0 }} />
            ))}
          </div>
        ))}
      </div>
      <div className="field-legend">
        <span>Lighter field</span>
        <div className="field-cell" style={{ background: "var(--paper-line)" }} />
        <div className="field-cell" style={{ background: "#D8C68F" }} />
        <div className="field-cell" style={{ background: "#B98C3E" }} />
        <div className="field-cell" style={{ background: "#5B4A22" }} />
        <span>heavier harvest of hours</span>
      </div>
    </div>
  );
}

/* ---- Confetti burst on milestone ---- */
function ConfettiBurst() {
  const pieces = useMemo(() => {
    const colors = ["#9E2B36", "#A9812F", "#3E6B4C", "#E0A72E", "#1E2A44"];
    return Array.from({ length: 46 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 2 + Math.random() * 1.4,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
    }));
  }, []);
  return (
    <div className="confetti-layer">
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`, background: p.color,
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
          transform: `rotate(${p.rotate}deg)`,
        }} />
      ))}
    </div>
  );
}

function BadgeBurst({ label, onClose }) {
  return (
    <>
      <ConfettiBurst />
      <div className="badge-burst" onClick={onClose}>
        <div className="badge-burst-card">
          <Award size={34} color="var(--spark)" />
          <h4>Milestone reached</h4>
          <p>{label} unlocked</p>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 14, borderColor: "rgba(242,236,217,.4)", color: "inherit" }} onClick={onClose}>Continue</button>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   COMMAND PALETTE
   ============================================================ */

function CommandPalette({ open, onClose, session, db, setView, openDrive }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (open) { setQ(""); setTimeout(() => inputRef.current && inputRef.current.focus(), 30); } }, [open]);

  const navItems = NAV_ITEMS[session.role] || [];
  const navResults = navItems.filter((n) => n.label.toLowerCase().includes(q.toLowerCase()));
  const driveResults = q.trim()
    ? db.activities.filter((a) => a.title.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];
  const peopleResults = (session.role !== "student" && q.trim())
    ? db.students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
    : [];

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: "flex-start" }}>
      <div className="cmdk-box" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Search size={16} color="var(--ink-soft)" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to a section, drive, or volunteer…" />
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="cmdk-results">
          {navResults.length > 0 && (
            <>
              <div className="cmdk-group-label">Go to</div>
              {navResults.map((n) => (
                <button key={n.key} className="cmdk-item" onClick={() => { setView(n.key); onClose(); }}>
                  <n.icon size={15} /> {n.label}
                </button>
              ))}
            </>
          )}
          {driveResults.length > 0 && (
            <>
              <div className="cmdk-group-label">Drives</div>
              {driveResults.map((a) => (
                <button key={a.id} className="cmdk-item" onClick={() => { openDrive(a.id); onClose(); }}>
                  <CategoryIcon name={a.category} size={15} /> {a.title} <span className="sub">{fmtDateShort(a.date)}</span>
                </button>
              ))}
            </>
          )}
          {peopleResults.length > 0 && (
            <>
              <div className="cmdk-group-label">Volunteers</div>
              {peopleResults.map((s) => (
                <button key={s.id} className="cmdk-item" onClick={() => { setView(session.role === "admin" ? "departments" : "volunteers"); onClose(); }}>
                  <Users size={15} /> {s.name} <span className="sub">{s.dept}</span>
                </button>
              ))}
            </>
          )}
          {navResults.length === 0 && driveResults.length === 0 && peopleResults.length === 0 && (
            <div className="cmdk-empty">Nothing matches "{q}" — try a section name or a drive title.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DRIVE DETAIL MODAL
   ============================================================ */

function DriveModal({ activity, db, session, onClose, notify }) {
  if (!activity) return null;
  const staffName = (db.staffList.find((f) => f.id === activity.createdBy) || {}).name || "Coordinator";
  const full = activity.registered.length >= activity.maxVolunteers;
  const registered = session.role === "student" && activity.registered.includes(session.personaId);
  const dleft = daysUntil(activity.date);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="cat-chip"><CategoryIcon name={activity.category} /> {activity.category}</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Stamp status={activity.status} />
            {activity.status === "published" && dleft >= 0 && dleft <= 10 && (
              <span className="soon-chip">{dleft === 0 ? "Today" : `In ${dleft} day${dleft === 1 ? "" : "s"}`}</span>
            )}
          </div>
          <h3>{activity.title}</h3>
          <div className="meta">
            <span><Calendar size={14} /> {fmtDate(activity.date)}</span>
            <span><MapPin size={14} /> {activity.location}</span>
            <span><Clock size={14} /> {activity.hours} hrs credit</span>
            <span>Run by {staffName} · {activity.dept}</span>
          </div>
          <p className="desc">{activity.description}</p>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-soft)" }}>
              <span>{activity.registered.length} of {activity.maxVolunteers} spots filled</span>
              <span>{full ? "Full" : `${activity.maxVolunteers - activity.registered.length} open`}</span>
            </div>
            <div className={`cap-meter ${full ? "full" : ""}`} style={{ width: "100%" }}>
              <i style={{ width: `${Math.min(100, (activity.registered.length / activity.maxVolunteers) * 100)}%` }} />
            </div>
          </div>
          {session.role === "student" && activity.status === "published" && (
            <div className="modal-foot">
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Your coordinator is notified the moment you register.</span>
              {registered ? (
                <button className="btn btn-ghost" disabled>Registered</button>
              ) : full ? (
                <button className="btn btn-ghost" disabled>Drive is full</button>
              ) : (
                <button className="btn btn-primary" onClick={() => { notify.registerForActivity(session.personaId, activity.id); onClose(); }}>
                  Register <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
          {activity.registered.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--paper-line)" }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Registered Volunteers</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 150, overflowY: "auto", paddingRight: 8 }}>
                {activity.registered.map((vid) => {
                  const vol = db.students.find(s => s.id === vid);
                  if (!vol) return <div key={vid} className="vol-row">Unknown Volunteer ({vid.substring(0, 5)})</div>;
                  return (
                    <div key={vid} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, borderRadius: 8 }}>{initials(vol.name)}</div>
                      <div style={{ flex: 1, fontWeight: 500 }}>{vol.name}</div>
                      <div style={{ color: "var(--ink-soft)", fontSize: 11 }}>{vol.dept}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LANDING
   ============================================================ */

function Landing({ db, onEnter }) {
  const [pickedRole, setPickedRole] = useState(null);

  const totalHours = useMemo(
    () => db.hourLogs.filter((h) => h.status === "approved").reduce((s, h) => s + h.hours, 0),
    [db.hourLogs]
  );
  const activeDrives = db.activities.filter((a) => a.status === "published").length;
  const volunteers = db.students.length;

  const rosterByRole = {
    student: db.students.map((s) => ({ id: s.id, name: s.name, sub: `${s.dept} · Year ${s.year}` })),
    staff: db.staffList.map((s) => ({ id: s.id, name: s.name, sub: `${s.dept} Dept. Coordinator` })),
    admin: db.admins.map((a) => ({ id: a.id, name: a.name, sub: a.title })),
  };

  return (
    <div className="landing">
      <div className="landing-top">
        <div className="brand-lockup">
          <WheelMark className="spin" size={32} />
          <div>UNISERVE<small>NSS &amp; Community Service Register</small></div>
        </div>
      </div>

      {!pickedRole ? (
        <>
          <div className="landing-hero">
            <div className="eyebrow"><PenLine size={13} /> COMMUNITY SERVICE &amp; NSS ACTIVITY REGISTER</div>
            <h1>Not me, but you — logged, verified, counted.</h1>
            <p className="sub">
              One register for every drive, every hour, and every signature — replacing the
              paper logbook with a portal that coordinators, volunteers, and the program office
              actually share. Search it, sync it, sign off on it in seconds.
            </p>
            <div className="stat-strip">
              <div className="cell"><div className="num">{totalHours}</div><div className="lbl">Verified hours on record</div></div>
              <div className="cell"><div className="num">{activeDrives}</div><div className="lbl">Drives open for registration</div></div>
              <div className="cell"><div className="num">{volunteers}</div><div className="lbl">Registered volunteers</div></div>
            </div>
          </div>
          <div className="role-picker">
            <button className="role-card" onClick={() => setPickedRole("student")}>
              <div className="idx">ENTRY · 01</div>
              <h3>Volunteer Access</h3>
              <p>Browse drives, register, log your hours, and track your UNISERVE badges.</p>
              <div className="go">Enter as a volunteer <ChevronRight size={15} /></div>
            </button>
            <button className="role-card" onClick={() => setPickedRole("staff")}>
              <div className="idx">ENTRY · 02</div>
              <h3>Coordinator</h3>
              <p>Run drives, approve logged hours, and keep your department's ledger current.</p>
              <div className="go">Enter as a coordinator <ChevronRight size={15} /></div>
            </button>
            <button className="role-card" onClick={() => setPickedRole("admin")}>
              <div className="idx">ENTRY · 03</div>
              <h3>Program Admin</h3>
              <p>Approve new drives, oversee every department, and read the full ledger.</p>
              <div className="go">Enter as program admin <ChevronRight size={15} /></div>
            </button>
          </div>
        </>
      ) : (
        <div className="persona-panel">
          <button className="back" onClick={() => setPickedRole(null)}><ArrowLeft size={15} /> Choose a different entry point</button>
          <div className="persona-list">
            {rosterByRole[pickedRole].map((p) => (
              <button key={p.id} className="persona-btn" onClick={() => onEnter(pickedRole, p.id)}>
                <div className="avatar">{initials(p.name)}</div>
                <div className="who"><b>{p.name}</b><span>{p.sub}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SHARED SHELL
   ============================================================ */

const NAV_ITEMS = {
  student: [
    { key: "overview", label: "Overview", icon: Wallet },
    { key: "browse", label: "Browse drives", icon: Calendar },
    { key: "all_drives", label: "All drives", icon: ClipboardList },
    { key: "logbook", label: "My logbook", icon: BookOpen },
    { key: "certificates", label: "Certificates & badges", icon: Award },
    { key: "gallery", label: "Image gallery", icon: Image },
    { key: "virtual_id", label: "Virtual ID", icon: QrCode },
    { key: "profile", label: "Profile", icon: User },
  ],
  staff: [
    { key: "overview", label: "Overview", icon: Wallet },
    { key: "create", label: "Propose a drive", icon: Plus },
    { key: "manage", label: "Manage drives", icon: ClipboardList },
    { key: "approvals", label: "Approve hours", icon: FileCheck2 },
    { key: "volunteers", label: "Volunteers", icon: Users },
    { key: "coordinators", label: "Other Coordinators", icon: Building2 },
    { key: "gallery", label: "Gallery", icon: Image },
  ],
  admin: [
    { key: "overview", label: "Overview", icon: Wallet },
    { key: "approvals", label: "Approve drives", icon: ShieldCheck },
    { key: "manage", label: "Manage drives", icon: ClipboardList },
    { key: "coordinators", label: "Coordinators", icon: Building2 },
    { key: "volunteers", label: "Volunteers", icon: Users },
    { key: "gallery", label: "Gallery", icon: Image },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "broadcast", label: "Broadcast", icon: Megaphone },
    { key: "profile", label: "Profile", icon: User },
  ],
};

const ROLE_TITLE = { student: "Volunteer", staff: "Coordinator", admin: "Program Admin" };

function audienceMatches(audience, session) {
  if (audience === "all") return true;
  if (audience === "admins") return session.role === "admin";
  if (audience === `staff:${session.personaId}` && session.role === "staff") return true;
  if (audience === `student:${session.personaId}` && session.role === "student") return true;
  return false;
}

function Shell({ db, session, view, setView, onExit, notify, doSync, theme, toggleTheme }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [openDriveId, setOpenDriveId] = useState(null);
  const [dismissedEmergencies, setDismissedEmergencies] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`dismissedEmergencies_${session.personaId}`)) || []; }
    catch { return []; }
  });
  const notifRef = useRef(null);


  const person = useMemo(() => {
    const list = session.role === "student" ? db.students : session.role === "staff" ? db.staffList : db.admins;
    return list.find((p) => p.id === session.personaId);
  }, [db, session]);

  const filteredDb = useMemo(() => {
    if (!person || !person.unit) return db;
    const unit = person.unit;
    const staffInUnit = new Set(db.staffList.filter(s => s.unit === unit).map(s => s.id));
    const studentsInUnit = new Set(db.students.filter(s => s.unit === unit).map(s => s.id));
    
    return {
      ...db,
      students: db.students.filter(s => s.unit === unit),
      staffList: db.staffList.filter(s => s.unit === unit),
      admins: db.admins.filter(a => a.unit === unit),
      activities: db.activities.filter(a => staffInUnit.has(a.createdBy)),
      hourLogs: db.hourLogs.filter(h => studentsInUnit.has(h.studentId)),
    };
  }, [db, person]);

  if (!person) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', background: 'var(--paper)', minHeight: '100vh', color: 'var(--ink)' }}>
        <h2 style={{ color: 'var(--stamp)' }}>Error loading profile</h2>
        <p>The profile ID {session.personaId} could not be found in the loaded database for role {session.role}.</p>
        <p>Database dump:</p>
        <pre style={{ background: 'var(--paper-hi)', padding: 20, borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify({ 
            students: db.students.map(s => s.id), 
            staffList: db.staffList.map(s => s.id), 
            admins: db.admins.map(s => s.id) 
          }, null, 2)}
        </pre>
        <button className="btn btn-primary" onClick={() => { onExit(); window.location.reload(); }}>Sign out and try again</button>
      </div>
    );
  }

  const myNotifs = useMemo(
    () => [...db.notifications].filter((n) => audienceMatches(n.audience, session)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20),
    [db.notifications, session]
  );

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdkOpen((o) => !o); }
      if (e.key === "Escape") { setCmdkOpen(false); setNotifOpen(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const emergencyNotice = useMemo(() => {
    const e = myNotifs.find((n) => n.tone === "emergency" && n.sender_id !== person.id);
    if (e && !dismissedEmergencies.includes(e.id)) return e;
    return null;
  }, [myNotifs, dismissedEmergencies, person]);

  const items = NAV_ITEMS[session.role];
  const openDriveObj = openDriveId ? filteredDb.activities.find((a) => a.id === openDriveId) : null;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><WheelMark size={24} /> UNISERVE</div>
        <nav className="sidebar-nav">
          <div className="nav-group-title">Menu</div>
          {items.map((it) => (
            <button key={it.key} className={`nav-btn ${view === it.key ? "active" : ""}`} onClick={() => setView(it.key)}>
              <it.icon size={18} /> {it.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button onClick={toggleTheme}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light Mode" : "Dark Mode"}</button>
          <button onClick={onExit}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h2>
          
          <div style={{ flex: 1, maxWidth: 440, margin: "0 40px" }}>
             <button className="cmdk-trigger" onClick={() => setCmdkOpen(true)} style={{ width: "100%", justifyContent: "flex-start", padding: "12px 20px", background: "var(--paper-hi)", border: "none", borderRadius: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
               <span style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-soft)", fontSize: 14 }}><Search size={18} /> Search here...</span>
             </button>
          </div>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }} ref={notifRef}>
            <div className="right">
              <div className="icon-btn" onClick={() => setNotifOpen((o) => !o)} role="button" tabIndex={0} style={{ borderRadius: "50%", background: "var(--paper-hi)", border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", width: 44, height: 44 }}>
                <Bell size={20} color="var(--ink-soft)" />
                {myNotifs.length > 0 && <span className="dot">{myNotifs.length}</span>}
              </div>
              <div className="who-badge" style={{ gap: 12, marginLeft: 16 }}>
                <div className="who" style={{ textAlign: "right" }}>
                  <b style={{ fontSize: 14.5 }}>{person ? person.name : "—"}</b>
                  <span style={{ textTransform: "none", fontSize: 12 }}>{ROLE_TITLE[session.role]}</span>
                </div>
                <div className="avatar" style={{ borderRadius: 14, width: 44, height: 44, fontSize: 16 }}>{person ? initials(person.name) : "?"}</div>
              </div>
            </div>
            {notifOpen && (
              <div className="notif-drop">
                <div className="notif-header">Notifications</div>
              {myNotifs.length === 0 ? (
                <div className="empty">No notices yet — this is where drive approvals, hour sign-offs, and announcements show up.</div>
              ) : (
                myNotifs.map((n) => {
                  let Icon = Bell;
                  if (n.tone === "success") Icon = CheckCircle2;
                  if (n.tone === "warn") Icon = AlertCircle;
                  if (n.tone === "info") Icon = Info;
                  
                  const renderMessage = (msg) => {
                    const qIdx = msg.indexOf('"');
                    if (qIdx > 0) {
                      return <><strong style={{ fontWeight: 600 }}>{msg.substring(0, qIdx)}</strong>{msg.substring(qIdx)}</>;
                    }
                    const parts = msg.split(' ');
                    if (parts.length > 2) {
                      return <><strong style={{ fontWeight: 600 }}>{parts[0]} {parts[1]}</strong> {parts.slice(2).join(' ')}</>;
                    }
                    return <strong style={{ fontWeight: 600 }}>{msg}</strong>;
                  };

                  return (
                    <div key={n.id} className="item" data-tone={n.tone}>
                      <div className="item-icon" style={{ color: n.tone === "success" ? "var(--moss)" : n.tone === "warn" || n.tone === "emergency" ? "var(--stamp)" : "#3B82F6" }}>
                        <Icon size={16} />
                      </div>
                      <div className="item-content">
                        <div>{renderMessage(n.message)}</div>
                        <div className="t">{n.created_at ? new Date(n.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Just now"}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          </div>
        </div>

        <div className="content">
          {session.role === "student" && <StudentViews db={filteredDb} view={view} person={person} notify={notify} openDrive={setOpenDriveId} />}
          {session.role === "staff" && <StaffViews db={filteredDb} view={view} person={person} notify={notify} openDrive={setOpenDriveId} />}
          {session.role === "admin" && <AdminViews db={filteredDb} view={view} person={person} notify={notify} openDrive={setOpenDriveId} />}
        </div>
      </div>
      
      {emergencyNotice && (
        <div className="overlay" style={{ zIndex: 9999, background: "rgba(158, 43, 54, 0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-box" style={{ background: "var(--paper-hi)", border: "2px solid var(--stamp)", maxWidth: 500, animation: "seva-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
            <div className="modal-head" style={{ padding: "24px 30px 0" }}>
              <h3 style={{ color: "var(--stamp)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={24} /> URGENT ALERT
              </h3>
            </div>
            <div className="modal-body" style={{ padding: "20px 30px 30px" }}>
              <p style={{ fontSize: 16, color: "var(--ink)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                {emergencyNotice.message}
              </p>
              <div style={{ marginTop: 30, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button className="btn" onClick={() => {
                  const next = [...dismissedEmergencies, emergencyNotice.id];
                  setDismissedEmergencies(next);
                  localStorage.setItem(`dismissedEmergencies_${session.personaId}`, JSON.stringify(next));
                  notify.rejectEmergency(emergencyNotice, person);
                }} style={{ padding: "10px 24px", background: "transparent", border: "1px solid var(--paper-line)", color: "var(--ink-soft)" }}>Reject</button>
                <button className="btn btn-primary" onClick={() => {
                  const next = [...dismissedEmergencies, emergencyNotice.id];
                  setDismissedEmergencies(next);
                  localStorage.setItem(`dismissedEmergencies_${session.personaId}`, JSON.stringify(next));
                  notify.acknowledgeEmergency(emergencyNotice, person);
                }} style={{ padding: "10px 24px" }}>I Understand & Accept</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openDriveObj && <DriveModal activity={openDriveObj} db={filteredDb} session={session} onClose={() => setOpenDriveId(null)} notify={notify} />}
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} session={session} db={filteredDb} setView={setView} openDrive={(id) => { setView("browse"); setOpenDriveId(id); }} />
    </div>
  );
}

/* ============================================================
   STUDENT VIEWS
   ============================================================ */

function computeStudentHours(db, studentId) {
  return db.hourLogs.filter((h) => h.studentId === studentId && h.status === "approved").reduce((s, h) => s + h.hours, 0);
}

function monthlyTrend(logs, months = 6) {
  const buckets = {};
  logs.filter(h => h.status === "approved").forEach(h => {
    const k = monthKey(h.date);
    buckets[k] = (buckets[k] || 0) + h.hours;
  });
  
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d.toISOString().slice(0, 10));
    result.push({ day: k, hrs: buckets[k] || 0 });
  }
  return result;
}

function StudentViews({ db, view, person, notify, openDrive }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const hours = computeStudentHours(db, person.id);
  const myLogs = db.hourLogs.filter((h) => h.studentId === person.id);
  const approvedCount = myLogs.filter(h => h.status === 'approved').length;
  
  const nextMilestone = MILESTONES.find((m) => m.events > approvedCount) || null;
  const prevFloor = [0, ...MILESTONES.map((m) => m.events)].filter((e) => e <= approvedCount).pop() || 0;
  const percent = nextMilestone ? (approvedCount - prevFloor) / (nextMilestone.events - prevFloor) : 1;

  const myActivities = db.activities.filter((a) => a.registered.includes(person.id));
  const trend = monthlyTrend(myLogs);

  if (view === "overview") {
    const upcoming = myActivities.filter((a) => a.status === "published");
    const nextDrive = upcoming[0];
    const chartData = trend;
    const progressPercent = Math.round(percent * 100);
    const progressData = [
      { name: "Completed", value: progressPercent },
      { name: "Remaining", value: 100 - progressPercent }
    ];

    return (
      <>
        <div className="section-head" style={{ marginBottom: 24 }}>
          <div><h3 style={{ fontSize: 24, fontWeight: 700 }}>Welcome back, {person.name.split(' ')[0]}</h3><p className="hint">Here is your volunteer service overview.</p></div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 24 }}>
          <div className="stat-card" style={{ background: "var(--ink)", color: "var(--paper)" }}>
            <div className="lbl" style={{ color: "inherit", opacity: 0.7 }}>Total Hours</div>
            <div className="val">{hours}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Badges Earned</div>
            <div className="val">{MILESTONES.filter(m => m.events <= approvedCount).length}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Joined Drives</div>
            <div className="val">{myActivities.length}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Upcoming Drives</div>
            <div className="val">{upcoming.length}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.2fr)", gap: 24, marginBottom: 24 }} className="dashboard-middle">
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Weekly Activity</h4>
                <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>{hours} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-soft)" }}>hrs</span></div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "flex", alignItems: "flex-start", gap: 4 }}>
                <BarChart3 size={14} /> Bar Chart
              </div>
            </div>
            <div style={{ maxWidth: 500 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ left: -20, bottom: 0 }}
                  onMouseMove={(state) => {
                    if (state.isTooltipActive) setActiveIndex(state.activeTooltipIndex);
                    else setActiveIndex(-1);
                  }}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  <defs>
                    <linearGradient id="studentBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--stamp)" stopOpacity={1}/>
                      <stop offset="100%" stopColor="var(--stamp)" stopOpacity={0.5}/>
                    </linearGradient>
                    <linearGradient id="studentBarGradDim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--stamp)" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="var(--stamp)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--paper-line)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                  <Bar dataKey="hrs" radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={800} animationEasing="ease-out">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={activeIndex === -1 || activeIndex === index ? "url(#studentBarGrad)" : "url(#studentBarGradDim)"} style={{ transition: "fill 0.2s ease" }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ background: "var(--paper)" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Upcoming Drives</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(2)].map((_, i) => {
                const drive = upcoming[i];
                if (drive) {
                  return (
                    <div key={drive.id} style={{ background: "var(--paper-hi)", padding: 16, borderRadius: 16, border: "1px solid var(--paper-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>
                          <Calendar size={20} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{drive.title}</div>
                          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{fmtDate(drive.date)}</div>
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12, flexShrink: 0 }} onClick={() => openDrive(drive.id)}>View</button>
                    </div>
                  );
                } else {
                  return (
                    <div key={`empty-${i}`} style={{ background: "var(--paper-hi)", padding: 16, borderRadius: 16, border: "1px dashed var(--paper-line)", display: "flex", alignItems: "center", gap: 12, opacity: 0.7 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}>
                        <Calendar size={20} opacity={0.5} />
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>No drive scheduled. Browse to join!</div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 24 }} className="dashboard-bottom">
          <div className="card">
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Team Collaboration</h4>
            {nextDrive && nextDrive.registered.length > 0 ? (
               <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                 {nextDrive.registered.slice(0, 3).map(uid => {
                    const u = db.students.find(s => s.id === uid);
                    if(!u) return null;
                    return (
                      <div key={uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid var(--paper-line)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, borderRadius: 12 }}>{initials(u.name)}</div>
                          <div>
                            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{u.dept}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--moss)", background: "rgba(62,107,76,0.1)", padding: "4px 12px", borderRadius: 12 }}>Joined</div>
                      </div>
                    )
                 })}
               </div>
            ) : (
               <EmptyState icon={Users} title="No team members yet" body="Join a drive to see your peers." />
            )}
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, width: "100%", marginBottom: 10 }}>Progress</h4>
            <div style={{ position: "relative", width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={progressData} innerRadius={60} outerRadius={75} startAngle={90} endAngle={-270} dataKey="value" stroke="none" cornerRadius={10}>
                    <Cell fill="#6366F1" />
                    <Cell fill="rgba(128,128,128,0.15)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{progressPercent}%</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 10 }}>
              {nextMilestone ? `${approvedCount} / ${nextMilestone.events} events to next badge` : `${approvedCount} events (Max)`}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (view === "browse") {
    return <BrowseDrives db={db} person={person} notify={notify} openDrive={openDrive} />;
  }

  if (view === "logbook") {
    return <MyLogbook db={db} person={person} myActivities={myActivities} myLogs={myLogs} notify={notify} />;
  }

  if (view === "certificates") {
    return <Certificates person={person} myLogs={myLogs} db={db} />;
  }

  if (view === "gallery") {
    return <ImageGallery />;
  }

  if (view === "profile") {
    return <ProfileTab person={person} hours={hours} notify={notify} />;
  }

  if (view === "virtual_id") {
    return <VirtualIdTab person={person} />;
  }

  // Placeholder for new views
  return (
    <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-soft)" }}>
      <h3 style={{ fontSize: 20, color: "var(--ink)", marginBottom: 8 }}>Coming Soon</h3>
      <p>This section ({view}) is currently under construction.</p>
    </div>
  );
}

function ImageGallery() {
  const images = [
    "/gallery/media__1785515256704.jpg",
    "/gallery/media__1785515280363.jpg",
    "/gallery/media__1785515286939.jpg",
    "/gallery/media__1785515293587.jpg",
    "/gallery/media__1785515304065.jpg"
  ];
  return (
    <>
      <div className="section-head">
        <div><h3 style={{ fontSize: 24, fontWeight: 700 }}>Image Gallery</h3><p className="hint">Moments and memories from our community drives.</p></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {images.map((src, i) => (
          <div key={i} style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', background: 'var(--paper-hi)' }}>
            <img src={src} alt="Drive Event" style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
        ))}
      </div>
    </>
  );
}

function ProfileTab({ person, hours, notify, hideEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [regNo, setRegNo] = useState(person.reg_no || "");
  const [bloodGroup, setBloodGroup] = useState(person.blood_group || "");

  const handleSave = () => {
    notify.updateProfile(person.id, { reg_no: regNo, blood_group: bloodGroup });
    setIsEditing(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="section-head">
        <div><h3 style={{ fontSize: 24, fontWeight: 700 }}>Profile</h3><p className="hint">Your personal details and service record.</p></div>
        {!isEditing && !hideEdit && <button className="btn btn-outline" onClick={() => setIsEditing(true)}>Edit Profile</button>}
      </div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, borderRadius: 24 }}>{initials(person.name)}</div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{person.name}</h2>
            <div style={{ color: "var(--ink-soft)", marginTop: 4 }}>{person.email}</div>
          </div>
        </div>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label>Register Number</label>
              <input type="text" value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="e.g. 717821P123" />
            </div>
            <div className="field">
              <label>Blood Group</label>
              <input type="text" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} placeholder="e.g. O+ve" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              <button className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 16, background: "var(--paper-hi)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Register Number</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{person.reg_no || "PENDING"}</div>
            </div>
            <div style={{ padding: 16, background: "var(--paper-hi)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Blood Group</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: person.blood_group ? "inherit" : "var(--spark)" }}>{person.blood_group || "NOT SET"}</div>
            </div>
            <div style={{ padding: 16, background: "var(--paper-hi)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Department</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{person.dept || "N/A"}</div>
            </div>
            <div style={{ padding: 16, background: "var(--paper-hi)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Role</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Volunteer (Unit 1)</div>
            </div>
            <div style={{ padding: 16, background: "var(--paper-hi)", borderRadius: 12, gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Total Hours Logged</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--stamp)" }}>{hours} hrs</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VirtualIdTab({ person }) {
  const [flipped, setFlipped] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const token = person.verify_token || `verify-${person.id}`;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => setMousePos({ x: -1000, y: -1000 });

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="section-head" style={{ marginBottom: 40, justifyContent: 'center', textAlign: 'center' }}>
        <div><h3 style={{ fontSize: 24, fontWeight: 700 }}>Virtual ID</h3><p className="hint">Tap your card to reveal the verification QR.</p></div>
      </div>
      
      <div 
        style={{ perspective: 1000, cursor: 'pointer', width: '100%', aspectRatio: '1.586' }}
        onClick={() => setFlipped(!flipped)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ 
          width: '100%', height: '100%', position: 'relative', transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)', 
          transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
        }}>
          {/* FRONT */}
          <div style={{ 
            position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#fff'
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, transparent 54%)', pointerEvents: 'none' }} />
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.12), transparent 80%)`,
              opacity: mousePos.x !== -1000 ? 1 : 0, transition: 'opacity 0.3s ease'
            }} />
            
            <div style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: 'var(--brass)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>NSS</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--brass)', textTransform: 'uppercase' }}>National Service Scheme</div>
                  <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.05em' }}>Government of India</div>
                </div>
              </div>
              <ShieldCheck size={28} color="var(--brass)" strokeWidth={1.5} />
            </div>

            <div style={{ flex: 1, padding: '24px 30px', display: 'flex', gap: 24, alignItems: 'center' }}>
              <div className="avatar" style={{ width: 90, height: 90, borderRadius: 16, border: '2px solid rgba(255,255,255,0.2)', fontSize: 32, background: 'rgba(255,255,255,0.05)' }}>
                {initials(person.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{person.name}</div>
                <div style={{ fontSize: 13, color: 'var(--brass)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 12 }}>{person.unit || "NSS UNIT 1"}</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Reg No</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{person.reg_no || "PENDING"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Blood Group</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: person.blood_group ? "inherit" : "var(--spark)" }}>{person.blood_group || "NOT SET"}</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 30px', fontSize: 10, textAlign: 'center', letterSpacing: '0.05em', opacity: 0.7 }}>
              ISSUED: {new Date().getFullYear()} · VALID FOR CURRENT ACADEMIC YEAR
            </div>
          </div>

          {/* BACK */}
          <div style={{ 
            position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
            background: '#fff', borderRadius: 20, transform: 'rotateY(180deg)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: '#000', padding: 30
          }}>
             <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 20, border: '1px solid #e2e8f0' }}>
               <QRCode value={token} size={160} level="H" fgColor="#0f172a" />
             </div>
             <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Scan at drive to verify</div>
             <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontFamily: 'monospace' }}>{token.substring(0, 12)}...</div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--ink-soft)' }}>
        Do not screenshot. This QR changes dynamically for security.
      </div>
    </div>
  );
}

function BrowseDrives({ db, person, notify, openDrive }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const openDrives = db.activities.filter((a) => a.status === "published");
  const filtered = openDrives.filter((a) => {
    const matchesQ = !q.trim() || a.title.toLowerCase().includes(q.toLowerCase()) || a.location.toLowerCase().includes(q.toLowerCase());
    const matchesCat = cat === "all" || a.category === cat;
    return matchesQ && matchesCat;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <>
      <div className="section-head">
        <div><h3>Open drives</h3><p className="hint">Register for a drive — your coordinator is notified the moment you sign up.</p></div>
      </div>
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by drive or location…" />
        </div>
      </div>
      <div className="chip-select" style={{ marginBottom: 16 }}>
        <button className={`chip-opt ${cat === "all" ? "active" : ""}`} onClick={() => setCat("all")}>All categories</button>
        {CATEGORIES.map((c) => (
          <button key={c.name} className={`chip-opt ${cat === c.name ? "active" : ""}`} onClick={() => setCat(c.name)}>{c.name}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No drives match" body="Try a different search term or clear the category filter." />
      ) : (
        filtered.map((a) => {
          const registered = a.registered.includes(person.id);
          const full = a.registered.length >= a.maxVolunteers;
          const staffName = (db.staffList.find((f) => f.id === a.createdBy) || {}).name || "Coordinator";
          const dleft = daysUntil(a.date);
          return (
            <div className="activity-card" key={a.id} onClick={() => openDrive(a.id)}>
              <div className="top">
                <div>
                  <span className="cat-chip"><CategoryIcon name={a.category} /> {a.category}</span>
                  <h4 style={{ marginTop: 8 }}>{a.title}</h4>
                </div>
                {dleft >= 0 && dleft <= 10 ? <span className="soon-chip">{dleft === 0 ? "Today" : `In ${dleft}d`}</span> : <Stamp status={a.status} />}
              </div>
              <div className="meta">
                <span><Calendar size={13} /> {fmtDate(a.date)}</span>
                <span><MapPin size={13} /> {a.location}</span>
                <span><Clock size={13} /> {a.hours} hrs credit</span>
                <span><Users size={13} /> {a.registered.length}/{a.maxVolunteers} joined</span>
                <span>Run by {staffName}</span>
              </div>
              <p className="desc">{a.description}</p>
              <div className="foot">
                <div className={`cap-meter ${full ? "full" : ""}`}><i style={{ width: `${Math.min(100, (a.registered.length / a.maxVolunteers) * 100)}%` }} /></div>
                {registered ? (
                  <button className="btn btn-ghost" disabled>Registered</button>
                ) : full ? (
                  <button className="btn btn-ghost" disabled>Drive is full</button>
                ) : (
                  <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); notify.registerForActivity(person.id, a.id); }}>
                    Register <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

function MyLogbook({ db, person, myActivities, myLogs, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [activityId, setActivityId] = useState("");
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);

  const loggableActivities = myActivities.filter((a) => a.status === "published" || a.status === "completed");

  function submit(e) {
    e.preventDefault();
    if (!activityId || !hours || !photo) return;
    notify.submitHourLog(person.id, activityId, Number(hours), note, photo.name);
    setShowForm(false);
    setActivityId(""); setHours(""); setNote(""); setPhoto(null);
  }

  return (
    <>
      <div className="section-head">
        <div><h3>My logbook</h3><p className="hint">Submit hours for a drive you've joined — your coordinator approves before it counts.</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}><Plus size={14} /> Log hours</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label>Drive</label>
                <select value={activityId} onChange={(e) => setActivityId(e.target.value)} required>
                  <option value="">Select a drive you've joined</option>
                  {loggableActivities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Hours worked</label>
                <input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} required />
              </div>
              <div className="field full">
                <label>What did you do?</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Managed the registration desk for the morning shift." />
              </div>
              <div className="field full">
                <label>Verification Photo (Geotagged)</label>
                <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files[0])} required style={{ background: "var(--paper)", border: "1.5px dashed var(--paper-line)", padding: "20px", textAlign: "center", cursor: "pointer" }} />
                {photo && <div style={{ fontSize: 12, color: "var(--moss)", marginTop: 4 }}>Selected: {photo.name}</div>}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Submit for approval</button>
          </form>
        </div>
      )}

      {myLogs.length === 0 ? (
        <EmptyState icon={BookOpen} title="Your logbook is empty" body="Once you log hours for a drive, they'll appear here as a tear-off stub, stamped once approved." />
      ) : (
        <div>
          {myLogs.slice().reverse().map((h) => {
            const a = db.activities.find((x) => x.id === h.activityId);
            return (
              <div className="stub" key={h.id}>
                <div className="notch-col" />
                <div className="body">
                  <div className="info">
                    <b>{a ? a.title : "—"}</b>
                    <div className="drive-note">{h.note || "No note added."} · {fmtDateShort(h.date)}</div>
                  </div>
                  <div className="figures">
                    <div className="hrs">{h.hours}<span>hours</span></div>
                    <Stamp status={h.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Certificates({ person, myLogs, db }) {
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef(null);

  const approvedLogs = myLogs.filter(h => h.status === 'approved');
  const eventsCount = approvedLogs.length;
  const unlocked = MILESTONES.filter((m) => eventsCount >= m.events);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 3, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${person.name}-Certificate.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
    setIsDownloading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      <div className="section-head" style={{ marginBottom: 40 }}>
        <div>
          <h3 style={{ fontSize: 24, fontWeight: 700 }}>Certificates &amp; Badges</h3>
          <p className="hint">Your official credentials for completed and approved service events.</p>
        </div>
      </div>
      
      {approvedLogs.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" body="Complete drives and get your hours approved to earn certificates." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, marginBottom: 40 }}>
          {approvedLogs.map(log => {
            const drive = db.activities.find(a => a.id === log.activityId);
            return (
              <div key={log.id} style={{ maxWidth: 320 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{drive ? drive.title : 'Service Activity'}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{fmtDate(log.date)} • {log.hours} hours</div>
                  </div>
                </div>
                
                <div 
                  style={{ cursor: 'pointer', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                  onClick={() => setSelectedCertificate({ log, drive })}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(0, 100, 255, 0.15)">
                    <div style={{ position: 'relative', width: '100%', borderRadius: '2px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                      <img 
                        src="/certificate-template.png" 
                        alt="Certificate Template" 
                        style={{ width: '100%', height: 'auto', display: 'block' }} 
                      />
                      <div 
                        className="cert-name-pop"
                        style={{
                          position: 'absolute',
                          bottom: '45.5%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#00205B',
                          fontFamily: 'var(--font-display)',
                          whiteSpace: 'nowrap',
                          textShadow: '1px 1px 0px rgba(255,255,255,0.8)',
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}>
                        {person.name}
                      </div>
                    </div>
                  </SpotlightCard>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unlocked.length > 0 && (
        <div style={{ borderTop: '1px solid var(--paper-line)', paddingTop: 40, marginTop: 40 }}>
          <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Milestone Badges</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {unlocked.map((m) => (
              <div 
                key={m.events} 
                style={{ 
                  textAlign: 'center', 
                  padding: '32px 24px',
                  background: 'radial-gradient(circle at top, #2a2d36 0%, #1a1c23 100%)',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.4, maxWidth: 220 }}>
                  Congratulations! For maintaining<br/>
                  <strong style={{ color: '#fff', fontSize: 14 }}>{m.events} Events streak</strong>
                </div>
                
                <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 24 }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'var(--spark)', filter: 'blur(30px)', opacity: 0.15, borderRadius: '50%' }} />
                  <img 
                    src={m.image} 
                    alt={m.label} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain', 
                      position: 'relative',
                      mixBlendMode: 'screen',
                      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3)) contrast(1.1) brightness(1.2)'
                    }} 
                  />
                </div>
                
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{m.label}</h4>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  TECHNova
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {MILESTONES.filter((m) => eventsCount < m.events).length > 0 && (
        <div className="card" style={{ marginTop: 20, maxWidth: 500, margin: "20px auto 0" }}>
          <h4 style={{ fontSize: 13.5, marginBottom: 12, textAlign: "center" }}>Next up</h4>
          {MILESTONES.filter((m) => eventsCount < m.events).map((m) => (
            <div key={m.events} style={{ fontSize: 13, color: "var(--ink-soft)", padding: "8px 0", borderBottom: "1px solid var(--paper-line)", display: "flex", justifyContent: "space-between" }}>
              <span>{m.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{m.events - eventsCount} events to go</span>
            </div>
          ))}
        </div>
      )}

      {selectedCertificate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <button 
            onClick={() => setSelectedCertificate(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <XCircle size={32} />
          </button>

          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-primary"
            style={{
              position: 'absolute',
              bottom: '40px',
              padding: '12px 24px',
              fontSize: '15px',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transition: 'transform 0.2s, background 0.2s',
              opacity: isDownloading ? 0.7 : 1,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              zIndex: 10
            }}
            onMouseEnter={(e) => { if(!isDownloading) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { if(!isDownloading) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Download size={18} />
            {isDownloading ? 'Generating...' : 'Download Certificate'}
          </button>

          <div 
            ref={certificateRef}
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '800px',
              backgroundColor: '#fff', 
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <img 
              src="/certificate-template.png" 
              alt="Certificate Template" 
              style={{ width: '100%', height: 'auto', display: 'block' }} 
            />
            <div style={{
              position: 'absolute',
              bottom: '45.5%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(20px, 4vw, 36px)',
              fontWeight: 700,
              color: '#00205B',
              fontFamily: 'var(--font-display)',
              whiteSpace: 'nowrap',
              textShadow: '1px 1px 0px rgba(255,255,255,0.8)'
            }}>
              {person.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STAFF VIEWS
   ============================================================ */

function StaffViews({ db, view, person, notify, openDrive }) {
  const myActivities = db.activities.filter((a) => a.createdBy === person.id);
  const pendingLogs = db.hourLogs.filter((h) => {
    const a = db.activities.find((x) => x.id === h.activityId);
    return a && a.createdBy === person.id && h.status === "pending";
  });

  if (view === "overview") {
    const published = myActivities.filter((a) => a.status === "published" || a.status === "completed");
    const totalVolunteers = new Set(myActivities.flatMap((a) => a.registered)).size;
    const chartData = myActivities.map((a) => ({ name: a.title.slice(0, 14) + (a.title.length > 14 ? "…" : ""), joined: a.registered.length, cap: a.maxVolunteers }));
    const nextLog = pendingLogs[0];

    return (
      <>
        <div className="section-head" style={{ marginBottom: 24 }}>
          <div><h3 style={{ fontSize: 24, fontWeight: 700 }}>{person.dept} Department Desk</h3><p className="hint">Drives you run and volunteer sign-ups awaiting your approval.</p></div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 24 }}>
          <div className="stat-card" style={{ background: "#0f172a", color: "#fff" }}>
            <div className="lbl" style={{ color: "rgba(255,255,255,0.7)" }}>Drives Run</div>
            <div className="val">{myActivities.length}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Published / Live</div>
            <div className="val">{published.length}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Volunteers Engaged</div>
            <div className="val">{totalVolunteers}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Hour Logs to Review</div>
            <div className="val" style={{ color: pendingLogs.length ? "var(--stamp)" : "inherit" }}>{pendingLogs.length}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1fr)", gap: 24, marginBottom: 24 }} className="dashboard-middle">
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h4 style={{ fontSize: 16, fontWeight: 600 }}>Sign-ups by Drive</h4>
            </div>
            {chartData.length === 0 ? <EmptyState title="No drives yet" body="Propose your first drive to see sign-up data here." /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--paper-line)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", background: "var(--paper-hi)", color: "var(--ink)" }} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                  <Bar dataKey="joined" fill="var(--ink)" radius={[6, 6, 0, 0]} barSize={24} name="Registered" />
                  <Bar dataKey="cap" fill="var(--paper-line)" radius={[6, 6, 0, 0]} barSize={24} name="Capacity" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card" style={{ background: "var(--paper)" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Pending Action</h4>
            {nextLog ? (
              <div style={{ background: "var(--paper-hi)", padding: 20, borderRadius: 16, border: "1px solid var(--paper-line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>
                    <ClipboardList size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Log Approval</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{nextLog.hours} hrs requested</div>
                  </div>
                </div>
                <button className="btn btn-primary btn-block" onClick={() => notify.approveHourLog(nextLog.id)}>Approve Fast</button>
              </div>
            ) : (
               <EmptyState icon={FileCheck2} title="All caught up" body="No hour logs to approve." />
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)", gap: 24 }} className="dashboard-bottom">
          <div className="card">
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Recent Volunteers</h4>
            {myActivities.length === 0 ? <EmptyState icon={Users} title="No volunteers" body="No one has joined your drives yet." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Array.from(new Set(myActivities.flatMap(a => a.registered))).slice(0, 3).map(uid => {
                  const u = db.students.find(s => s.id === uid);
                  if(!u) return null;
                  return (
                    <div key={uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid var(--paper-line)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, borderRadius: 12 }}>{initials(u.name)}</div>
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{u.dept}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", background: "rgba(30,42,68,0.1)", padding: "4px 12px", borderRadius: 12 }}>Active</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, width: "100%", marginBottom: 30 }}>Pending Queue</h4>
            <WheelProgress percent={pendingLogs.length === 0 ? 1 : 0.4} value={pendingLogs.length} label={"pending logs"} color="var(--ink)" />
          </div>
          <div className="card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Quick Broadcast</h4>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>Notify your volunteers</div>
              <input type="text" id="staff-broadcast-input" placeholder="Type a message..." style={{ width: "100%", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }} />
            </div>
            <button className="btn" onClick={async () => {
              const input = document.getElementById("staff-broadcast-input");
              if (!input.value) return;
              await supabase.from("notifications").insert({ audience: `staff:${person.id}`, message: input.value, tone: "info" });
              input.value = "";
              alert("Broadcast sent!");
            }} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "100%", marginTop: 24, padding: "12px" }}>Send Now</button>
          </div>
        </div>
      </>
    );
  }

  if (view === "create") return <CreateActivity person={person} notify={notify} />;
  if (view === "manage") return <ManageActivities db={db} myActivities={myActivities} notify={notify} openDrive={openDrive} />;
  if (view === "approvals") return <ApproveHourLogs db={db} pendingLogs={pendingLogs} notify={notify} />;
  if (view === "volunteers") return <VolunteerDirectory db={db} myActivities={myActivities} />;
  if (view === "coordinators") return <CoordinatorsView db={db} />;
  if (view === "gallery") return <ImageGallery />;
  return null;
}

function CreateActivity({ person, notify }) {
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0].name, date: "", location: "", description: "", maxVolunteers: 30, hours: 3 });
  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function submit(e) {
    e.preventDefault();
    if (!form.title || !form.date || !form.location) return;
    notify.createActivity(person, { ...form, maxVolunteers: Number(form.maxVolunteers), hours: Number(form.hours) });
    setForm({ title: "", category: CATEGORIES[0].name, date: "", location: "", description: "", maxVolunteers: 30, hours: 3 });
  }
  return (
    <>
      <div className="section-head"><div><h3>Propose a drive</h3><p className="hint">Goes to the program admin for approval before it's visible to volunteers.</p></div></div>
      <div className="card" style={{ maxWidth: 760 }}>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field full">
              <label>Drive title</label>
              <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Ward 12 Cleanliness Drive" required />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
            </div>
            <div className="field">
              <label>Location</label>
              <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Venue or area" required />
            </div>
            <div className="field">
              <label>Hours credited</label>
              <input type="number" min="1" value={form.hours} onChange={(e) => update("hours", e.target.value)} />
            </div>
            <div className="field">
              <label>Volunteer capacity</label>
              <input type="number" min="1" value={form.maxVolunteers} onChange={(e) => update("maxVolunteers", e.target.value)} />
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What will volunteers actually do?" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Send for admin approval</button>
        </form>
      </div>
    </>
  );
}

function ManageActivities({ db, myActivities, notify, openDrive }) {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? myActivities : myActivities.filter((a) => a.status === tab);
  return (
    <>
      <div className="section-head"><div><h3>Manage your drives</h3><p className="hint">Mark a published drive complete once it has taken place.</p></div></div>
      <div className="tabs">
        {["all", "pending_approval", "published", "completed", "rejected"].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "all" ? "All" : STATUS_MAP[t] ? STATUS_MAP[t].text : t}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" body="Drives you propose will show up in this list." />
      ) : (
        filtered.map((a) => (
          <div className="activity-card" key={a.id} style={{ cursor: "pointer" }} onClick={() => openDrive(a.id)}>
            <div className="top">
              <div>
                <span className="cat-chip"><CategoryIcon name={a.category} /> {a.category}</span>
                <h4 style={{ marginTop: 8 }}>{a.title}</h4>
              </div>
              <Stamp status={a.status} />
            </div>
            <div className="meta">
              <span><Calendar size={13} /> {fmtDate(a.date)}</span>
              <span><MapPin size={13} /> {a.location}</span>
              <span><Users size={13} /> {a.registered.length}/{a.maxVolunteers} joined</span>
            </div>
            {a.status === "published" && (
              <div className="foot">
                <span></span>
                <button className="btn btn-ghost btn-sm" onClick={() => notify.completeActivity(a.id)}>Mark as completed</button>
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}

function ApproveHourLogs({ db, pendingLogs, notify }) {
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [sortKey, setSortKey] = useState("studentName");
  const [sortAsc, setSortAsc] = useState(true);

  const list = pendingLogs.map(h => {
    const student = db.students.find(s => s.id === h.studentId) || {};
    const a = db.activities.find(x => x.id === h.activityId) || {};
    return { ...h, studentName: student.name || "—", driveTitle: a.title || "—" };
  });

  list.sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };
  const SortIcon = ({ col }) => sortKey === col ? <span className="sort-icon">{sortAsc ? "↑" : "↓"}</span> : null;

  return (
    <>
      <div className="section-head"><div><h3>Approve logged hours</h3><p className="hint">Approving adds the hours to a volunteer's total and may unlock a badge.</p></div></div>
      {list.length === 0 ? (
        <EmptyState icon={FileCheck2} title="Nothing awaiting review" body="Hour logs volunteers submit for your drives will appear here." />
      ) : (
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>No.</th>
                <th className="sortable-th" onClick={() => handleSort('studentName')}>Volunteer <SortIcon col="studentName" /></th>
                <th className="sortable-th" onClick={() => handleSort('driveTitle')}>Drive <SortIcon col="driveTitle" /></th>
                <th className="sortable-th" onClick={() => handleSort('hours')}>Hours <SortIcon col="hours" /></th>
                <th>Proof</th>
                <th>Note</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((h, i) => (
                  <tr key={h.id}>
                    <td className="rowno">{String(i + 1).padStart(3, "0")}</td>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{h.studentName}</td>
                    <td>{h.driveTitle}</td>
                    <td className="rowno">
                      <span className="status-badge pending" style={{ display: "inline-flex", gap: 4 }}>
                        <Clock size={12} /> {h.hours} hrs
                      </span>
                    </td>
                    <td>
                      {h.photoUrl ? (
                        <a href="#" style={{ color: "var(--moss)", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 12, fontWeight: 600 }} onClick={(e) => { e.preventDefault(); alert("Viewing photo verification: " + h.photoUrl); }}>
                          <Image size={14} /> View
                        </a>
                      ) : (
                        <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 200, color: "var(--ink-soft)" }}>{h.note}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => notify.approveHourLog(h.id)}><Check size={12} /> Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setRejecting(h.id)}><X size={12} /> Reject</button>
                      </div>
                      {rejecting === h.id && (
                        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                          <input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} style={{ fontSize: 12, padding: "5px 8px", border: "1.5px solid var(--paper-line)", borderRadius: 3, flex: 1, background: "var(--paper)", color: "var(--ink)" }} />
                          <button className="btn btn-danger btn-sm" onClick={() => { notify.rejectHourLog(h.id, reason || "No reason given."); setRejecting(null); setReason(""); }}>Confirm</button>
                        </div>
                      )}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function VolunteerDirectory({ db, myActivities }) {
  const [sortKey, setSortKey] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const ids = new Set(myActivities.flatMap((a) => a.registered));
  const list = db.students.filter((s) => ids.has(s.id)).map(s => ({ ...s, hours: computeStudentHours(db, s.id) }));

  list.sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ col }) => sortKey === col ? <span className="sort-icon">{sortAsc ? "↑" : "↓"}</span> : null;

  return (
    <>
      <div className="section-head"><div><h3>Volunteers on your drives</h3><p className="hint">Everyone currently registered across drives you run.</p></div></div>
      {list.length === 0 ? (
        <EmptyState icon={Users} title="No volunteers yet" body="Once people register for your drives, they'll be listed here." />
      ) : (
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>No.</th>
                <th className="sortable-th" onClick={() => handleSort('name')}>Name <SortIcon col="name" /></th>
                <th className="sortable-th" onClick={() => handleSort('dept')}>Department <SortIcon col="dept" /></th>
                <th className="sortable-th" onClick={() => handleSort('year')}>Year <SortIcon col="year" /></th>
                <th className="sortable-th" onClick={() => handleSort('hours')}>Verified hours <SortIcon col="hours" /></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s, i) => (
                <tr key={s.id} onClick={() => setSelectedUser(s)} style={{ cursor: "pointer" }} className="hoverable-row">
                  <td className="rowno">{String(i + 1).padStart(3, "0")}</td>
                  <td style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</td>
                  <td>{s.dept}</td>
                  <td>{s.year}</td>
                  <td className="rowno">
                    <span style={{ display: "inline-block", width: 20 }}>{s.hours}</span>
                    <div className="table-progress-bar"><i style={{ width: `${Math.min((s.hours / 50) * 100, 100)}%` }} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedUser && (
        <UserProgressModal user={selectedUser} role="student" db={db} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}

/* ============================================================
   ADMIN VIEWS
   ============================================================ */

const PIE_COLORS = ["#9E2B36", "#A9812F", "#3E6B4C", "#1E2A44", "#56607A", "#C9BE9D", "#7A5230"];

function AdminViews({ db, view, person, notify, openDrive }) {
  const pendingActivities = db.activities.filter((a) => a.status === "pending_approval");
  const totalHours = db.hourLogs.filter((h) => h.status === "approved").reduce((s, h) => s + h.hours, 0);
  const publishedCount = db.activities.filter((a) => a.status === "published" || a.status === "completed").length;

  if (view === "overview") {
    const deptHours = DEPARTMENTS.map((d) => ({
      dept: d,
      hrs: db.students.filter((s) => s.dept === d).reduce((sum, s) => sum + computeStudentHours(db, s.id), 0),
    }));
    const nextPending = pendingActivities[0];

    return (
      <>
        <div className="section-head" style={{ marginBottom: 24 }}>
          <div><h3 style={{ fontSize: 24, fontWeight: 700 }}>Program Overview</h3><p className="hint">Institution-wide standing across every department.</p></div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 24 }}>
          <div className="stat-card" style={{ background: "#0f172a", color: "#fff" }}>
            <div className="lbl" style={{ color: "rgba(255,255,255,0.7)" }}>Verified Hours</div>
            <div className="val">{totalHours}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Live Drives</div>
            <div className="val">{publishedCount}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Registered Volunteers</div>
            <div className="val">{db.students.length}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Awaiting Approval</div>
            <div className="val" style={{ color: pendingActivities.length ? "var(--stamp)" : "inherit" }}>{pendingActivities.length}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1fr)", gap: 24, marginBottom: 24 }} className="dashboard-middle">
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h4 style={{ fontSize: 16, fontWeight: 600 }}>Hours by Department</h4>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptHours} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--paper-line)" vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", background: "var(--paper-hi)", color: "var(--ink)" }} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                <Bar dataKey="hrs" fill="var(--ink)" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ background: "var(--paper)" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Next Pending Drive</h4>
            {nextPending ? (
              <div style={{ background: "var(--paper-hi)", padding: 20, borderRadius: 16, border: "1px solid var(--paper-line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextPending.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{nextPending.dept}</div>
                  </div>
                </div>
                <button className="btn btn-primary btn-block" onClick={() => notify.approveActivity(nextPending.id)}>Approve Drive</button>
              </div>
            ) : (
               <EmptyState icon={ShieldCheck} title="All caught up" body="No drives are waiting on your sign-off." />
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)", gap: 24 }} className="dashboard-bottom">
          <div className="card">
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Top Volunteers</h4>
            <Leaderboard db={db} limit={3} />
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, width: "100%", marginBottom: 30 }}>Program Engagement</h4>
            <WheelProgress percent={Math.min(1, totalHours / 1000)} value={totalHours} label={"hrs this yr"} color="var(--ink)" />
          </div>
          <div className="card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Quick Broadcast</h4>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>Reach all users instantly</div>
              <input type="text" id="admin-broadcast-input" placeholder="Type a message..." style={{ width: "100%", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }} />
            </div>
            <button className="btn" onClick={async () => {
              const input = document.getElementById("admin-broadcast-input");
              if (!input.value) return;
              await notify.broadcast(person, input.value.trim(), false);
              input.value = "";
            }} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "100%", marginTop: 24, padding: "12px" }}>Send Now</button>
          </div>
        </div>
      </>
    );
  }

  if (view === "approvals") return <AdminApprovalsView db={db} pendingActivities={pendingActivities} notify={notify} />;
  if (view === "manage") return <AdminManageDrives db={db} notify={notify} openDrive={openDrive} />;
  if (view === "coordinators") return <CoordinatorsView db={db} />;
  if (view === "volunteers") return <AdminVolunteersView db={db} />;
  if (view === "profile") return <AdminProfile person={person} notify={notify} />;
  if (view === "analytics") return <Analytics db={db} />;
  if (view === "broadcast") return <Broadcast person={person} notify={notify} />;
  if (view === "gallery") return <ImageGallery />;
  return null;
}

function Leaderboard({ db, limit = 10 }) {
  const ranked = db.students.map((s) => ({ ...s, hrs: computeStudentHours(db, s.id) })).sort((a, b) => b.hrs - a.hrs).slice(0, limit);
  return (
    <div className="leaderboard">
      {ranked.map((s, i) => (
        <div className="lb-row" key={s.id}>
          <div className={`lb-rank ${i < 3 ? "top" : ""}`}>{String(i + 1).padStart(2, "0")}</div>
          <div className="lb-name">{s.name}<span>{s.dept} · Year {s.year}</span></div>
          <div className="lb-hrs">{s.hrs} hrs</div>
        </div>
      ))}
    </div>
  );
}

function AdminApprovalsView({ db, pendingActivities, notify }) {
  const [tab, setTab] = useState("pending");
  const acceptedActivities = db.activities.filter((a) => a.status === "published" || a.status === "completed");
  const rejectedActivities = db.activities.filter((a) => a.status === "rejected");

  return (
    <>
      <div className="section-head" style={{ marginBottom: 16 }}>
        <div><h3 style={{ fontSize: 24, fontWeight: 700 }}>Approve Drives</h3><p className="hint">Review proposed drives and see past decisions.</p></div>
      </div>
      <div className="tabs" style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--paper-line)', paddingBottom: 12 }}>
        <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')} style={{ background: 'transparent', border: 'none', color: tab === 'pending' ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: tab === 'pending' ? 600 : 400, cursor: 'pointer', padding: 0 }}>Pending ({pendingActivities.length})</button>
        <button className={`tab-btn ${tab === 'accepted' ? 'active' : ''}`} onClick={() => setTab('accepted')} style={{ background: 'transparent', border: 'none', color: tab === 'accepted' ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: tab === 'accepted' ? 600 : 400, cursor: 'pointer', padding: 0 }}>Accepted ({acceptedActivities.length})</button>
        <button className={`tab-btn ${tab === 'rejected' ? 'active' : ''}`} onClick={() => setTab('rejected')} style={{ background: 'transparent', border: 'none', color: tab === 'rejected' ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: tab === 'rejected' ? 600 : 400, cursor: 'pointer', padding: 0 }}>Rejected ({rejectedActivities.length})</button>
      </div>
      {tab === "pending" && <ApproveActivities db={db} pendingActivities={pendingActivities} notify={notify} hideHeader />}
      {tab === "accepted" && <ActivityList db={db} activities={acceptedActivities} emptyText="No accepted drives." />}
      {tab === "rejected" && <ActivityList db={db} activities={rejectedActivities} emptyText="No rejected drives." />}
    </>
  );
}

function ActivityList({ db, activities, emptyText }) {
  if (activities.length === 0) return <EmptyState icon={ShieldCheck} title={emptyText} body="They will appear here once reviewed." />;
  return (
    <div className="ledger-table-wrap">
      <table className="ledger-table">
        <thead><tr><th>Title</th><th>Category</th><th>Coordinator</th><th>Date</th></tr></thead>
        <tbody>
          {activities.map(a => {
            const staff = db.staffList.find(s => s.id === a.createdBy);
            return (
              <tr key={a.id}>
                <td style={{ fontWeight: 500 }}>{a.title}</td>
                <td><span className="cat-chip" style={{ zoom: 0.8 }}><CategoryIcon name={a.category} /> {a.category}</span></td>
                <td>{staff ? staff.name : "Unknown"}</td>
                <td className="rowno">{fmtDate(a.date)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Admin: Manage all drives ---- */
function AdminManageDrives({ db, notify, openDrive }) {
  const [tab, setTab] = useState("all");
  const allActivities = db.activities;
  const filtered = tab === "all" ? allActivities : allActivities.filter((a) => a.status === tab);

  return (
    <>
      <div className="section-head">
        <div><h3>Manage all drives</h3><p className="hint">View, track, and complete all drives across every coordinator.</p></div>
      </div>
      <div className="tabs">
        {["all", "pending_approval", "published", "completed", "rejected"].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "all" ? "All" : STATUS_MAP[t] ? STATUS_MAP[t].text : t}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No drives here" body="Drives matching this filter will appear here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((a) => {
            const coordinator = db.staffList.find((s) => s.id === a.createdBy);
            const { text: statusText, color: statusColor } = STATUS_MAP[a.status] || { text: a.status, color: "var(--ink-soft)" };
            return (
              <div key={a.id} style={{ background: "var(--paper-hi)", padding: 16, borderRadius: 16, border: "1px solid var(--paper-line)", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3 }}>
                    {coordinator ? coordinator.name : "Unknown coordinator"} · {fmtDate(a.date)} · {a.location}
                  </div>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: statusColor + "22", color: statusColor, flexShrink: 0 }}>{statusText}</span>
                {a.status === "published" && (
                  <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12, flexShrink: 0 }} onClick={() => notify.completeActivity(a.id)}>Mark Complete</button>
                )}
                <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12, flexShrink: 0 }} onClick={() => openDrive(a.id)}>View</button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---- swipeable, keyboard-driven approval stack ---- */
function ApproveActivities({ db, pendingActivities, notify, hideHeader }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [leaving, setLeaving] = useState(null);
  const current = pendingActivities[0];

  const act = useCallback((kind) => {
    if (!current || leaving) return;
    if (kind === "reject" && !rejecting) { setRejecting(true); return; }
    setLeaving(kind);
    setTimeout(() => {
      if (kind === "approve") notify.approveActivity(current.id);
      else notify.rejectActivity(current.id, reason || "No reason given.");
      setLeaving(null); setRejecting(false); setReason("");
    }, 260);
  }, [current, leaving, rejecting, reason, notify]);

  useEffect(() => {
    function onKey(e) {
      if (rejecting) return;
      if (e.key.toLowerCase() === "a") act("approve");
      if (e.key.toLowerCase() === "r") act("reject");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, rejecting]);

  if (pendingActivities.length === 0) {
    return (
      <>
        {!hideHeader && <div className="section-head"><div><h3>Approve proposed drives</h3><p className="hint">Approved drives are published immediately and volunteers are notified.</p></div></div>}
        <EmptyState icon={ShieldCheck} title="Nothing awaiting approval" body="Drives coordinators propose will land here first." />
      </>
    );
  }

  const staffName = (db.staffList.find((f) => f.id === current.createdBy) || {}).name || "Coordinator";
  const total = pendingActivities.length;

  return (
    <>
      {!hideHeader && <div className="section-head"><div><h3>Approve proposed drives</h3><p className="hint">Review one at a time — press <kbd style={{ fontFamily: "var(--font-mono)" }}>A</kbd> to approve, <kbd style={{ fontFamily: "var(--font-mono)" }}>R</kbd> to reject.</p></div></div>}
      <div className="stack-wrap">
        <div className="stack-progress">{total} drive{total === 1 ? "" : "s"} awaiting your sign-off</div>
        <div className="stack-card-wrap">
          {total > 2 && <div className="stack-ghost g2" />}
          {total > 1 && <div className="stack-ghost g1" />}
          <div className={`stack-card ${leaving === "approve" ? "leaving-approve" : leaving === "reject" ? "leaving-reject" : ""}`} key={current.id}>
            <span className="cat-chip"><CategoryIcon name={current.category} /> {current.category}</span>
            <h4 style={{ marginTop: 12 }}>{current.title}</h4>
            <div className="drivename">Proposed by {staffName} · {current.dept}</div>
            <div className="modal-body" style={{ padding: "12px 0 0" }}>
              <div className="meta">
                <span><Calendar size={14} /> {fmtDate(current.date)}</span>
                <span><MapPin size={14} /> {current.location}</span>
                <span><Clock size={14} /> {current.hours} hrs credit</span>
                <span><Users size={14} /> Capacity {current.maxVolunteers}</span>
              </div>
              <p className="desc" style={{ marginTop: 10 }}>{current.description}</p>
            </div>
            {!rejecting ? (
              <div className="stack-actions">
                <button className="btn btn-danger" onClick={() => act("reject")}><X size={15} /> Reject <span className="kbd-hint">R</span></button>
                <button className="btn btn-primary" onClick={() => act("approve")}><Check size={15} /> Approve &amp; publish <span className="kbd-hint">A</span></button>
              </div>
            ) : (
              <div className="reject-reason">
                <input autoFocus placeholder="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} onKeyDown={(e) => e.key === "Enter" && act("reject")} />
                <button className="btn btn-ghost btn-sm" onClick={() => { setRejecting(false); setReason(""); }}><Undo2 size={13} /></button>
                <button className="btn btn-danger btn-sm" onClick={() => act("reject")}>Confirm</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function UserProgressModal({ user, role, db, onClose }) {
  if (!user) return null;
  const isStudent = role === "student";
  const totalHours = isStudent ? computeStudentHours(db, user.id) : 0;
  const approvedActivities = isStudent
    ? db.hourLogs.filter(h => h.studentId === user.id && h.status === "approved")
    : [];
  const approvedCount = approvedActivities.length;
  const earnedBadges = MILESTONES.filter(m => m.events <= approvedCount);
  const earnedCerts = approvedActivities.map(log => {
    const act = db.activities.find(a => a.id === log.activityId);
    return act ? act.title : null;
  }).filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--paper)", borderRadius: 20, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 0' }}>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ padding: '0 28px 28px' }}>
          {isStudent ? (
            <>
              {/* Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, marginBottom: 24 }}>
                <div className="avatar" style={{ width: 88, height: 88, fontSize: 32, borderRadius: 28, marginBottom: 4 }}>{initials(user.name)}</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{user.name}</h2>
                <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 14 }}>{user.dept} · {user.email}</p>
                {user.reg_no && <span style={{ background: 'var(--paper-hi)', borderRadius: 99, padding: '2px 12px', fontSize: 12, fontWeight: 600 }}>{user.reg_no}</span>}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
                <div style={{ background: 'var(--paper-hi)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{totalHours}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>Verified Hours</div>
                </div>
                <div style={{ background: 'var(--paper-hi)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{approvedCount}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>Drives Attended</div>
                </div>
                <div style={{ background: 'var(--paper-hi)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{earnedBadges.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>Badges Earned</div>
                </div>
              </div>

              {/* Badges */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>🏅 Badges</h4>
                {earnedBadges.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>No badges earned yet.</p>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16 }}>
                    {earnedBadges.map(b => (
                      <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <img src={b.image} alt={b.label} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, border: '2px solid var(--paper-line)' }} onError={e => { e.target.style.display='none'; }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)' }}>{b.label}</span>
                      </div>
                    ))}
                    {MILESTONES.filter(m => m.events > approvedCount).map(b => (
                      <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.35 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--paper-hi)', border: '2px dashed var(--paper-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔒</div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)' }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificates */}
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>📜 Certificates</h4>
                {earnedCerts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>No certificates earned yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                    {earnedCerts.map((cert, i) => (
                      <div key={i} style={{ background: 'linear-gradient(135deg, #f8f0ff, #ede9fe)', border: '1px solid #c4b5fd', borderRadius: 10, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, color: '#6d28d9' }}>
                        📜 {cert}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, borderRadius: 24 }}>{initials(user.name)}</div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Coordinator Profile</h2>
                  <p style={{ margin: "4px 0 0", color: "var(--ink-soft)" }}>{user.dept} · {user.email}</p>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Drives Planned</h4>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ledger-table-wrap">
                    <table className="ledger-table">
                      <thead><tr><th>No.</th><th>Title</th><th>Date</th><th>Location</th><th>Volunteers</th></tr></thead>
                      <tbody>
                        {db.activities.filter(a => a.createdBy === user.id).length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--ink-soft)" }}>No drives planned yet.</td></tr>
                        ) : (
                          db.activities.filter(a => a.createdBy === user.id).map((a, i) => (
                            <tr key={a.id}>
                              <td className="rowno">{String(i + 1).padStart(3, "0")}</td>
                              <td style={{ fontWeight: 600 }}>{a.title}</td>
                              <td>{new Date(a.date).toLocaleDateString()}</td>
                              <td>{a.location}</td>
                              <td>{a.registered.length} / {a.maxVolunteers}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CoordinatorsView({ db }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const openModal = (user, role) => {
    setSelectedUser(user);
    setUserRole(role);
  };

  return (
    <>
      <div className="section-head"><div><h3>Coordinators</h3><p className="hint">Every coordinator and the department they run drives for.</p></div></div>
      <div className="card">
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead><tr><th>No.</th><th>Coordinator</th><th>Department</th><th>Drives run</th><th>Volunteers engaged</th></tr></thead>
            <tbody>
              {db.staffList.map((f, i) => {
                const runs = db.activities.filter((a) => a.createdBy === f.id);
                const vols = new Set(runs.flatMap((a) => a.registered)).size;
                return (
                  <tr key={f.id} onClick={() => openModal(f, "staff")} style={{ cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background="var(--paper-hover)"} onMouseOut={e => e.currentTarget.style.background=""}>
                    <td className="rowno">{String(i + 1).padStart(3, "0")}</td>
                    <td>{f.name}</td>
                    <td>{f.dept}</td>
                    <td className="rowno">{runs.length}</td>
                    <td className="rowno">{vols}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedUser && <UserProgressModal user={selectedUser} role={userRole} db={db} onClose={() => setSelectedUser(null)} />}
    </>
  );
}

function AdminVolunteersView({ db }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const openModal = (user, role) => {
    setSelectedUser(user);
    setUserRole(role);
  };

  return (
    <>
      <div className="section-head"><div><h3>Volunteers</h3><p className="hint">Every registered volunteer.</p></div></div>
      <div className="card">
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead><tr><th>No.</th><th>Name</th><th>Department</th><th>Year</th><th>Verified hours</th></tr></thead>
            <tbody>
              {db.students.map((s, i) => (
                <tr key={s.id} onClick={() => openModal(s, "student")} style={{ cursor: "pointer", transition: "background 0.2s" }} className="hoverable-row">
                  <td className="rowno">{String(i + 1).padStart(3, "0")}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.dept}</td>
                  <td>{s.year}</td>
                  <td className="rowno">{computeStudentHours(db, s.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedUser && <UserProgressModal user={selectedUser} role={userRole} db={db} onClose={() => setSelectedUser(null)} />}
    </>
  );
}

function AdminProfile({ person, notify }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(person.name || "");
  const [unit, setUnit] = useState(person.unit || "");
  const [title, setTitle] = useState(person.title || "");

  // Sync edit fields whenever person changes reactively from DB
  useEffect(() => {
    if (!isEditing) {
      setName(person.name || "");
      setUnit(person.unit || "");
      setTitle(person.title || "");
    }
  }, [person, isEditing]);

  const handleSave = () => {
    notify.updateAdminProfile(person.id, { name, unit, title });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(person.name || "");
    setUnit(person.unit || "");
    setTitle(person.title || "");
    setIsEditing(false);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="section-head">
        <div><h3 style={{ fontSize: 24, fontWeight: 700 }}>Admin Profile</h3><p className="hint">Your administrative identity and credentials.</p></div>
        {!isEditing && <button className="btn btn-outline" onClick={() => setIsEditing(true)}>Edit Profile</button>}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        {/* Hero header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div className="avatar" style={{ width: 88, height: 88, fontSize: 32, borderRadius: 28, flexShrink: 0 }}>{initials(person.name)}</div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{person.name}</h2>
            <p style={{ margin: "4px 0 2px", color: "var(--ink-soft)", fontSize: 14 }}>{person.title || "Program Admin"}</p>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 13 }}>{person.email}</p>
          </div>
        </div>

        {isEditing ? (
          <div style={{ background: "var(--paper-hi)", padding: 20, borderRadius: 16 }}>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="field">
                <label>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="field">
                <label>Admin Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Program Admin" />
              </div>
              <div className="field full">
                <label>Assigned NSS Unit</label>
                <select value={unit} onChange={e => setUnit(e.target.value)}>
                  <option value="Unit 1">NSS Unit 1</option>
                  <option value="Unit 2">NSS Unit 2</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "var(--paper-hi)", padding: 16, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin ID</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{person.admin_id || "—"}</div>
            </div>
            <div style={{ background: "var(--paper-hi)", padding: 16, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Unit</div>
              <div style={{ fontWeight: 600 }}>{person.unit || "—"}</div>
            </div>
            <div style={{ background: "var(--paper-hi)", padding: 16, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</div>
              <div style={{ fontWeight: 600 }}>{person.title || "Program Admin"}</div>
            </div>
            <div style={{ background: "var(--paper-hi)", padding: 16, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
              <div style={{ fontWeight: 600, wordBreak: 'break-all', fontSize: 13 }}>{person.email}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 6} dy={8} textAnchor="middle" fill="var(--ink)" style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
        {value}
      </text>
      <text x={cx} y={cy + 18} dy={8} textAnchor="middle" fill="var(--ink-soft)" style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))", transition: "all 0.3s ease", cursor: "pointer" }}
      />
    </g>
  );
};

function Analytics({ db }) {
  const [activeBar, setActiveBar] = useState(-1);
  const [activePie, setActivePie] = useState(-1);
  const deptHours = DEPARTMENTS.map((d) => ({
    dept: d,
    hrs: db.students.filter((s) => s.dept === d).reduce((sum, s) => sum + computeStudentHours(db, s.id), 0),
  }));

  const categoryCounts = CATEGORIES.map((c) => ({
    name: c.name,
    value: db.activities.filter((a) => a.category === c.name && a.status !== "rejected").length,
  })).filter((c) => c.value > 0);

  const approvedLogs = db.hourLogs.filter((h) => h.status === "approved");
  const monthMap = {};
  approvedLogs.forEach((h) => { const k = monthKey(h.date); monthMap[k] = (monthMap[k] || 0) + h.hours; });
  const monthOrder = [...new Set(approvedLogs.map((h) => h.date))].sort().map(monthKey);
  const seenMonths = [];
  monthOrder.forEach((m) => { if (!seenMonths.includes(m)) seenMonths.push(m); });
  const trend = seenMonths.map((m) => ({ month: m, hours: monthMap[m] }));

  return (
    <>
      <div className="section-head"><div><h3>Analytics</h3><p className="hint">Verified hours only — pending logs aren't counted yet.</p></div></div>
      <div className="grid-2">
        <div className="card">
          <h4 style={{ fontSize: 14.5, marginBottom: 12 }}>Hours by department</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptHours} margin={{ left: -10 }}
              onMouseMove={(state) => {
                if (state.isTooltipActive) setActiveBar(state.activeTooltipIndex);
                else setActiveBar(-1);
              }}
              onMouseLeave={() => setActiveBar(-1)}
            >
              <defs>
                <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--moss)" stopOpacity={1}/>
                  <stop offset="100%" stopColor="var(--moss)" stopOpacity={0.5}/>
                </linearGradient>
                <linearGradient id="adminBarGradDim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--moss)" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="var(--moss)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--paper-line)" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
              <Bar dataKey="hrs" radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={800} animationEasing="ease-out">
                {deptHours.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={activeBar === -1 || activeBar === index ? "url(#adminBarGrad)" : "url(#adminBarGradDim)"} style={{ transition: "fill 0.2s ease" }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h4 style={{ fontSize: 14.5, marginBottom: 12 }}>Drives by category</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={categoryCounts}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  activeIndex={activePie}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActivePie(index)}
                  onMouseLeave={() => setActivePie(-1)}
                >
                  {categoryCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--paper)" strokeWidth={2} style={{ opacity: activePie === -1 || activePie === i ? 1 : 0.4, transition: "opacity 0.2s ease", cursor: "pointer" }} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categoryCounts.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  onMouseEnter={() => setActivePie(i)} onMouseLeave={() => setActivePie(-1)}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, minWidth: 28, textAlign: 'right' }}>{c.value}</div>
                  <div style={{ width: 80, background: 'var(--paper-line)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((c.value / Math.max(...categoryCounts.map(x => x.value), 1)) * 100)}%`, height: '100%', background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ fontSize: 14.5, marginBottom: 12 }}>Verified hours over time</h4>
        {trend.length < 2 ? (
          <EmptyState title="Not enough data yet" body="A trend line will appear once hours are approved across more than one month." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--moss)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--moss)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--paper-line)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="basis" dataKey="hours" stroke="var(--moss)" strokeWidth={3} dot={{ r: 4, fill: "var(--paper-hi)", strokeWidth: 2 }} activeDot={{ r: 6, fill: "var(--moss)", stroke: "var(--paper-hi)", strokeWidth: 2 }} animationDuration={800} animationEasing="ease-out" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ fontSize: 14.5, marginBottom: 6 }}>Full leaderboard</h4>
        <Leaderboard db={db} limit={db.students.length} />
      </div>
    </>
  );
}

function Broadcast({ person, notify }) {
  const [message, setMessage] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [sent, setSent] = useState(false);
  function submit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    notify.broadcast(person, message.trim(), isEmergency);
    setMessage("");
    setIsEmergency(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }
  return (
    <>
      <div className="section-head"><div><h3>Broadcast an announcement</h3><p className="hint">Sent instantly to every volunteer and coordinator's notice board.</p></div></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={submit}>
          <div className="field full">
            <label>Announcement</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. NSS registration for the winter camp closes this Friday." />
          </div>
          <div className="field" style={{ marginTop: 12, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="emergency-chk" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} style={{ width: "auto" }} />
            <label htmlFor="emergency-chk" style={{ color: "var(--stamp)", fontWeight: 700, margin: 0 }}>Mark as Emergency Alert</label>
          </div>
          <button type="submit" className={`btn ${isEmergency ? "btn-danger" : "btn-primary"}`}><Megaphone size={14} /> Send to everyone</button>
          {sent && <span style={{ marginLeft: 12, fontSize: 12.5, color: "var(--moss)" }}>Sent to the whole ledger.</span>}
        </form>
      </div>
    </>
  );
}

/* ============================================================
   SUPABASE LOGIN
   ============================================================ */

function SupabaseLogin({ onLoginSuccess, theme, toggleTheme }) {
  const [selectedRole, setSelectedRole] = useState("student");
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unit, setUnit] = useState("Unit 1");

  const verifyRoleConstraints = async (emailToVerify) => {
    const [{ data: sd }, { data: sld }, { data: ad }] = await Promise.all([
      supabase.from('students').select('id').eq('email', emailToVerify),
      supabase.from('staff_list').select('id').eq('email', emailToVerify),
      supabase.from('admins').select('id').eq('email', emailToVerify)
    ]);
    const inStudent = sd && sd.length > 0;
    const inStaff = sld && sld.length > 0;
    const inAdmin = ad && ad.length > 0;

    if (selectedRole === 'student' && (inStaff || inAdmin)) return "Account is already registered as a Coordinator or Admin.";
    if (selectedRole === 'staff' && (inStudent || inAdmin)) return "Account is already registered as a Volunteer or Admin.";
    if (selectedRole === 'admin' && (inStudent || inStaff)) return "Account is already registered as a Volunteer or Coordinator.";
    return null;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    const roleError = await verifyRoleConstraints(email);
    if (roleError) return alert(roleError);

    let table = 'students';
    if (selectedRole === 'staff') table = 'staff_list';
    if (selectedRole === 'admin') table = 'admins';

    if (isSignUp) {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) return alert(authError.message);
      
      const { data } = await supabase.from(table).select('*').eq('email', email);
      if (data && data.length > 0) {
        // Existing record — patch unit if missing
        if (!data[0].unit && selectedRole !== 'student') {
          await supabase.from(table).update({ unit }).eq('id', data[0].id);
        }
        onLoginSuccess({ role: selectedRole, personaId: data[0].id });
      } else {
        const newUser = { email, name: name || email.split('@')[0], unit };
        if (selectedRole === 'student') {
          newUser.dept = 'CSE';
          newUser.reg_no = `NSS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          newUser.verify_token = crypto.randomUUID();
        } else if (selectedRole === 'staff') {
          newUser.dept = 'CSE';
        } else if (selectedRole === 'admin') {
          newUser.title = 'Program Admin';
          newUser.admin_id = `ADMIN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        const { data: created, error } = await supabase.from(table).insert(newUser).select();
        if (created && created.length > 0) {
          onLoginSuccess({ role: selectedRole, personaId: created[0].id });
        } else {
          alert("Sign up failed. " + (error ? error.message : ""));
        }
      }
    } else {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) return alert(authError.message);
      
      const { data } = await supabase.from(table).select('*').eq('email', email);
      if (data && data.length > 0) {
        let record = data[0];
        // If admin is missing their ID, generate one now and patch
        if (selectedRole === 'admin' && !record.admin_id) {
          const newAdminId = `ADMIN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          await supabase.from('admins').update({ admin_id: newAdminId, unit: record.unit || unit }).eq('id', record.id);
          record = { ...record, admin_id: newAdminId, unit: record.unit || unit };
        }
        // Patch unit on login if missing
        if (!record.unit && unit) {
          await supabase.from(table).update({ unit }).eq('id', record.id);
        }
        onLoginSuccess({ role: selectedRole, personaId: record.id });
      } else {
        alert("Account not found for this role. Please sign up or choose the correct role.");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    
    const roleError = await verifyRoleConstraints(decoded.email);
    if (roleError) return alert(roleError);

    let table = 'students';
    if (selectedRole === 'staff') table = 'staff_list';
    if (selectedRole === 'admin') table = 'admins';

    const { data } = await supabase.from(table).select('*').eq('email', decoded.email);
    
    if (data && data.length > 0) {
      let record = data[0];
      if (selectedRole === 'admin' && !record.admin_id) {
        const newAdminId = `ADMIN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase.from('admins').update({ admin_id: newAdminId, unit: record.unit || unit }).eq('id', record.id);
        record = { ...record, admin_id: newAdminId, unit: record.unit || unit };
      }
      if (!record.unit && unit) {
        await supabase.from(table).update({ unit }).eq('id', record.id);
      }
      onLoginSuccess({ role: selectedRole, personaId: record.id });
    } else {
      const newUser = { email: decoded.email, name: decoded.name, unit };
      if (selectedRole === 'student') {
        newUser.dept = 'CSE';
        newUser.reg_no = `NSS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        newUser.verify_token = crypto.randomUUID();
      } else if (selectedRole === 'staff') {
        newUser.dept = 'CSE';
      } else if (selectedRole === 'admin') {
        newUser.title = 'Program Admin';
        newUser.admin_id = `ADMIN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      const { data: created, error } = await supabase.from(table).insert(newUser).select();
      if (created && created.length > 0) {
        onLoginSuccess({ role: selectedRole, personaId: created[0].id });
      } else {
        alert("Google Login failed. " + (error ? error.message : ""));
      }
    }
  };



  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0d120f 0%, #080a08 100%)' 
        : 'var(--ink)',
      padding: '40px',
      position: 'relative',
      fontFamily: 'var(--font-body)'
    }}>
      
      {/* Theme Toggle Top Right */}
      <div style={{ position: 'absolute', top: 32, right: 40 }}>
        <button className="icon-btn" onClick={toggleTheme} style={{ background: 'var(--paper-hi)', borderColor: 'var(--paper-line)' }}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main Card */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        background: 'var(--paper)',
        borderRadius: '24px',
        boxShadow: theme === 'dark' ? '0 30px 60px rgba(0,0,0,0.5)' : '0 30px 60px rgba(0,0,0,0.12)',
        width: '100%',
        maxWidth: '1060px',
        minHeight: '640px',
        overflow: 'hidden'
      }}>
        
        {/* Left Side: Form */}
        <div style={{ flex: 1, padding: '30px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <div className="brand-lockup" style={{ marginBottom: 12, color: 'var(--ink)' }}>
            <WheelMark size={24} /> UNISERVE
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            {isSignUp ? "Create an account" : "Sign in"}
          </h1>
          
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            {/* Role Selection Tabs */}
            <div style={{ display: 'flex', gap: 6, background: 'var(--paper-hi)', padding: 4, borderRadius: 12, border: '1px solid var(--paper-line)' }}>
              {[ { id: 'student', label: 'Volunteer' }, { id: 'staff', label: 'Coordinator' }, { id: 'admin', label: 'Admin' } ].map(r => (
                <button 
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: selectedRole === r.id ? 'var(--ink)' : 'transparent',
                    color: selectedRole === r.id ? 'var(--paper)' : 'var(--ink-soft)'
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {isSignUp && (
              <div className="field full">
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required={isSignUp} placeholder="Your name" style={{ borderRadius: 8 }} />
              </div>
            )}

            <div className="field full">
              <label>NSS Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ borderRadius: 8 }}>
                <option value="Unit 1">NSS Unit 1</option>
                <option value="Unit 2">NSS Unit 2</option>
              </select>
            </div>

            <div className="field full">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@institution.edu" style={{ borderRadius: 8 }} />
            </div>

            <div className="field full">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ borderRadius: 8 }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', justifyContent: 'center', marginTop: 4, fontSize: 15, borderRadius: 8 }}>
              {isSignUp ? "Create account" : "Sign in"}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--paper-line)' }} />
              <div style={{ padding: '0 10px', fontSize: 11, color: 'var(--ink-soft)' }}>OR</div>
              <div style={{ flex: 1, height: 1, background: 'var(--paper-line)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log('Login Failed')}
                text={isSignUp ? "signup_with" : "signin_with"}
                shape="rectangular"
                width="100%"
              />
            </div>
          </form>
          
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button 
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--ink)', fontWeight: 700, marginLeft: 6, cursor: 'pointer' }}
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>

        {/* Right Side: CardSwap Visual */}
        <div style={{ 
          flex: 1.1, 
          background: theme === 'dark' 
            ? 'radial-gradient(at 0% 0%, rgba(79,70,229,0.65) 0px, transparent 50%), ' +
              'radial-gradient(at 50% 0%, rgba(192,38,211,0.65) 0px, transparent 50%), ' +
              'radial-gradient(at 100% 0%, rgba(225,29,72,0.65) 0px, transparent 50%), ' +
              'radial-gradient(at 100% 100%, rgba(245,158,11,0.65) 0px, transparent 50%), ' +
              'radial-gradient(at 0% 100%, rgba(16,185,129,0.65) 0px, transparent 50%), ' +
              '#0a111a'
            : 'radial-gradient(circle at 15% 50%, rgba(255,255,255,0.4) 0%, transparent 50%), ' +
              'radial-gradient(circle at 85% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), ' +
              'linear-gradient(135deg, #050505 0%, #1a1a1a 40%, #888888 50%, #1a1a1a 60%, #050505 100%)', 
          margin: 16, 
          borderRadius: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          position: 'relative', 
          overflow: 'hidden' 
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 60%)' }} />
          <CardSwap
            cardDistance={60}
            verticalDistance={70}
            delay={4000}
            pauseOnHover={false}
            width={360}
            height={420}
          >
            <Card style={{ background: '#ffffff', color: '#0a111a', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.6)' }}>
              <div>
                <Award size={32} color="#E0A72E" style={{ marginBottom: 20 }} />
                <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Log your impact</h3>
                <p style={{ color: '#56607A', fontSize: 14, lineHeight: 1.6 }}>Track every hour of service across your college journey. Verified, immutable, and directly tied to your academic profile.</p>
              </div>
            </Card>
            
            <Card style={{ background: '#3E6B4C', color: '#ffffff', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.6)' }}>
              <div>
                <MapPin size={32} color="#ffffff" style={{ marginBottom: 20 }} />
                <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Geotagged integrity</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6 }}>Our strict geofence radius ensures hours are only logged when you're actually at the drive. Zero disputes.</p>
              </div>
            </Card>

            <Card style={{ background: '#9E2B36', color: '#ffffff', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.6)' }}>
              <div>
                <ClipboardList size={32} color="#ffffff" style={{ marginBottom: 20 }} />
                <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Unit coordination</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6 }}>Seamlessly manage approvals, backfills, and announcements without cross-department data leaks.</p>
              </div>
            </Card>
          </CardSwap>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */

export default function App() {
  const [db, setDb] = useState(null);
  const [session, setSessionState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('technova_session')); }
    catch { return null; }
  });
  const setSession = useCallback((newSession) => {
    setSessionState(newSession);
    if (newSession) localStorage.setItem('technova_session', JSON.stringify(newSession));
    else localStorage.removeItem('technova_session');
  }, []);
  const [view, setView] = useState("overview");
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState("light");
  const [burst, setBurst] = useState(null);

  const pushToast = useCallback((message, tone = "info") => {
    const id = uid("t");
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const load = useCallback(async () => {
    try {
      const [{ data: s }, { data: sl }, { data: ad }, { data: act }, { data: hl }, { data: n }, { data: ost }] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('staff_list').select('*'),
        supabase.from('admins').select('*'),
        supabase.from('activities').select('*'),
        supabase.from('hour_logs').select('*'),
        supabase.from('notifications').select('*'),
        supabase.from('other_staff').select('*')
      ]);

      const mappedActivities = (act || []).map(a => ({
        ...a,
        maxVolunteers: a.max_volunteers,
        createdBy: a.created_by
      }));
      const mappedLogs = (hl || []).map(h => ({
        ...h,
        studentId: h.student_id,
        activityId: h.activity_id,
        photoUrl: h.photo_url
      }));

      setDb({
        students: s || [],
        staffList: sl || [],
        otherStaff: ost || [],
        admins: ad || [],
        activities: mappedActivities,
        hourLogs: mappedLogs,
        notifications: n || []
      });
    } catch (e) {
      console.error(e);
      pushToast("Failed to connect to Supabase.", "warn");
    }
  }, [pushToast]);

  useEffect(() => { 
    load(); 
    const handleFocus = () => load();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [load]);

  const notify = useMemo(() => ({
    createActivity: async (staffPerson, form) => {
      if (!db) return;
      await supabase.from('activities').insert({
        title: form.title, category: form.category, date: form.date, location: form.location, description: form.description,
        max_volunteers: form.maxVolunteers, hours: form.hours, status: "pending_approval", created_by: staffPerson.id, dept: staffPerson.dept, registered: []
      });
      await supabase.from('notifications').insert({ audience: "admins", message: `${staffPerson.name} proposed a new drive: "${form.title}" — awaiting your approval.`, tone: "info" });
      load();
      pushToast("Sent to the program admin for approval.", "success");
    },
    approveActivity: async (activityId) => {
      if (!db) return;
      const a = db.activities.find((x) => x.id === activityId);
      if (!a) return;
      await supabase.from('activities').update({ status: "published" }).eq('id', activityId);
      await supabase.from('notifications').insert([
        { audience: "all", message: `New drive published: "${a.title}" on ${fmtDate(a.date)} — register now.`, tone: "info" },
        { audience: `staff:${a.createdBy}`, message: `Your drive "${a.title}" was approved and is now live.`, tone: "success" }
      ]);
      load();
      pushToast("Drive approved and published.", "success");
    },
    rejectActivity: async (activityId, reason) => {
      if (!db) return;
      const a = db.activities.find((x) => x.id === activityId);
      if (!a) return;
      await supabase.from('activities').update({ status: "rejected" }).eq('id', activityId);
      await supabase.from('notifications').insert({ audience: `staff:${a.createdBy}`, message: `Your drive "${a.title}" was not approved. Reason: ${reason}`, tone: "warn" });
      load();
      pushToast("Drive rejected.", "warn");
    },
    completeActivity: async (activityId) => {
      if (!db) return;
      await supabase.from('activities').update({ status: "completed" }).eq('id', activityId);
      load();
      pushToast("Marked as completed.", "success");
    },
    registerForActivity: async (studentId, activityId) => {
      if (!db) return;
      const a = db.activities.find((x) => x.id === activityId);
      const student = db.students.find((s) => s.id === studentId);
      if (!a || a.registered.includes(studentId) || a.registered.length >= a.maxVolunteers) return;
      const newRegistered = [...a.registered, studentId];
      await supabase.from('activities').update({ registered: newRegistered }).eq('id', activityId);
      await supabase.from('notifications').insert({ audience: `staff:${a.createdBy}`, message: `${student.name} registered for "${a.title}".`, tone: "info" });
      load();
      pushToast("You're registered — the coordinator has been notified.", "success");
    },
    submitHourLog: async (studentId, activityId, hours, note, photoName) => {
      if (!db) return;
      const a = db.activities.find((x) => x.id === activityId);
      const student = db.students.find((s) => s.id === studentId);
      await supabase.from('hour_logs').insert({ student_id: studentId, activity_id: activityId, hours, note, photo_url: photoName, status: "pending", date: new Date().toISOString().slice(0, 10) });
      await supabase.from('notifications').insert({ audience: `staff:${a.createdBy}`, message: `${student.name} logged ${hours} hrs for "${a.title}" — awaiting your approval.`, tone: "info" });
      load();
      pushToast("Hours submitted for approval.", "success");
    },
    approveHourLog: async (logId) => {
      if (!db) return;
      const log = db.hourLogs.find((h) => h.id === logId);
      if (!log) return;
      const a = db.activities.find((x) => x.id === log.activityId);
      const student = db.students.find((s) => s.id === log.studentId);
      const before = computeStudentHours(db, log.studentId);
      await supabase.from('hour_logs').update({ status: "approved" }).eq('id', logId);
      const after = before + log.hours;
      
      const notifs = [{ audience: `student:${log.studentId}`, message: `Your ${log.hours} hr log for "${a ? a.title : "a drive"}" was approved.`, tone: "success" }];
      const crossed = MILESTONES.find((m) => before < m.hrs && after >= m.hrs);
      if (crossed) {
        notifs.push({ audience: `student:${log.studentId}`, message: `Milestone reached: ${crossed.label} unlocked!`, tone: "success" });
        setBurst(crossed.label);
      }
      await supabase.from('notifications').insert(notifs);
      load();
      pushToast(`Approved ${log.hours} hrs for ${student ? student.name : "volunteer"}.`, "success");
    },
    rejectHourLog: async (logId, reason) => {
      if (!db) return;
      const log = db.hourLogs.find((h) => h.id === logId);
      if (!log) return;
      const a = db.activities.find((x) => x.id === log.activityId);
      await supabase.from('hour_logs').update({ status: "rejected" }).eq('id', logId);
      await supabase.from('notifications').insert({ audience: `student:${log.studentId}`, message: `Your hour log for "${a ? a.title : "a drive"}" was rejected: ${reason}`, tone: "warn" });
      load();
      pushToast("Log rejected.", "warn");
    },
    broadcast: async (adminPerson, message, isEmergency = false) => {
      if (!db) return;
      await supabase.from('notifications').insert({ audience: "all", message: `[Announcement from ${adminPerson.name}] ${message}`, tone: isEmergency ? "emergency" : "info", sender_id: adminPerson.id });
      load();
      pushToast(isEmergency ? "Emergency Alert Sent!" : "Announcement sent.", isEmergency ? "warn" : "success");
    },
    acknowledgeEmergency: async (emergencyNotice, person) => {
      if (!db || !emergencyNotice.sender_id) return;
      await supabase.from('notifications').insert({ audience: emergencyNotice.sender_id, message: `[Acknowledge] ${person.name} has accepted your emergency alert.`, tone: "success" });
      load();
    },
    rejectEmergency: async (emergencyNotice, person) => {
      if (!db || !emergencyNotice.sender_id) return;
      await supabase.from('notifications').insert({ audience: emergencyNotice.sender_id, message: `[Reject] ${person.name} has rejected your emergency alert.`, tone: "warn" });
      load();
    },
    updateProfile: async (personId, updates) => {
      if (!db) return;
      setDb(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === personId ? { ...s, ...updates } : s)
      }));
      await supabase.from('students').update(updates).eq('id', personId);
      load();
      pushToast("Profile updated.", "success");
    },
    updateAdminProfile: async (personId, updates) => {
      if (!db) return;
      setDb(prev => ({
        ...prev,
        admins: prev.admins.map(a => a.id === personId ? { ...a, ...updates } : a)
      }));
      await supabase.from('admins').update(updates).eq('id', personId);
      load();
      pushToast("Admin Profile updated.", "success");
    },
  }), [db, pushToast, load]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  // Auto-patch missing admin_id for admins who signed up before this feature
  useEffect(() => {
    if (!session || !db || session.role !== 'admin') return;
    const admin = db.admins.find(a => a.id === session.personaId);
    if (admin && !admin.admin_id) {
      const newAdminId = `ADMIN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      supabase.from('admins').update({ admin_id: newAdminId }).eq('id', admin.id).then(() => load());
    }
  }, [session, db, load]);

  if (db === null) {
    return (
      <div className="seva-root">
        <style>{CSS}</style>
        <div className="loading-screen">
          <WheelMark size={44} spin />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>Opening the ledger…</div>
          <div className="skeleton-block" style={{ width: 220, height: 10 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="seva-root" data-theme={theme}>
      <style>{CSS}</style>
      {!session ? (
        <SupabaseLogin 
          onLoginSuccess={async (sessionData) => { 
            await load();
            setSession(sessionData); 
            setView("overview"); 
          }}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <Shell db={db} session={session} view={view} setView={setView} onExit={() => { supabase.auth.signOut(); setSession(null); }} notify={notify} theme={theme} toggleTheme={toggleTheme} />
      )}
      <ToastStack toasts={toasts} />
      {burst && <BadgeBurst label={burst} onClose={() => setBurst(null)} />}
    </div>
  );
}
