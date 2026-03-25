import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, Globe, Terminal as TerminalIcon, FileSearch, 
  CheckSquare, Activity, Zap, Code2, Home, TrendingUp,
  ChevronLeft, ChevronRight, Settings, Bell, RefreshCw,
  ArrowUpRight, ArrowDownRight, Play, Pause, Trash2, Plus,
  AlertTriangle, CheckCircle, XCircle, Clock, Send,
  Briefcase, Target, Shield, Brain, Coins, Scale, Cpu, 
  FileBarChart, TrendingDown, Building2, ChevronDown, ChevronUp,
  FileText, Map, Bot, Database, Users, Lock, Workflow,
  BarChart3, PieChart, Eye, Layers, LogOut, Key
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import GlobeGL from 'react-globe.gl';
import { Surface3DChart, CorrelationMatrix3D, PriceHistory3D, MarketIndices3D } from './components/Surface3D';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============== AUTH CONTEXT ==============
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('quantflow_token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const res = await axios.get(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(true);
      setUserEmail(res.data.email);
    } catch (e) {
      localStorage.removeItem('quantflow_token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('quantflow_token', res.data.token);
    setIsAuthenticated(true);
    setUserEmail(res.data.email);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('quantflow_token');
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return { isAuthenticated, loading, userEmail, login, logout };
};

// Add auth header to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('quantflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============== LOGIN PAGE ==============
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] rounded-sm mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white font-['Space_Grotesk']">SQH</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#ededed] font-['Space_Grotesk'] tracking-tight">
            SQH-WELLINGTON'S TERMINAL
          </h1>
          <p className="text-sm text-[#71717a] mt-2">
            Authorized Access Only
          </p>
        </div>

        {/* Login Card */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <Lock size={14} />
            <span>TERMINAL ACCESS</span>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-sm text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs uppercase text-[#71717a] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#0ea5e9] focus:outline-none"
                placeholder="Enter your email"
                required
                data-testid="login-email"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase text-[#71717a] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#0ea5e9] focus:outline-none"
                placeholder="Enter your password"
                required
                data-testid="login-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-white font-semibold rounded-sm uppercase text-sm tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="login-submit"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  Access Terminal
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#71717a] mt-6">
          <a href="/" className="hover:text-[#0ea5e9]">← Back to Home</a>
        </p>
      </div>
    </div>
  );
};

// ============== PASSWORD CHANGE MODAL ==============
const PasswordChangeModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#27272a] rounded-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[#3b82f6]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#ededed]">Change Password</h2>
          </div>
          <button onClick={onClose} className="text-[#71717a] hover:text-[#ededed] transition-colors">
            <XCircle size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-sm text-sm flex items-center gap-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] px-4 py-3 rounded-sm text-sm flex items-center gap-2">
              <CheckCircle size={14} />
              {success}
            </div>
          )}
          
          <div>
            <label className="block text-xs uppercase text-[#71717a] mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#3b82f6] focus:outline-none"
              placeholder="Enter current password"
              required
              data-testid="current-password"
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase text-[#71717a] mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#3b82f6] focus:outline-none"
              placeholder="Enter new password (min 8 characters)"
              required
              data-testid="new-password"
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase text-[#71717a] mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#3b82f6] focus:outline-none"
              placeholder="Confirm new password"
              required
              data-testid="confirm-password"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#27272a] text-[#ededed] rounded-sm text-sm hover:bg-[#3f3f46] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-sm text-sm hover:bg-[#2563eb] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="change-password-submit"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============== LANDING PAGE ==============
const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: LayoutDashboard,
      title: "Quant Dashboard",
      description: "Real-time market data, interactive charts, and comprehensive asset tracking with 2D/3D visualization modes."
    },
    {
      icon: TrendingUp,
      title: "Macro Regime Analysis",
      description: "Economic indicators, regime detection algorithms, and correlation matrix analysis for market conditions."
    },
    {
      icon: Globe,
      title: "World Intel Map",
      description: "Interactive 3D globe with global market events, geopolitical intelligence, and real-time alerts."
    },
    {
      icon: Briefcase,
      title: "10 Hedge Fund Strategies",
      description: "Long/Short Equity, Global Macro, Event-Driven, Quant Multi-Strategy, and more with AI-powered analysis."
    },
    {
      icon: FileText,
      title: "13F SEC Filings",
      description: "Track top 10 hedge fund quarterly holdings with AI-powered portfolio analysis and insights."
    },
    {
      icon: Bot,
      title: "Automation Hub",
      description: "Automated trading, compliance monitoring, risk management, and investor relations modules."
    }
  ];

  const stats = [
    { value: "10+", label: "Hedge Fund Strategies" },
    { value: "16", label: "Global Indices" },
    { value: "5", label: "Automation Modules" },
    { value: "3", label: "View Modes" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed]" data-testid="landing-page">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-[#1e3a5f]' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] rounded-sm flex items-center justify-center">
              <span className="text-lg font-bold text-white font-['Space_Grotesk']">SQH</span>
            </div>
            <div>
              <span className="font-['Space_Grotesk'] font-semibold text-lg">SQH-Wellington's Terminal</span>
              <span className="hidden sm:inline text-xs text-[#71717a] ml-2">Quantitative Control Plane</span>
            </div>
          </div>
          <a 
            href="/login" 
            className="px-5 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-white font-semibold rounded-sm text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
            data-testid="nav-login"
          >
            Terminal Access
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0ea5e9]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#22d3ee]/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-full mb-8">
            <div className="w-2 h-2 bg-[#22d3ee] rounded-full animate-pulse" />
            <span className="text-xs text-[#22d3ee] uppercase tracking-wider">Hedge Fund Quantitative Platform</span>
          </div>
          
          <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-[#ededed]">SQH-Wellington's</span>
            <br />
            <span className="bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] bg-clip-text text-transparent">Terminal</span>
          </h1>
          
          <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Enterprise-grade quantitative control plane for hedge fund operations. 
            Market data, macro analysis, global intelligence, and automated trading strategies.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login" 
              className="px-8 py-4 bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-white font-semibold rounded-sm uppercase tracking-wider hover:opacity-90 transition-all hover:scale-105"
              data-testid="hero-login"
            >
              Access Terminal
            </a>
            <a 
              href="#features" 
              className="px-8 py-4 border border-[#1e3a5f] text-[#94a3b8] font-semibold rounded-sm uppercase tracking-wider hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-[#71717a]" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-[#1e3a5f] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-['Space_Grotesk'] text-4xl md:text-5xl font-bold text-[#22d3ee] mb-2">{stat.value}</div>
                <div className="text-sm text-[#71717a] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-[#0ea5e9] uppercase tracking-widest">Capabilities</span>
            <h2 className="font-['Space_Grotesk'] text-4xl md:text-5xl font-bold mt-4 mb-6">
              Quantitative Command Center
            </h2>
            <p className="text-[#94a3b8] max-w-2xl mx-auto">
              Everything you need to monitor, analyze, and execute hedge fund strategies from a single unified terminal.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group p-6 bg-gradient-to-b from-[#111827] to-[#0a0a0a] border border-[#1e3a5f] rounded-lg hover:border-[#0ea5e9]/50 transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#0ea5e9]/20 transition-colors">
                  <feature.icon size={24} className="text-[#22d3ee]" strokeWidth={1.5} />
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategies Section */}
      <section className="py-24 bg-[#0a0a0a] border-y border-[#1e3a5f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs text-[#0ea5e9] uppercase tracking-widest">Investment Strategies</span>
              <h2 className="font-['Space_Grotesk'] text-4xl font-bold mt-4 mb-6">
                10 Core Hedge Fund Strategies
              </h2>
              <p className="text-[#94a3b8] mb-8 leading-relaxed">
                Comprehensive coverage of institutional-grade investment strategies, each with AI-powered analysis for current market conditions.
              </p>
              <div className="space-y-3">
                {['Long/Short Equity', 'Global Macro', 'Event-Driven', 'Quant Multi-Strategy', 'AI & Machine Learning'].map((strategy, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-[#22d3ee]" />
                    <span className="text-[#ededed]">{strategy}</span>
                  </div>
                ))}
                <div className="text-sm text-[#71717a] mt-4">+ 5 more strategies</div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0ea5e9]/20 to-[#22d3ee]/20 rounded-lg blur-xl" />
              <div className="relative bg-[#111827] border border-[#1e3a5f] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <div className="w-3 h-3 rounded-full bg-[#22d3ee]" />
                </div>
                <div className="font-mono text-sm space-y-2 text-[#94a3b8]">
                  <div><span className="text-[#22d3ee]">strategy</span>.analyze(<span className="text-[#f59e0b]">"Global Macro"</span>)</div>
                  <div><span className="text-[#71717a]">// AI Analysis Processing...</span></div>
                  <div><span className="text-[#22d3ee]">→</span> Risk Level: <span className="text-[#f59e0b]">MEDIUM-HIGH</span></div>
                  <div><span className="text-[#22d3ee]">→</span> Expected Return: <span className="text-[#00e676]">10-20%</span></div>
                  <div><span className="text-[#22d3ee]">→</span> Correlation: <span className="text-[#94a3b8]">0.1-0.3</span></div>
                  <div><span className="text-[#22d3ee]">→</span> Recommendation: <span className="text-[#00e676]">FAVORABLE</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-['Space_Grotesk'] text-4xl md:text-5xl font-bold mb-6">
            Ready to Access the Terminal?
          </h2>
          <p className="text-[#94a3b8] mb-10 text-lg">
            Authorized personnel only. Contact for access credentials.
          </p>
          <a 
            href="/login" 
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-white font-semibold rounded-sm uppercase tracking-wider hover:opacity-90 transition-all hover:scale-105"
          >
            <Lock size={18} />
            Terminal Login
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#1e3a5f] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] rounded-sm flex items-center justify-center">
                <span className="text-sm font-bold text-white">SQH</span>
              </div>
              <span className="font-['Space_Grotesk'] font-semibold">SQH-Wellington's Terminal</span>
            </div>
            <div className="text-sm text-[#71717a]">
              © {new Date().getFullYear()} SQH-Wellington. Quantitative Control Plane.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============== SIDEBAR ==============
const Sidebar = ({ collapsed, setCollapsed, viewMode, setViewMode, userEmail, onLogout }) => {
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const navItems = [
    { path: "/dashboard", icon: Home, label: "Hub" },
    { path: "/strategies", icon: Briefcase, label: "Strategies" },
    { path: "/sec-filings", icon: FileText, label: "13F SEC Filings" },
    { path: "/heatmap", icon: Map, label: "Global Heatmap" },
    { path: "/quant", icon: LayoutDashboard, label: "Quant Dashboard" },
    { path: "/macro", icon: TrendingUp, label: "Macro Regime" },
    { path: "/intel", icon: Globe, label: "World Intel" },
    { path: "/terminal", icon: TerminalIcon, label: "Terminal" },
  ];
  
  const workflowItems = [
    { path: "/research", icon: FileSearch, label: "Research Queue" },
    { path: "/approvals", icon: CheckSquare, label: "Approvals" },
    { path: "/health", icon: Activity, label: "System Health" },
    { path: "/profile", icon: Settings, label: "Profile" },
  ];
  
  const automationItems = [
    { path: "/automation-hub", icon: Bot, label: "Automation Hub" },
    { path: "/automation-v1", icon: Zap, label: "Automation V1" },
    { path: "/automation-v2", icon: Code2, label: "Automation V2" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} data-testid="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">QF</div>
        {!collapsed && <span className="sidebar-title">QuantFlow</span>}
      </div>
      
      {/* User Info */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-[#27272a]">
          <div className="text-[10px] uppercase text-[#71717a]">Logged in as</div>
          <div className="text-xs text-[#ededed] truncate font-mono">{userEmail}</div>
        </div>
      )}
      
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <item.icon className="nav-item-icon" strokeWidth={1.5} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Workflow</div>}
          {workflowItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon className="nav-item-icon" strokeWidth={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
        
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Automation</div>}
          {automationItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon className="nav-item-icon" strokeWidth={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>
      
      <div className="p-2 border-t border-[#27272a] space-y-2">
        {!collapsed && (
          <>
            <div className="px-1 mb-2">
              <div className="text-[9px] uppercase text-[#71717a] mb-1.5">View Mode</div>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('modern')}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded-sm border transition-all ${viewMode === 'modern' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'border-[#27272a] text-[#71717a] hover:border-[#3b82f6]'}`}
                  data-testid="view-mode-modern"
                >
                  Modern
                </button>
                <button
                  onClick={() => setViewMode('wellington')}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded-sm border transition-all ${viewMode === 'wellington' ? 'bg-[#ff6600] border-[#ff6600] text-black' : 'border-[#27272a] text-[#71717a] hover:border-[#ff6600]'}`}
                  data-testid="view-mode-wellington"
                >
                  Wellington
                </button>
                <button
                  onClick={() => setViewMode('nautical')}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded-sm border transition-all ${viewMode === 'nautical' ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white' : 'border-[#27272a] text-[#71717a] hover:border-[#0ea5e9]'}`}
                  data-testid="view-mode-nautical"
                >
                  Nautical
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="nav-item w-full justify-start text-xs text-[#a1a1aa] hover:bg-[#3b82f6]/10"
              data-testid="change-password-btn"
            >
              <Key size={14} />
              <span>Change Password</span>
            </button>
            <button
              onClick={onLogout}
              className="nav-item w-full justify-start text-xs text-[#ef4444] hover:bg-[#ef4444]/10"
              data-testid="logout-btn"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item w-full justify-center"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      {/* Password Change Modal */}
      <PasswordChangeModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </aside>
  );
};

// ============== HUB PAGE ==============
const HubPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API}/dashboard/summary`);
        setSummary(res.data);
      } catch (e) {
        console.error("Error fetching summary:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div data-testid="hub-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hedge Fund Hub</h1>
          <p className="page-subtitle">Command Center Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-quant px-3 py-2 flex items-center gap-2">
            <Bell size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Alerts</span>
          </button>
          <button className="btn-quant px-3 py-2 flex items-center gap-2">
            <Settings size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="bento-grid bento-grid-4 mb-6">
        <MetricCard
          label="Portfolio Value"
          value={`$${(summary?.portfolio_value / 1000000).toFixed(1)}M`}
          change={summary?.daily_pnl_percent}
        />
        <MetricCard
          label="Daily P&L"
          value={`$${(summary?.daily_pnl / 1000).toFixed(0)}K`}
          change={summary?.daily_pnl_percent}
        />
        <MetricCard
          label="Open Positions"
          value={summary?.open_positions}
        />
        <MetricCard
          label="Current Regime"
          value={summary?.current_regime?.replace('_', ' ')}
          badge={true}
          badgeType={summary?.current_regime === 'RISK_ON' ? 'profit' : 'loss'}
        />
      </div>

      <div className="bento-grid bento-grid-3 mb-6">
        <div className="quant-card">
          <div className="quant-card-header">Pending Actions</div>
          <div className="p-4 space-y-3">
            <ActionItem icon={CheckSquare} label="Approvals Pending" value={summary?.pending_approvals} />
            <ActionItem icon={FileSearch} label="Research Tasks" value={summary?.pending_research} />
            <ActionItem icon={Zap} label="Active Automations" value={summary?.active_automations} />
          </div>
        </div>
        
        <div className="quant-card">
          <div className="quant-card-header">System Status</div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${summary?.system_health?.includes('8/8') ? 'status-healthy' : 'status-degraded'}`}></div>
              <span className="font-mono text-sm">{summary?.system_health}</span>
            </div>
          </div>
        </div>
        
        <div className="quant-card">
          <div className="quant-card-header">Top Movers</div>
          <div className="p-4 space-y-2">
            {summary?.top_movers?.slice(0, 3).map((mover, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-mono text-sm">{mover.symbol}</span>
                <span className={`font-mono text-sm ${mover.change_percent >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {mover.change_percent >= 0 ? '+' : ''}{mover.change_percent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bento-grid bento-grid-2">
        <QuickNavCard title="Quant Dashboard" desc="View market data & charts" path="/dashboard" icon={LayoutDashboard} />
        <QuickNavCard title="Macro Regime" desc="Economic indicators" path="/macro" icon={TrendingUp} />
        <QuickNavCard title="Terminal" desc="Command interface" path="/terminal" icon={TerminalIcon} />
        <QuickNavCard title="Research Queue" desc="AI-powered analysis" path="/research" icon={FileSearch} />
      </div>
    </div>
  );
};

// ============== COMPOSITE STRATEGY CARD ==============
const CompositeStrategyCard = ({ strategy }) => {
  const [view3D, setView3D] = useState(false);
  const [chartType, setChartType] = useState('strategies'); // 'strategies' or 'categories'
  const [showOptimization, setShowOptimization] = useState(false);
  const [optimization, setOptimization] = useState('');
  const [loadingOptimization, setLoadingOptimization] = useState(false);

  if (!strategy.roi_data) return null;

  const { strategies: strategyROIs, categories: categoryROIs, overall_roi } = strategy.roi_data;

  const handleGetOptimization = async () => {
    setLoadingOptimization(true);
    setShowOptimization(true);
    
    try {
      const response = await axios.post(`${API}/strategies/composite/optimize`);
      setOptimization(response.data.optimization);
    } catch (error) {
      setOptimization('Optimization service temporarily unavailable. Please try again.');
    } finally {
      setLoadingOptimization(false);
    }
  };

  // Prepare data for 3D visualization
  const strategy3DData = strategyROIs.map((s, idx) => ({
    x: idx,
    y: s.roi,
    z: s.allocation,
    label: s.name
  }));

  const category3DData = categoryROIs.map((c, idx) => ({
    x: idx,
    y: c.roi,
    z: c.allocation,
    label: c.name
  }));

  return (
    <div className="quant-card border-2 border-[#3b82f6]/30 mb-8">
      {/* Header */}
      <div className="quant-card-header bg-gradient-to-r from-[#3b82f6]/20 to-[#0ea5e9]/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#0ea5e9] rounded-lg flex items-center justify-center">
            <Layers size={20} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <span className="font-semibold text-[#ededed] text-base normal-case">{strategy.name}</span>
            <span className="ml-3 text-[10px] px-2 py-1 bg-[#3b82f6]/20 rounded font-bold">{strategy.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGetOptimization}
            disabled={loadingOptimization}
            className="px-4 py-2 bg-gradient-to-r from-[#3b82f6] to-[#0ea5e9] text-white rounded text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            data-testid="get-optimization-btn"
          >
            {loadingOptimization ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Brain size={12} />
            )}
            Get AI Optimization
          </button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-[#71717a] mr-1">Overall ROI:</span>
            <span className="font-mono text-xl font-bold text-[#00e676]">{overall_roi}%</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-6 border-b border-[#27272a]">
        <p className="text-sm text-[#a1a1aa] leading-relaxed mb-4">{strategy.description}</p>
        
        {/* Summary Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase text-[#71717a] mb-1">Risk Level</div>
            <div className="font-mono text-sm font-medium text-[#f59e0b]">{strategy.risk_level}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#71717a] mb-1">Expected Return</div>
            <div className="font-mono text-sm font-medium text-[#00e676]">{strategy.expected_return}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#71717a] mb-1">Correlation</div>
            <div className="font-mono text-sm font-medium text-[#3b82f6]">{strategy.correlation}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#71717a] mb-1">Strategies Combined</div>
            <div className="font-mono text-sm font-medium text-[#ededed]">10</div>
          </div>
        </div>

        {/* Key Factors */}
        <div className="flex flex-wrap gap-2 mt-4">
          {strategy.key_factors.map((factor, i) => (
            <span key={i} className="text-[10px] px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded border border-[#3b82f6]/20">
              {factor}
            </span>
          ))}
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="px-6 py-3 bg-[#0a0a0a] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('strategies')}
            className={`px-3 py-1 text-xs rounded transition-colors ${chartType === 'strategies' ? 'bg-[#3b82f6] text-white' : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'}`}
          >
            By Strategy (10)
          </button>
          <button
            onClick={() => setChartType('categories')}
            className={`px-3 py-1 text-xs rounded transition-colors ${chartType === 'categories' ? 'bg-[#3b82f6] text-white' : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'}`}
          >
            By Category (8)
          </button>
        </div>
        <button
          onClick={() => setView3D(!view3D)}
          className={`px-3 py-1 text-xs rounded flex items-center gap-1 transition-colors ${view3D ? 'bg-[#0ea5e9] text-white' : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'}`}
        >
          <Layers size={12} />
          {view3D ? '3D Surface' : '2D Charts'}
        </button>
      </div>

      {/* ROI Visualization */}
      <div className="p-6">
        {chartType === 'strategies' && (
          <>
            <h3 className="text-sm font-semibold text-[#ededed] mb-4 flex items-center gap-2">
              <BarChart3 size={14} />
              ROI by Individual Strategy
            </h3>
            
            {view3D ? (
              <div className="h-[500px] bg-[#000] rounded border border-[#27272a]">
                <Surface3DChart
                  data={strategy3DData}
                  title="Strategy ROI vs Allocation (3D Surface)"
                  xLabel="Strategy Index"
                  yLabel="ROI (%)"
                  zLabel="Allocation (%)"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {strategyROIs.map((s, idx) => (
                  <div key={s.id} className="bg-[#0a0a0a] border border-[#27272a] rounded p-3 hover:border-[#3b82f6]/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#ededed]">{s.name}</div>
                        <div className="text-[10px] text-[#71717a]">{s.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-[#00e676]">{s.roi}%</div>
                        <div className="text-[10px] text-[#71717a]">ROI</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                      <div>
                        <span className="text-[#71717a]">Allocation:</span>
                        <span className="ml-2 font-mono text-[#3b82f6]">{s.allocation}%</span>
                      </div>
                      <div>
                        <span className="text-[#71717a]">YTD:</span>
                        <span className="ml-2 font-mono text-[#00e676]">{s.ytd}%</span>
                      </div>
                    </div>
                    {/* ROI Progress Bar */}
                    <div className="bg-[#27272a] h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00e676] to-[#3b82f6]" 
                        style={{ width: `${Math.min(s.roi * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {chartType === 'categories' && (
          <>
            <h3 className="text-sm font-semibold text-[#ededed] mb-4 flex items-center gap-2">
              <PieChart size={14} />
              ROI by Category
            </h3>
            
            {view3D ? (
              <div className="h-[500px] bg-[#000] rounded border border-[#27272a]">
                <Surface3DChart
                  data={category3DData}
                  title="Category ROI vs Allocation (3D Surface)"
                  xLabel="Category Index"
                  yLabel="ROI (%)"
                  zLabel="Allocation (%)"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryROIs.map((c, idx) => (
                  <div key={idx} className="bg-[#0a0a0a] border border-[#27272a] rounded p-4 hover:border-[#3b82f6]/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-base font-semibold text-[#ededed]">{c.name}</div>
                        <div className="text-[10px] text-[#71717a]">{c.strategies} {c.strategies === 1 ? 'Strategy' : 'Strategies'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-[#00e676]">{c.roi}%</div>
                        <div className="text-[10px] text-[#71717a]">Avg ROI</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-[#000] p-2 rounded">
                        <div className="text-[10px] text-[#71717a]">Portfolio Weight</div>
                        <div className="font-mono text-sm text-[#3b82f6] font-bold">{c.allocation}%</div>
                      </div>
                      <div className="bg-[#000] p-2 rounded">
                        <div className="text-[10px] text-[#71717a]">Risk Profile</div>
                        <div className={`text-sm font-medium ${c.risk.includes('HIGH') ? 'text-[#ef4444]' : c.risk.includes('LOW') ? 'text-[#00e676]' : 'text-[#f59e0b]'}`}>
                          {c.risk}
                        </div>
                      </div>
                    </div>
                    
                    {/* Allocation bar */}
                    <div className="bg-[#27272a] h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#3b82f6] to-[#0ea5e9]" 
                        style={{ width: `${Math.min(c.allocation * 3, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* AI Optimization Results */}
      {showOptimization && (
        <div className="border-t border-[#27272a]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-[#0ea5e9]" />
              <h3 className="text-sm font-semibold text-[#ededed] uppercase tracking-wider">
                AI Portfolio Optimization Analysis
              </h3>
            </div>
            
            {loadingOptimization ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-[#3b82f6] mr-3" size={24} />
                <span className="text-[#a1a1aa]">Analyzing portfolio with advanced AI system...</span>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-[#3b82f6]/20 rounded p-4">
                <div className="prose prose-invert max-w-none">
                  <div className="text-sm text-[#ededed] whitespace-pre-wrap leading-relaxed">
                    {optimization}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// ============== HEDGE FUND STRATEGIES ==============
const StrategiesPage = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysis, setAnalysis] = useState({});
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const res = await axios.get(`${API}/strategies`);
        setStrategies(res.data);
      } catch (e) {
        console.error("Error fetching strategies:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStrategies();
  }, []);

  const analyzeStrategy = async (strategyId) => {
    setAnalyzing(strategyId);
    try {
      const res = await axios.post(`${API}/strategies/${strategyId}/analyze`);
      setAnalysis(prev => ({ ...prev, [strategyId]: res.data.analysis }));
    } catch (e) {
      console.error("Error analyzing strategy:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStrategyIcon = (category) => {
    const icons = {
      'Equity': Target,
      'Macro': Globe,
      'Credit': Coins,
      'Quantitative': Cpu,
      'Arbitrage': Scale,
      'Structured': FileBarChart,
      'Managed Futures': TrendingDown,
      'Real Assets': Building2
    };
    return icons[category] || Briefcase;
  };

  const getRiskColor = (risk) => {
    if (risk.includes('LOW')) return 'text-[#00e676]';
    if (risk.includes('HIGH')) return 'text-[#ef4444]';
    return 'text-[#f59e0b]';
  };

  if (loading) return <LoadingState />;

  // Separate composite strategy from individual strategies
  const compositeStrategy = strategies.find(s => s.id === 'composite-portfolio');
  const individualStrategies = strategies.filter(s => s.id !== 'composite-portfolio');

  return (
    <div data-testid="strategies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hedge Fund Strategies</h1>
          <p className="page-subtitle">Composite Portfolio + 10 Core Investment Strategies for 2026</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#71717a]">
          <span>{strategies.length} Strategies</span>
          <span>•</span>
          <span>{new Set(strategies.map(s => s.category)).size} Categories</span>
        </div>
      </div>

      {/* COMPOSITE PORTFOLIO STRATEGY - Featured Section */}
      {compositeStrategy && <CompositeStrategyCard strategy={compositeStrategy} />}

      {/* Individual Strategy Overview Cards */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[#ededed] mb-4 flex items-center gap-2">
          <Briefcase size={18} />
          Individual Strategies
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {individualStrategies.map((strategy) => {
          const IconComponent = getStrategyIcon(strategy.category);
          const isExpanded = expandedCards[strategy.id];
          const hasAnalysis = analysis[strategy.id];
          
          return (
            <div 
              key={strategy.id} 
              className="quant-card overflow-hidden"
              data-testid={`strategy-card-${strategy.id}`}
            >
              {/* Header */}
              <div className="quant-card-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#3b82f6]/10 rounded flex items-center justify-center">
                    <IconComponent size={16} className="text-[#3b82f6]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="font-medium text-[#ededed] normal-case">{strategy.name}</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 bg-[#27272a] rounded">{strategy.category}</span>
                  </div>
                </div>
                <button 
                  onClick={() => toggleExpand(strategy.id)}
                  className="text-[#71717a] hover:text-white"
                  data-testid={`expand-${strategy.id}`}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Main Content */}
              <div className="p-4">
                <p className="text-sm text-[#a1a1aa] mb-4 leading-relaxed">{strategy.description}</p>
                
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a] mb-1">Risk Level</div>
                    <div className={`font-mono text-sm font-medium ${getRiskColor(strategy.risk_level)}`}>
                      {strategy.risk_level}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a] mb-1">Expected Return</div>
                    <div className="font-mono text-sm font-medium text-[#00e676]">{strategy.expected_return}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a] mb-1">Correlation</div>
                    <div className="font-mono text-sm font-medium text-[#3b82f6]">{strategy.correlation}</div>
                  </div>
                </div>

                {/* Key Factors */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {strategy.key_factors.map((factor, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-[#27272a] text-[#a1a1aa] rounded">
                      {factor}
                    </span>
                  ))}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-[#27272a] pt-4 mt-4">
                    <button
                      onClick={() => analyzeStrategy(strategy.id)}
                      disabled={analyzing === strategy.id}
                      className="btn-quant px-4 py-2 text-xs flex items-center gap-2 mb-4"
                      data-testid={`analyze-strategy-${strategy.id}`}
                    >
                      {analyzing === strategy.id ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Brain size={12} />
                          Get AI Analysis
                        </>
                      )}
                    </button>

                    {hasAnalysis && (
                      <div className="bg-[#000] border border-[#27272a] rounded-sm p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain size={14} className="text-[#3b82f6]" />
                          <span className="text-xs text-[#71717a] uppercase">AI Strategy Analysis</span>
                        </div>
                        <div className="text-sm text-[#ededed] whitespace-pre-wrap leading-relaxed">
                          {hasAnalysis}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="px-4 py-2 bg-[#000] border-t border-[#27272a] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${strategy.status === 'ACTIVE' ? 'bg-[#00e676]' : 'bg-[#71717a]'}`} />
                  <span className="text-[10px] text-[#71717a]">{strategy.status}</span>
                </div>
                <span className="text-[10px] text-[#71717a]">ID: {strategy.id}</span>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Strategy Summary Section */}
      <div className="mt-8 quant-card">
        <div className="quant-card-header">Strategy Allocation Guide</div>
        <div className="p-4">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Low Risk', strategies: strategies.filter(s => s.risk_level.includes('LOW')).length, color: '#00e676' },
              { label: 'Medium Risk', strategies: strategies.filter(s => s.risk_level === 'MEDIUM').length, color: '#f59e0b' },
              { label: 'High Risk', strategies: strategies.filter(s => s.risk_level.includes('HIGH')).length, color: '#ef4444' },
              { label: 'Low Correlation', strategies: strategies.filter(s => s.correlation.includes('0.0') || s.correlation.includes('-')).length, color: '#3b82f6' },
              { label: 'Total Strategies', strategies: strategies.length, color: '#a1a1aa' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="font-mono text-2xl font-semibold" style={{ color: item.color }}>{item.strategies}</div>
                <div className="text-[10px] text-[#71717a] uppercase mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== 13F SEC FILINGS PAGE ==============
const SECFilingsPage = ({ viewMode }) => {
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysis, setAnalysis] = useState({});

  useEffect(() => {
    const fetchFilings = async () => {
      try {
        const res = await axios.get(`${API}/sec/13f`);
        setFilings(res.data);
      } catch (e) {
        console.error("Error fetching 13F filings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFilings();
  }, []);

  const analyzeFilng = async (fundId) => {
    setAnalyzing(fundId);
    try {
      const res = await axios.post(`${API}/sec/13f/${fundId}/analyze`);
      setAnalysis(prev => ({ ...prev, [fundId]: res.data.analysis }));
    } catch (e) {
      console.error("Error analyzing filing:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  if (loading) return <LoadingState />;

  const isBloomberg = viewMode === 'wellington';
  const isNautical = viewMode === 'nautical';

  return (
    <div data-testid="sec-filings-page" className={isBloomberg ? 'font-mono' : ''}>
      <div className="page-header">
        <div>
          <h1 className="page-title">13F SEC FILINGS</h1>
          <p className="page-subtitle">Top 10 Hedge Fund Quarterly Holdings (Q3 2025)</p>
        </div>
        <div className="text-xs text-[#71717a]">
          Total AUM Tracked: ${(filings.reduce((a, b) => a + b.aum, 0) / 1e12).toFixed(2)}T
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Fund List */}
        <div className={`col-span-4 quant-card ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`} data-testid="fund-list">
          <div className={`quant-card-header ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
            TOP HEDGE FUNDS BY AUM
          </div>
          <div className="max-h-[700px] overflow-y-auto">
            {filings.sort((a, b) => b.aum - a.aum).map((filing, i) => (
              <div
                key={filing.id}
                onClick={() => setSelectedFiling(filing)}
                className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 ${
                  selectedFiling?.id === filing.id ? 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]' : ''
                }`}
                data-testid={`fund-${filing.id}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className={`text-xs ${isBloomberg ? 'text-[#ff6600]' : 'text-[#3b82f6]'}`}>#{i + 1}</span>
                    <span className="font-medium text-sm ml-2">{filing.fund_name}</span>
                  </div>
                  <span className={`font-mono text-xs ${filing.quarterly_change >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {filing.quarterly_change >= 0 ? '+' : ''}{filing.quarterly_change}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#71717a]">
                  <span>AUM: ${(filing.aum / 1e9).toFixed(1)}B</span>
                  <span>{filing.quarter}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filing Details */}
        <div className="col-span-8 space-y-4">
          {selectedFiling ? (
            <>
              <div className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
                <div className={`quant-card-header flex justify-between items-center ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
                  <span>{selectedFiling.fund_name}</span>
                  <span className="text-xs">CIK: {selectedFiling.cik}</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div>
                      <div className="text-[10px] uppercase text-[#71717a]">AUM</div>
                      <div className={`font-mono text-xl font-semibold ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                        ${(selectedFiling.aum / 1e9).toFixed(1)}B
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-[#71717a]">Quarter</div>
                      <div className="font-mono text-xl">{selectedFiling.quarter}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-[#71717a]">QoQ Change</div>
                      <div className={`font-mono text-xl ${selectedFiling.quarterly_change >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {selectedFiling.quarterly_change >= 0 ? '+' : ''}{selectedFiling.quarterly_change}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-[#71717a]">Filing Date</div>
                      <div className="font-mono text-xl">{selectedFiling.filing_date}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Top Holdings */}
                    <div>
                      <h4 className="text-xs uppercase text-[#71717a] mb-3">Top 5 Holdings</h4>
                      <table className="quant-table">
                        <thead>
                          <tr>
                            <th>Symbol</th>
                            <th>Value</th>
                            <th>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFiling.top_holdings.map((h, i) => (
                            <tr key={i}>
                              <td className={`font-medium ${isBloomberg ? 'text-[#00ffff]' : 'text-[#3b82f6]'}`}>{h.symbol}</td>
                              <td>${(h.value / 1e9).toFixed(2)}B</td>
                              <td>{h.percent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Sector Allocation */}
                    <div>
                      <h4 className="text-xs uppercase text-[#71717a] mb-3">Sector Allocation</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedFiling.sector_allocation).map(([sector, pct], i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{sector}</span>
                              <span className="font-mono">{pct}%</span>
                            </div>
                            <div className="h-2 bg-[#27272a] rounded-sm overflow-hidden">
                              <div 
                                className={`h-full ${isBloomberg ? 'bg-[#ff6600]' : 'bg-[#3b82f6]'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
                <div className={`quant-card-header flex justify-between items-center ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
                  <span>AI Portfolio Analysis</span>
                  <button
                    onClick={() => analyzeFilng(selectedFiling.id)}
                    disabled={analyzing === selectedFiling.id}
                    className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                    data-testid={`analyze-filing-${selectedFiling.id}`}
                  >
                    {analyzing === selectedFiling.id ? (
                      <><RefreshCw size={12} className="animate-spin" /> Analyzing...</>
                    ) : (
                      <><Brain size={12} /> Analyze with AI</>
                    )}
                  </button>
                </div>
                <div className="p-4">
                  {analysis[selectedFiling.id] ? (
                    <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                      {analysis[selectedFiling.id]}
                    </div>
                  ) : (
                    <div className="text-center text-[#71717a] py-8">
                      Click "Analyze with AI" to get insights on this fund's portfolio positioning
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="quant-card p-12 text-center text-[#71717a]">
              Select a fund from the list to view detailed 13F filing data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== GLOBAL HEATMAP PAGE ==============
const GlobalHeatmapPage = ({ viewMode }) => {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heatmapView, setHeatmapView] = useState('2d'); // '2d' or '3d'

  const fetchIndices = async () => {
    try {
      const res = await axios.get(`${API}/market/indices`);
      setIndices(res.data);
    } catch (e) {
      console.error("Error fetching indices:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingState />;

  const isBloomberg = viewMode === 'wellington';
  const isNautical = viewMode === 'nautical';
  const regions = {
    'US': indices.filter(i => i.region === 'US'),
    'Europe': indices.filter(i => ['UK', 'Germany', 'France'].includes(i.region)),
    'Asia': indices.filter(i => ['Japan', 'Hong Kong', 'China', 'South Korea', 'India'].includes(i.region)),
    'Other': indices.filter(i => ['Australia', 'Canada', 'Brazil', 'Russia'].includes(i.region)),
  };

  const getHeatColor = (change) => {
    if (change >= 2) return isBloomberg ? 'bg-[#00ff00]' : 'bg-[#00e676]';
    if (change >= 0.5) return isBloomberg ? 'bg-[#00cc00]' : 'bg-[#00e676]/70';
    if (change >= 0) return isBloomberg ? 'bg-[#009900]' : 'bg-[#00e676]/40';
    if (change >= -0.5) return isBloomberg ? 'bg-[#990000]' : 'bg-[#ef4444]/40';
    if (change >= -2) return isBloomberg ? 'bg-[#cc0000]' : 'bg-[#ef4444]/70';
    return isBloomberg ? 'bg-[#ff0000]' : 'bg-[#ef4444]';
  };

  const getTextColor = (change) => {
    return change >= 0 ? (isBloomberg ? 'text-[#00ff00]' : 'text-profit') : (isBloomberg ? 'text-[#ff0000]' : 'text-loss');
  };

  return (
    <div data-testid="global-heatmap-page" className={isBloomberg ? 'font-mono' : ''}>
      <div className="page-header">
        <div>
          <h1 className="page-title">GLOBAL MARKET HEATMAP</h1>
          <p className="page-subtitle">Real-time worldwide index performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#27272a] rounded-sm overflow-hidden">
            <button 
              onClick={() => setHeatmapView('2d')}
              className={`px-3 py-1.5 text-[10px] uppercase ${heatmapView === '2d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
              data-testid="heatmap-view-2d"
            >
              2D Grid
            </button>
            <button 
              onClick={() => setHeatmapView('3d')}
              className={`px-3 py-1.5 text-[10px] uppercase ${heatmapView === '3d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
              data-testid="heatmap-view-3d"
            >
              3D Bars
            </button>
          </div>
          <button onClick={fetchIndices} className="btn-quant px-3 py-2 flex items-center gap-2">
            <RefreshCw size={14} strokeWidth={1.5} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(regions).map(([region, data]) => {
          const avgChange = data.reduce((a, b) => a + b.change_percent, 0) / data.length;
          return (
            <div key={region} className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#333]' : ''}`}>
              <div className="p-4">
                <div className="text-xs text-[#71717a] uppercase mb-1">{region}</div>
                <div className={`font-mono text-2xl font-semibold ${getTextColor(avgChange)}`}>
                  {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                </div>
                <div className="text-xs text-[#71717a]">{data.length} indices</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap Grid */}
      <div className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#333]' : ''}`}>
        <div className={`quant-card-header ${isBloomberg ? 'bg-[#333] text-[#ff6600]' : ''}`}>
          FINANCIAL WORLD HEATMAP {heatmapView === '3d' && '• 3D View'}
        </div>
        
        {heatmapView === '3d' ? (
          <MarketIndices3D indices={indices} height={450} />
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-4 gap-3">
              {indices.map((idx) => (
                <div
                  key={idx.symbol}
                  className={`p-4 rounded-sm ${getHeatColor(idx.change_percent)} transition-all hover:scale-105 cursor-pointer`}
                  data-testid={`heatmap-${idx.symbol}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-bold text-sm ${Math.abs(idx.change_percent) > 1 ? 'text-black' : 'text-white'}`}>
                      {idx.symbol}
                    </span>
                    <span className={`text-xs ${Math.abs(idx.change_percent) > 1 ? 'text-black/70' : 'text-white/70'}`}>
                      {idx.region}
                    </span>
                  </div>
                  <div className={`font-mono text-lg font-bold ${Math.abs(idx.change_percent) > 1 ? 'text-black' : 'text-white'}`}>
                    {idx.change_percent >= 0 ? '+' : ''}{idx.change_percent.toFixed(2)}%
                  </div>
                  <div className={`text-xs ${Math.abs(idx.change_percent) > 1 ? 'text-black/70' : 'text-white/70'}`}>
                    {idx.name}
                  </div>
                  <div className={`font-mono text-xs mt-1 ${Math.abs(idx.change_percent) > 1 ? 'text-black/60' : 'text-white/60'}`}>
                    {idx.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Index Table */}
      <div className={`quant-card mt-4 ${isBloomberg ? 'bg-[#000] border-[#333]' : ''}`}>
        <div className={`quant-card-header ${isBloomberg ? 'bg-[#333] text-[#ff6600]' : ''}`}>
          DETAILED INDEX DATA
        </div>
        <table className="quant-table">
          <thead>
            <tr className={isBloomberg ? 'bg-[#111]' : ''}>
              <th>Symbol</th>
              <th>Name</th>
              <th>Region</th>
              <th>Value</th>
              <th>Change</th>
              <th>% Change</th>
              <th>YTD</th>
            </tr>
          </thead>
          <tbody>
            {indices.sort((a, b) => b.change_percent - a.change_percent).map((idx) => (
              <tr key={idx.symbol} className={isBloomberg ? 'hover:bg-[#111]' : ''}>
                <td className={`font-medium ${isBloomberg ? 'text-[#00ffff]' : 'text-[#3b82f6]'}`}>{idx.symbol}</td>
                <td>{idx.name}</td>
                <td>{idx.region}</td>
                <td className="font-mono">{idx.value.toLocaleString()}</td>
                <td className={`font-mono ${getTextColor(idx.change)}`}>
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}
                </td>
                <td className={`font-mono ${getTextColor(idx.change_percent)}`}>
                  {idx.change_percent >= 0 ? '+' : ''}{idx.change_percent.toFixed(2)}%
                </td>
                <td className={`font-mono ${getTextColor(idx.ytd_percent)}`}>
                  {idx.ytd_percent >= 0 ? '+' : ''}{idx.ytd_percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== AUTOMATION HUB PAGE ==============
const AutomationHubPage = ({ viewMode }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysis, setAnalysis] = useState({});

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await axios.get(`${API}/automation/modules`);
        setModules(res.data);
      } catch (e) {
        console.error("Error fetching automation modules:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  const analyzeModule = async (moduleId) => {
    setAnalyzing(moduleId);
    try {
      const res = await axios.post(`${API}/automation/modules/${moduleId}/analyze`);
      setAnalysis(prev => ({ ...prev, [moduleId]: res.data.analysis }));
    } catch (e) {
      console.error("Error analyzing module:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'CORE': Cpu,
      'DATA': Database,
      'RISK': Shield,
      'OPS': Workflow,
      'IR': Users
    };
    return icons[category] || Bot;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'CORE': '#3b82f6',
      'DATA': '#8b5cf6',
      'RISK': '#ef4444',
      'OPS': '#f59e0b',
      'IR': '#00e676'
    };
    return colors[category] || '#71717a';
  };

  if (loading) return <LoadingState />;

  const isBloomberg = viewMode === 'wellington';
  const isNautical = viewMode === 'nautical';

  return (
    <div data-testid="automation-hub-page" className={isBloomberg ? 'font-mono' : ''}>
      <div className="page-header">
        <div>
          <h1 className="page-title">HEDGE FUND AUTOMATION HUB</h1>
          <p className="page-subtitle">Enterprise automation modules for fund operations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <span className="text-xs text-[#71717a]">{modules.filter(m => m.status === 'ACTIVE').length}/{modules.length} Active</span>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {modules.map((module) => {
          const IconComponent = getCategoryIcon(module.category);
          const color = getCategoryColor(module.category);
          const hasAnalysis = analysis[module.id];
          
          return (
            <div 
              key={module.id} 
              className={`quant-card cursor-pointer hover:border-[${color}]/50 transition-all ${
                selectedModule?.id === module.id ? `border-[${color}]` : ''
              } ${isBloomberg ? 'bg-[#000]' : ''}`}
              onClick={() => setSelectedModule(module)}
              data-testid={`automation-module-${module.id}`}
            >
              <div className="quant-card-header flex items-center justify-between" style={{ borderColor: `${color}30` }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <IconComponent size={16} style={{ color }} strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-[#ededed] normal-case text-sm">{module.name}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${module.status === 'ACTIVE' ? 'bg-[#00e676] animate-pulse' : 'bg-[#71717a]'}`} />
              </div>
              
              <div className="p-4">
                <p className="text-xs text-[#a1a1aa] mb-4 line-clamp-2">{module.description}</p>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {Object.entries(module.metrics).slice(0, 4).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-[9px] uppercase text-[#71717a]">{key.replace(/_/g, ' ')}</div>
                      <div className={`font-mono text-sm ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                        {typeof value === 'number' ? (value < 1 ? (value * 100).toFixed(1) + '%' : value.toLocaleString()) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                {module.alerts.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-1 rounded">
                    <AlertTriangle size={12} />
                    <span>{module.alerts[0]}</span>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-[#000] border-t border-[#27272a] flex justify-between items-center">
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
                  {module.category}
                </span>
                <span className="text-[10px] text-[#71717a]">
                  Last: {new Date(module.last_run).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Module Analysis */}
      {selectedModule && (
        <div className={`quant-card ${isBloomberg ? 'bg-[#000]' : ''}`}>
          <div className="quant-card-header flex justify-between items-center">
            <span>{selectedModule.name} - Detailed Analysis</span>
            <button
              onClick={() => analyzeModule(selectedModule.id)}
              disabled={analyzing === selectedModule.id}
              className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
              data-testid={`analyze-module-${selectedModule.id}`}
            >
              {analyzing === selectedModule.id ? (
                <><RefreshCw size={12} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Brain size={12} /> Get AI Optimization</>
              )}
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs uppercase text-[#71717a] mb-3">Full Description</h4>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{selectedModule.description}</p>
                
                <h4 className="text-xs uppercase text-[#71717a] mt-4 mb-3">All Metrics</h4>
                <div className="space-y-2">
                  {Object.entries(selectedModule.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-xs text-[#71717a] capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className={`font-mono text-sm ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                        {typeof value === 'number' ? (value < 1 && value > 0 ? (value * 100).toFixed(1) + '%' : value.toLocaleString()) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                {analysis[selectedModule.id] ? (
                  <div>
                    <h4 className="text-xs uppercase text-[#71717a] mb-3 flex items-center gap-2">
                      <Brain size={12} className="text-[#3b82f6]" />
                      AI Optimization Analysis
                    </h4>
                    <div className={`text-sm whitespace-pre-wrap leading-relaxed bg-[#000] border border-[#27272a] rounded p-4 max-h-[400px] overflow-y-auto ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                      {analysis[selectedModule.id]}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#71717a] text-sm">
                    Click "Get AI Optimization" for performance recommendations
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============== QUANT DASHBOARD ==============
const QuantDashboard = ({ viewMode }) => {
  const [marketData, setMarketData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("SPY");
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('2d'); // '2d' or '3d'

  const fetchData = useCallback(async () => {
    try {
      const [marketRes, chartRes] = await Promise.all([
        axios.get(`${API}/market/data`),
        axios.get(`${API}/market/chart/${selectedSymbol}`)
      ]);
      setMarketData(marketRes.data);
      setChartData(chartRes.data.data);
    } catch (e) {
      console.error("Error fetching market data:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const isNautical = viewMode === 'nautical';

  if (loading) return <LoadingState />;

  return (
    <div data-testid="quant-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quant Dashboard</h1>
          <p className="page-subtitle">Real-time market data & analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#27272a] rounded-sm overflow-hidden">
            <button 
              onClick={() => setChartView('2d')}
              className={`px-3 py-1.5 text-[10px] uppercase ${chartView === '2d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
              data-testid="chart-view-2d"
            >
              2D
            </button>
            <button 
              onClick={() => setChartView('3d')}
              className={`px-3 py-1.5 text-[10px] uppercase ${chartView === '3d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
              data-testid="chart-view-3d"
            >
              3D Surface
            </button>
          </div>
          <button onClick={fetchData} className="btn-quant px-3 py-2 flex items-center gap-2">
            <RefreshCw size={14} strokeWidth={1.5} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Asset List */}
        <div className="col-span-3 quant-card" data-testid="asset-list">
          <div className="quant-card-header">Assets</div>
          <div className="max-h-[600px] overflow-y-auto">
            {marketData.map((asset, i) => (
              <div
                key={i}
                onClick={() => setSelectedSymbol(asset.symbol)}
                className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 ${
                  selectedSymbol === asset.symbol ? 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]' : ''
                }`}
                data-testid={`asset-${asset.symbol}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm font-medium">{asset.symbol}</span>
                  <span className={`font-mono text-sm ${asset.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change_percent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="font-mono text-xs text-[#71717a]">${asset.price.toLocaleString()}</span>
                  <span className="font-mono text-xs text-[#71717a]">Vol: {(asset.volume / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chart */}
        <div className="col-span-6 quant-card" data-testid="main-chart">
          <div className="quant-card-header flex justify-between items-center">
            <span>{selectedSymbol} - {chartView === '3d' ? '3D Price Terrain' : 'Price Chart'}</span>
            <div className="flex gap-2">
              {['1D', '1W', '1M'].map(period => (
                <button key={period} className="px-2 py-1 text-[10px] btn-quant">
                  {period}
                </button>
              ))}
            </div>
          </div>
          
          {chartView === '3d' ? (
            <PriceHistory3D chartData={chartData} height={550} />
          ) : (
            <>
              <div className="p-4 h-[400px] chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.slice(-50)}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isNautical ? "#0ea5e9" : "#3b82f6"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isNautical ? "#0ea5e9" : "#3b82f6"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '2px' }}
                      labelStyle={{ color: '#71717a' }}
                      itemStyle={{ color: isNautical ? '#0ea5e9' : '#3b82f6' }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                    />
                    <Area type="monotone" dataKey="close" stroke={isNautical ? "#0ea5e9" : "#3b82f6"} fill="url(#colorPrice)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 h-[150px] chart-container border-t border-[#27272a]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-50)}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '2px' }}
                      formatter={(value) => [value.toLocaleString(), 'Volume']}
                    />
                    <Bar dataKey="volume" fill="#27272a">
                      {chartData.slice(-50).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#00e676' : '#ef4444'} fillOpacity={0.5} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Order Book / Stats */}
        <div className="col-span-3 space-y-4">
          <div className="quant-card" data-testid="price-stats">
            <div className="quant-card-header">Price Stats</div>
            <div className="p-4 space-y-3">
              <StatRow label="Open" value={`$${chartData[0]?.open?.toFixed(2) || '-'}`} />
              <StatRow label="High" value={`$${Math.max(...chartData.map(d => d.high)).toFixed(2)}`} />
              <StatRow label="Low" value={`$${Math.min(...chartData.map(d => d.low)).toFixed(2)}`} />
              <StatRow label="Close" value={`$${chartData[chartData.length - 1]?.close?.toFixed(2) || '-'}`} />
            </div>
          </div>
          <div className="quant-card" data-testid="quick-stats">
            <div className="quant-card-header">Quick Stats</div>
            <div className="p-4 space-y-3">
              <StatRow label="24h Volume" value="$1.2B" />
              <StatRow label="Avg Volume" value="$890M" />
              <StatRow label="52w High" value="$185.50" />
              <StatRow label="52w Low" value="$120.30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== MACRO REGIME ==============
const MacroRegime = ({ viewMode }) => {
  const [regimeData, setRegimeData] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [correlationView, setCorrelationView] = useState('2d'); // '2d' or '3d'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regimeRes, corrRes] = await Promise.all([
          axios.get(`${API}/macro/regime`),
          axios.get(`${API}/macro/correlation`)
        ]);
        setRegimeData(regimeRes.data);
        setCorrelation(corrRes.data);
      } catch (e) {
        console.error("Error fetching macro data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div data-testid="macro-regime">
      <div className="page-header">
        <div>
          <h1 className="page-title">Macro Regime</h1>
          <p className="page-subtitle">Economic indicators & market regime</p>
        </div>
        <div className="flex border border-[#27272a] rounded-sm overflow-hidden">
          <button 
            onClick={() => setCorrelationView('2d')}
            className={`px-3 py-1.5 text-[10px] uppercase ${correlationView === '2d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
            data-testid="correlation-view-2d"
          >
            2D Matrix
          </button>
          <button 
            onClick={() => setCorrelationView('3d')}
            className={`px-3 py-1.5 text-[10px] uppercase ${correlationView === '3d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
            data-testid="correlation-view-3d"
          >
            3D Surface
          </button>
        </div>
      </div>

      <div className="bento-grid bento-grid-4 mb-6">
        <div className="quant-card col-span-2">
          <div className="quant-card-header">Current Regime</div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <div className={`regime-indicator ${regimeData?.current_regime === 'RISK_ON' ? 'risk-on' : regimeData?.current_regime === 'RISK_OFF' ? 'risk-off' : ''}`}>
                {regimeData?.current_regime?.replace('_', ' ')}
              </div>
              <p className="text-xs text-[#71717a] mt-2">
                Confidence: {(regimeData?.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-semibold text-[#ededed]">
                {(regimeData?.confidence * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-[#71717a]">Model Confidence</p>
            </div>
          </div>
        </div>
        
        {regimeData?.indicators?.slice(0, 2).map((indicator, i) => (
          <MetricCard
            key={i}
            label={indicator.name}
            value={indicator.value.toFixed(2)}
            change={((indicator.value - indicator.previous) / indicator.previous * 100).toFixed(2)}
          />
        ))}
      </div>

      <div className="bento-grid bento-grid-2 mb-6">
        <div className="quant-card">
          <div className="quant-card-header">Economic Indicators</div>
          <table className="quant-table">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Current</th>
                <th>Previous</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {regimeData?.indicators?.map((ind, i) => (
                <tr key={i}>
                  <td>{ind.name}</td>
                  <td>{ind.value.toFixed(2)}</td>
                  <td className="text-[#71717a]">{ind.previous.toFixed(2)}</td>
                  <td>
                    {ind.trend === 'up' ? (
                      <ArrowUpRight className="text-profit" size={14} />
                    ) : (
                      <ArrowDownRight className="text-loss" size={14} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="quant-card">
          <div className="quant-card-header">
            Correlation Matrix {correlationView === '3d' && '• 3D Surface'}
          </div>
          
          {correlationView === '3d' ? (
            <CorrelationMatrix3D 
              matrix={correlation?.matrix} 
              assets={correlation?.assets} 
              height={350}
            />
          ) : (
            <div className="p-4 overflow-x-auto">
              <table className="quant-table text-xs">
                <thead>
                  <tr>
                    <th></th>
                    {correlation?.assets?.map((asset, i) => (
                      <th key={i} className="text-center">{asset}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlation?.assets?.map((asset, i) => (
                    <tr key={i}>
                      <td className="font-medium">{asset}</td>
                      {correlation?.assets?.map((other, j) => {
                        const val = correlation?.matrix?.[asset]?.[other];
                        const color = val === 1 ? '#3b82f6' : val > 0 ? `rgba(0, 230, 118, ${Math.abs(val)})` : `rgba(239, 68, 68, ${Math.abs(val)})`;
                        return (
                          <td key={j} className="text-center" style={{ background: color, color: Math.abs(val) > 0.5 ? '#000' : '#ededed' }}>
                            {val?.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== WORLD INTEL MAP ==============
const WorldIntel = ({ viewMode }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const globeRef = useCallback(node => {
    if (node !== null) {
      // Auto-rotate the globe
      node.controls().autoRotate = true;
      node.controls().autoRotateSpeed = 0.5;
      node.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API}/intel/events`);
        setEvents(res.data);
      } catch (e) {
        console.error("Error fetching intel events:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Focus globe on selected event
  useEffect(() => {
    if (selectedEvent && globeRef.current) {
      globeRef.current.pointOfView({
        lat: selectedEvent.lat,
        lng: selectedEvent.lng,
        altitude: 1.5
      }, 1000);
    }
  }, [selectedEvent]);

  const isNautical = viewMode === 'nautical';
  const isWellington = viewMode === 'wellington';

  // Globe colors based on view mode
  const globeColors = {
    modern: { globe: '#0a0a0a', land: '#1a1a2e', border: '#3b82f6', glow: '#3b82f6' },
    wellington: { globe: '#000000', land: '#1a1a00', border: '#ff6600', glow: '#ff6600' },
    nautical: { globe: '#0c1222', land: '#1e3a5f', border: '#0ea5e9', glow: '#22d3ee' }
  };
  const colors = globeColors[viewMode] || globeColors.modern;

  // Event marker colors by severity
  const getMarkerColor = (severity) => {
    if (severity === 'HIGH') return '#ef4444';
    if (severity === 'MEDIUM') return '#f59e0b';
    return isNautical ? '#22d3ee' : '#3b82f6';
  };

  // Convert events to globe points format
  const pointsData = events.map(event => ({
    ...event,
    lat: event.lat,
    lng: event.lng,
    size: event.severity === 'HIGH' ? 0.8 : event.severity === 'MEDIUM' ? 0.6 : 0.4,
    color: getMarkerColor(event.severity)
  }));

  // Ring data for pulsing effect on selected event
  const ringsData = selectedEvent ? [{
    lat: selectedEvent.lat,
    lng: selectedEvent.lng,
    maxR: 5,
    propagationSpeed: 2,
    repeatPeriod: 1000,
    color: getMarkerColor(selectedEvent.severity)
  }] : [];

  // Arc data to show connections between events
  const arcsData = events.length > 1 ? events.slice(0, -1).map((event, i) => ({
    startLat: event.lat,
    startLng: event.lng,
    endLat: events[i + 1].lat,
    endLng: events[i + 1].lng,
    color: isNautical ? ['#22d3ee', '#0ea5e9'] : ['#3b82f6', '#00e676']
  })) : [];

  if (loading) return <LoadingState />;

  return (
    <div data-testid="world-intel">
      <div className="page-header">
        <div>
          <h1 className="page-title">WORLD INTEL MAP</h1>
          <p className="page-subtitle">Global market intelligence & events • 3D Interactive Globe</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-[#71717a]">High</span>
            <div className="w-2 h-2 rounded-full bg-[#f59e0b] ml-2" />
            <span className="text-[#71717a]">Medium</span>
            <div className={`w-2 h-2 rounded-full ${isNautical ? 'bg-[#22d3ee]' : 'bg-[#3b82f6]'} ml-2`} />
            <span className="text-[#71717a]">Low</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* 3D Globe */}
        <div className="col-span-8">
          <div 
            className={`quant-card overflow-hidden ${isNautical ? 'border-[#1e3a5f]' : ''}`} 
            style={{ height: '600px' }}
            data-testid="intel-globe"
          >
            <div className="quant-card-header flex justify-between items-center">
              <span>INTERACTIVE GLOBE</span>
              <span className="text-[10px] text-[#71717a]">{events.length} Active Events</span>
            </div>
            <div style={{ height: 'calc(100% - 40px)', background: colors.globe }}>
              <GlobeGL
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                
                pointsData={pointsData}
                pointAltitude={d => d.size * 0.1}
                pointRadius={d => d.size * 0.5}
                pointColor={d => d.color}
                pointLabel={d => `
                  <div style="background: #0a0a0a; border: 1px solid #27272a; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 11px;">
                    <div style="color: ${d.color}; font-weight: bold; margin-bottom: 4px;">${d.title}</div>
                    <div style="color: #71717a;">${d.region} • ${d.event_type}</div>
                  </div>
                `}
                onPointClick={(point) => setSelectedEvent(point)}
                
                ringsData={ringsData}
                ringColor={() => colors.glow}
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={2000}
                arcStroke={0.5}
                
                atmosphereColor={colors.glow}
                atmosphereAltitude={0.15}
                
                width={window.innerWidth * 0.55}
                height={560}
              />
            </div>
          </div>
        </div>

        {/* Event Details & List */}
        <div className="col-span-4 space-y-4">
          {/* Selected Event Card */}
          {selectedEvent && (
            <div className={`quant-card ${isNautical ? 'border-[#1e3a5f]' : ''}`} data-testid="selected-event">
              <div className="quant-card-header flex justify-between items-center">
                <span>EVENT DETAILS</span>
                <button onClick={() => setSelectedEvent(null)} className="text-[#71717a] hover:text-white">
                  <XCircle size={14} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    selectedEvent.severity === 'HIGH' ? 'badge-rejected' : 
                    selectedEvent.severity === 'MEDIUM' ? 'badge-pending' : 'badge-processing'
                  }`}>
                    {selectedEvent.severity}
                  </span>
                  <span className="text-xs text-[#71717a]">{selectedEvent.event_type}</span>
                </div>
                <h3 className="font-semibold text-[#ededed]">{selectedEvent.title}</h3>
                <p className="text-sm text-[#a1a1aa]">{selectedEvent.description}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27272a]">
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a]">Coordinates</div>
                    <div className="font-mono text-xs">
                      {selectedEvent.lat.toFixed(4)}°, {selectedEvent.lng.toFixed(4)}°
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a]">Region</div>
                    <div className="font-mono text-xs">{selectedEvent.region}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event Stats */}
          <div className={`quant-card ${isNautical ? 'border-[#1e3a5f]' : ''}`}>
            <div className="quant-card-header">EVENT STATISTICS</div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="font-mono text-xl font-semibold text-[#ef4444]">
                  {events.filter(e => e.severity === 'HIGH').length}
                </div>
                <div className="text-[10px] text-[#71717a] uppercase">High</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-xl font-semibold text-[#f59e0b]">
                  {events.filter(e => e.severity === 'MEDIUM').length}
                </div>
                <div className="text-[10px] text-[#71717a] uppercase">Medium</div>
              </div>
              <div className="text-center">
                <div className={`font-mono text-xl font-semibold ${isNautical ? 'text-[#22d3ee]' : 'text-[#3b82f6]'}`}>
                  {events.filter(e => e.severity === 'LOW').length}
                </div>
                <div className="text-[10px] text-[#71717a] uppercase">Low</div>
              </div>
            </div>
          </div>

          {/* Recent Events List */}
          <div className={`quant-card ${isNautical ? 'border-[#1e3a5f]' : ''}`}>
            <div className="quant-card-header">RECENT EVENTS</div>
            <div className="max-h-[300px] overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 transition-colors ${
                    selectedEvent?.id === event.id ? (isNautical ? 'bg-[#0ea5e9]/10 border-l-2 border-l-[#0ea5e9]' : 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]') : ''
                  }`}
                  data-testid={`event-${event.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'HIGH' ? 'bg-[#ef4444]' : 
                      event.severity === 'MEDIUM' ? 'bg-[#f59e0b]' : 
                      isNautical ? 'bg-[#22d3ee]' : 'bg-[#3b82f6]'
                    }`} />
                    <span className="font-mono text-[10px] text-[#71717a]">{event.event_type}</span>
                    <span className="ml-auto font-mono text-[10px] text-[#71717a]">
                      {event.lat.toFixed(1)}°, {event.lng.toFixed(1)}°
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-[#71717a] mt-1">{event.region}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== TERMINAL ==============
const Terminal = () => {
  const [history, setHistory] = useState([
    { type: 'system', content: 'QuantFlow Terminal v1.0.0' },
    { type: 'system', content: 'Type "help" for available commands.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const executeCommand = async () => {
    if (!input.trim()) return;
    
    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'input', content: cmd }]);
    setInput('');
    
    if (cmd === 'clear') {
      setHistory([{ type: 'system', content: 'Terminal cleared.' }]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/terminal/execute`, { command: cmd });
      const data = res.data;
      
      if (data.type === 'help') {
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: data.commands.map(c => `  ${c.cmd.padEnd(20)} - ${c.desc}`).join('\n')
        }]);
      } else if (data.type === 'error') {
        setHistory(prev => [...prev, { type: 'error', content: data.message }]);
      } else if (data.type === 'price') {
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: `${data.data.symbol}: $${data.data.price} (${data.data.change >= 0 ? '+' : ''}${data.data.change_percent}%)`
        }]);
      } else if (data.type === 'regime') {
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: `Current Regime: ${data.data.current_regime}\nConfidence: ${(data.data.confidence * 100).toFixed(0)}%`
        }]);
      } else if (data.type === 'health') {
        const healthStr = data.data.map(h => `  ${h.service.padEnd(20)} [${h.status}] ${h.latency_ms}ms`).join('\n');
        setHistory(prev => [...prev, { type: 'output', content: healthStr }]);
      } else if (data.type === 'alerts') {
        const alertStr = data.data.map(a => `  [${a.level}] ${a.message}`).join('\n');
        setHistory(prev => [...prev, { type: 'output', content: alertStr || 'No active alerts.' }]);
      }
    } catch (e) {
      setHistory(prev => [...prev, { type: 'error', content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="terminal-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Terminal</h1>
          <p className="page-subtitle">Command-line interface</p>
        </div>
      </div>

      <div className="terminal-container rounded-sm border border-[#27272a] h-[600px] flex flex-col" data-testid="terminal-container">
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {history.map((item, i) => (
            <div key={i} className={`font-mono text-sm whitespace-pre-wrap ${
              item.type === 'input' ? 'terminal-prompt' : 
              item.type === 'error' ? 'terminal-error' : 'terminal-output'
            }`}>
              {item.type === 'input' && <span className="text-[#00e676]">$ </span>}
              {item.content}
            </div>
          ))}
          {loading && <div className="terminal-output animate-pulse">Processing...</div>}
        </div>
        <div className="border-t border-[#27272a] p-4 flex items-center gap-2">
          <span className="terminal-prompt">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-[#ededed]"
            placeholder="Enter command..."
            disabled={loading}
            data-testid="terminal-input"
          />
        </div>
      </div>
    </div>
  );
};

// ============== RESEARCH QUEUE ==============
const ResearchQueue = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', tags: [] });
  const [analyzing, setAnalyzing] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/research/tasks`);
      setTasks(res.data);
    } catch (e) {
      console.error("Error fetching tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async () => {
    try {
      await axios.post(`${API}/research/tasks`, newTask);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', tags: [] });
      setShowCreate(false);
      fetchTasks();
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const analyzeTask = async (taskId) => {
    setAnalyzing(taskId);
    try {
      await axios.post(`${API}/research/tasks/${taskId}/analyze`);
      fetchTasks();
    } catch (e) {
      console.error("Error analyzing task:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/research/tasks/${taskId}`);
      fetchTasks();
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="research-queue">
      <div className="page-header">
        <div>
          <h1 className="page-title">Research Queue</h1>
          <p className="page-subtitle">AI-powered research analysis</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-quant px-3 py-2 flex items-center gap-2" data-testid="create-task-btn">
          <Plus size={14} strokeWidth={1.5} />
          <span>New Task</span>
        </button>
      </div>

      {showCreate && (
        <div className="quant-card mb-6" data-testid="create-task-form">
          <div className="quant-card-header">Create Research Task</div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 rounded-sm text-sm"
              data-testid="task-title-input"
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 rounded-sm text-sm min-h-[100px]"
              data-testid="task-description-input"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="px-3 py-2 rounded-sm text-sm"
              data-testid="task-priority-select"
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <div className="flex gap-2">
              <button onClick={createTask} className="btn-quant btn-quant-approve px-4 py-2" data-testid="submit-task-btn">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn-quant px-4 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="quant-card p-8 text-center text-[#71717a]">
            No research tasks. Create one to get started.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="quant-card" data-testid={`task-${task.id}`}>
              <div className="quant-card-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded badge-${task.status.toLowerCase()}`}>
                    {task.status}
                  </span>
                  <span className="text-xs text-[#71717a]">{task.priority}</span>
                </div>
                <div className="flex gap-2">
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => analyzeTask(task.id)}
                      disabled={analyzing === task.id}
                      className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                      data-testid={`analyze-btn-${task.id}`}
                    >
                      {analyzing === task.id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                      Analyze
                    </button>
                  )}
                  <button onClick={() => deleteTask(task.id)} className="btn-quant btn-quant-reject px-2 py-1" data-testid={`delete-btn-${task.id}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[#ededed] mb-2">{task.title}</h3>
                <p className="text-sm text-[#a1a1aa] mb-3">{task.description}</p>
                {task.ai_analysis && (
                  <div className="bg-[#000] border border-[#27272a] rounded-sm p-3 mt-3">
                    <div className="text-xs text-[#71717a] mb-2 uppercase">AI Analysis</div>
                    <p className="text-sm text-[#ededed] whitespace-pre-wrap">{task.ai_analysis}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============== APPROVALS ==============
const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const res = await axios.get(`${API}/approvals`);
      setApprovals(res.data);
    } catch (e) {
      console.error("Error fetching approvals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await axios.post(`${API}/approvals/${id}/action`, { action });
      fetchApprovals();
    } catch (e) {
      console.error("Error processing approval:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="approvals-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">Review & approve pending requests</p>
        </div>
      </div>

      <div className="quant-card">
        <table className="quant-table" data-testid="approvals-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Request</th>
              <th>Requester</th>
              <th>Amount</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((approval) => (
              <tr key={approval.id} data-testid={`approval-${approval.id}`}>
                <td>
                  <span className="px-2 py-1 text-xs bg-[#27272a] rounded">{approval.type}</span>
                </td>
                <td>
                  <div>
                    <p className="font-medium">{approval.title}</p>
                    <p className="text-xs text-[#71717a]">{approval.description}</p>
                  </div>
                </td>
                <td>{approval.requester}</td>
                <td>{approval.amount ? `$${(approval.amount / 1000).toFixed(0)}K` : '-'}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${approval.risk_score > 0.6 ? 'bg-[#ef4444]' : approval.risk_score > 0.3 ? 'bg-[#f59e0b]' : 'bg-[#00e676]'}`} />
                    <span>{(approval.risk_score * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td>
                  <span className={`px-2 py-1 text-xs rounded badge-${approval.status.toLowerCase()}`}>
                    {approval.status}
                  </span>
                </td>
                <td>
                  {approval.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(approval.id, 'approve')}
                        className="btn-quant btn-quant-approve px-3 py-1 text-xs"
                        data-testid={`approve-btn-${approval.id}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(approval.id, 'reject')}
                        className="btn-quant btn-quant-reject px-3 py-1 text-xs"
                        data-testid={`reject-btn-${approval.id}`}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== SYSTEM HEALTH ==============
const SystemHealth = () => {
  const [health, setHealth] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const [healthRes, alertsRes] = await Promise.all([
        axios.get(`${API}/system/health`),
        axios.get(`${API}/system/alerts`)
      ]);
      setHealth(healthRes.data);
      setAlerts(alertsRes.data);
    } catch (e) {
      console.error("Error fetching health:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingState />;

  const healthyCount = health.filter(h => h.status === 'HEALTHY').length;

  return (
    <div data-testid="system-health">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Health</h1>
          <p className="page-subtitle">Infrastructure monitoring & alerts</p>
        </div>
        <button onClick={fetchHealth} className="btn-quant px-3 py-2 flex items-center gap-2">
          <RefreshCw size={14} strokeWidth={1.5} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bento-grid bento-grid-4 mb-6">
        <MetricCard label="Services Healthy" value={`${healthyCount}/${health.length}`} />
        <MetricCard label="Avg Latency" value={`${(health.reduce((a, b) => a + b.latency_ms, 0) / health.length).toFixed(0)}ms`} />
        <MetricCard label="Active Alerts" value={alerts.length} />
        <MetricCard label="System Uptime" value="99.9%" />
      </div>

      {alerts.length > 0 && (
        <div className="quant-card mb-6" data-testid="alerts-card">
          <div className="quant-card-header flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#f59e0b]" />
            <span>Active Alerts</span>
          </div>
          <div className="p-4 space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-center gap-3 p-2 rounded ${alert.level === 'WARNING' ? 'bg-[#f59e0b]/10' : 'bg-[#3b82f6]/10'}`}>
                {alert.level === 'WARNING' ? <AlertTriangle size={14} className="text-[#f59e0b]" /> : <Bell size={14} className="text-[#3b82f6]" />}
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quant-card">
        <div className="quant-card-header">Service Status</div>
        <table className="quant-table" data-testid="health-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Status</th>
              <th>Latency</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Uptime</th>
            </tr>
          </thead>
          <tbody>
            {health.map((svc, i) => (
              <tr key={i}>
                <td className="font-medium">{svc.service}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${svc.status === 'HEALTHY' ? 'status-healthy' : svc.status === 'DEGRADED' ? 'status-degraded' : 'status-down'}`} />
                    <span>{svc.status}</span>
                  </div>
                </td>
                <td>{svc.latency_ms}ms</td>
                <td>{svc.cpu_usage}%</td>
                <td>{svc.memory_usage}%</td>
                <td>{svc.uptime_hours.toFixed(0)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== AUTOMATION V1 (Rule-based) ==============
const AutomationV1 = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    condition_type: 'PRICE_ABOVE',
    condition_value: 0,
    action_type: 'ALERT',
    action_value: ''
  });

  const fetchRules = async () => {
    try {
      const res = await axios.get(`${API}/automation/rules`);
      setRules(res.data);
    } catch (e) {
      console.error("Error fetching rules:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const createRule = async () => {
    try {
      await axios.post(`${API}/automation/rules`, newRule);
      setNewRule({ name: '', condition_type: 'PRICE_ABOVE', condition_value: 0, action_type: 'ALERT', action_value: '' });
      setShowCreate(false);
      fetchRules();
    } catch (e) {
      console.error("Error creating rule:", e);
    }
  };

  const toggleRule = async (id) => {
    try {
      await axios.put(`${API}/automation/rules/${id}/toggle`);
      fetchRules();
    } catch (e) {
      console.error("Error toggling rule:", e);
    }
  };

  const deleteRule = async (id) => {
    try {
      await axios.delete(`${API}/automation/rules/${id}`);
      fetchRules();
    } catch (e) {
      console.error("Error deleting rule:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="automation-v1">
      <div className="page-header">
        <div>
          <h1 className="page-title">Automation V1</h1>
          <p className="page-subtitle">Simple rule-based automation</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-quant px-3 py-2 flex items-center gap-2" data-testid="create-rule-btn">
          <Plus size={14} strokeWidth={1.5} />
          <span>New Rule</span>
        </button>
      </div>

      {showCreate && (
        <div className="quant-card mb-6" data-testid="create-rule-form">
          <div className="quant-card-header">Create Automation Rule</div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Rule Name"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              className="w-full px-3 py-2 rounded-sm text-sm"
              data-testid="rule-name-input"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#71717a] block mb-1">IF Condition</label>
                <select
                  value={newRule.condition_type}
                  onChange={(e) => setNewRule({ ...newRule, condition_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm text-sm"
                >
                  <option value="PRICE_ABOVE">Price Above</option>
                  <option value="PRICE_BELOW">Price Below</option>
                  <option value="VOLUME_SPIKE">Volume Spike</option>
                  <option value="VOLATILITY_HIGH">Volatility High</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#71717a] block mb-1">Value</label>
                <input
                  type="number"
                  value={newRule.condition_value}
                  onChange={(e) => setNewRule({ ...newRule, condition_value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-sm text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#71717a] block mb-1">THEN Action</label>
                <select
                  value={newRule.action_type}
                  onChange={(e) => setNewRule({ ...newRule, action_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm text-sm"
                >
                  <option value="ALERT">Send Alert</option>
                  <option value="BUY">Buy Order</option>
                  <option value="SELL">Sell Order</option>
                  <option value="HEDGE">Hedge Position</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#71717a] block mb-1">Action Details</label>
                <input
                  type="text"
                  placeholder="e.g., BTC/USD"
                  value={newRule.action_value}
                  onChange={(e) => setNewRule({ ...newRule, action_value: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createRule} className="btn-quant btn-quant-approve px-4 py-2" data-testid="submit-rule-btn">Create Rule</button>
              <button onClick={() => setShowCreate(false)} className="btn-quant px-4 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="quant-card p-8 text-center text-[#71717a]">
            No automation rules. Create one to get started.
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="quant-card" data-testid={`rule-${rule.id}`}>
              <div className="quant-card-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-[#00e676]' : 'bg-[#71717a]'}`} />
                  <span className="font-medium">{rule.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                    data-testid={`toggle-rule-${rule.id}`}
                  >
                    {rule.enabled ? <Pause size={12} /> : <Play size={12} />}
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="btn-quant btn-quant-reject px-2 py-1" data-testid={`delete-rule-${rule.id}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="font-mono text-sm">
                  <span className="text-[#3b82f6]">IF</span>{' '}
                  <span className="text-[#f59e0b]">{rule.condition_type}</span>{' '}
                  <span className="text-[#ededed]">{rule.condition_value}</span>{' '}
                  <span className="text-[#3b82f6]">THEN</span>{' '}
                  <span className="text-[#00e676]">{rule.action_type}</span>{' '}
                  <span className="text-[#ededed]">{rule.action_value}</span>
                </div>
                <div className="text-xs text-[#71717a] mt-2">
                  Triggered: {rule.triggered_count} times
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============== AUTOMATION V2 (Strategy/Code-based) ==============
const AutomationV2 = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [code, setCode] = useState('');

  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${API}/automation/strategies`);
      setStrategies(res.data);
    } catch (e) {
      console.error("Error fetching strategies:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const createStrategy = async () => {
    try {
      const newStrategy = {
        name: `Strategy ${strategies.length + 1}`,
        code: `# New Trading Strategy\n\ndef on_data(data):\n    # Your strategy logic here\n    pass\n\ndef on_trade(trade):\n    pass`,
        language: 'python'
      };
      const res = await axios.post(`${API}/automation/strategies`, newStrategy);
      fetchStrategies();
      setSelectedStrategy(res.data);
      setCode(res.data.code);
    } catch (e) {
      console.error("Error creating strategy:", e);
    }
  };

  const saveStrategy = async () => {
    if (!selectedStrategy) return;
    try {
      await axios.put(`${API}/automation/strategies/${selectedStrategy.id}`, {
        ...selectedStrategy,
        code
      });
      fetchStrategies();
    } catch (e) {
      console.error("Error saving strategy:", e);
    }
  };

  const toggleStrategy = async (id) => {
    try {
      await axios.put(`${API}/automation/strategies/${id}/toggle`);
      fetchStrategies();
    } catch (e) {
      console.error("Error toggling strategy:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="automation-v2">
      <div className="page-header">
        <div>
          <h1 className="page-title">Automation V2</h1>
          <p className="page-subtitle">Advanced strategy development</p>
        </div>
        <button onClick={createStrategy} className="btn-quant px-3 py-2 flex items-center gap-2" data-testid="create-strategy-btn">
          <Plus size={14} strokeWidth={1.5} />
          <span>New Strategy</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Strategy List */}
        <div className="col-span-3 quant-card" data-testid="strategy-list">
          <div className="quant-card-header">Strategies</div>
          <div className="max-h-[600px] overflow-y-auto">
            {strategies.length === 0 ? (
              <div className="p-4 text-center text-[#71717a] text-sm">No strategies yet</div>
            ) : (
              strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  onClick={() => { setSelectedStrategy(strategy); setCode(strategy.code); }}
                  className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 ${
                    selectedStrategy?.id === strategy.id ? 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]' : ''
                  }`}
                  data-testid={`strategy-${strategy.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{strategy.name}</span>
                    <div className={`w-2 h-2 rounded-full ${strategy.enabled ? 'bg-[#00e676]' : 'bg-[#71717a]'}`} />
                  </div>
                  <div className="text-xs text-[#71717a] mt-1">{strategy.status}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="col-span-9 space-y-4">
          {selectedStrategy ? (
            <>
              <div className="quant-card">
                <div className="quant-card-header flex justify-between items-center">
                  <span>{selectedStrategy.name} - {selectedStrategy.language.toUpperCase()}</span>
                  <div className="flex gap-2">
                    <button onClick={saveStrategy} className="btn-quant btn-quant-approve px-3 py-1 text-xs" data-testid="save-strategy-btn">
                      Save
                    </button>
                    <button
                      onClick={() => toggleStrategy(selectedStrategy.id)}
                      className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                      data-testid="toggle-strategy-btn"
                    >
                      {selectedStrategy.enabled ? <Pause size={12} /> : <Play size={12} />}
                      {selectedStrategy.enabled ? 'Stop' : 'Deploy'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="code-editor w-full"
                  style={{ minHeight: '400px' }}
                  spellCheck={false}
                  data-testid="code-editor"
                />
              </div>
              <div className="quant-card">
                <div className="quant-card-header">Debug Console</div>
                <div className="p-4 terminal-container min-h-[150px] font-mono text-sm">
                  <div className="text-[#71717a]">[{new Date().toISOString()}] Strategy loaded: {selectedStrategy.name}</div>
                  <div className="text-[#00e676]">[{new Date().toISOString()}] Ready for deployment</div>
                </div>
              </div>
            </>
          ) : (
            <div className="quant-card p-12 text-center text-[#71717a]">
              Select a strategy or create a new one to start coding
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== HELPER COMPONENTS ==============
const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <RefreshCw className="animate-spin text-[#3b82f6]" size={24} />
  </div>
);

const MetricCard = ({ label, value, change, badge, badgeType }) => (
  <div className="metric-card" data-testid={`metric-${label?.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="metric-label">{label}</div>
    {badge ? (
      <div className={`regime-indicator text-sm ${badgeType === 'profit' ? 'risk-on' : 'risk-off'}`}>
        {value}
      </div>
    ) : (
      <div className="metric-value">{value}</div>
    )}
    {change !== undefined && (
      <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
        {change >= 0 ? <ArrowUpRight size={12} className="inline" /> : <ArrowDownRight size={12} className="inline" />}
        {change >= 0 ? '+' : ''}{change}%
      </div>
    )}
  </div>
);

const ActionItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={14} strokeWidth={1.5} className="text-[#71717a]" />
      <span className="text-sm text-[#a1a1aa]">{label}</span>
    </div>
    <span className="font-mono text-sm font-medium">{value}</span>
  </div>
);

const QuickNavCard = ({ title, desc, path, icon: Icon }) => (
  <NavLink to={path} className="quant-card p-4 hover:border-[#3b82f6] transition-colors" data-testid={`quicknav-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#3b82f6]/10 rounded flex items-center justify-center">
        <Icon size={18} className="text-[#3b82f6]" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-medium text-[#ededed]">{title}</h3>
        <p className="text-xs text-[#71717a]">{desc}</p>
      </div>
    </div>
  </NavLink>
);

const StatRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-[#71717a]">{label}</span>
    <span className="font-mono text-sm">{value}</span>
  </div>
);

// ============== PROFILE PAGE ==============
const ProfilePage = ({ userEmail }) => {
  return (
    <div className="p-6" data-testid="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl mt-6">
        {/* Account Information Card */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <Users size={14} />
            <span>ACCOUNT INFORMATION</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] rounded-lg flex items-center justify-center">
                <Users size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#71717a] uppercase tracking-wider mb-1">Email Address</div>
                <div className="font-mono text-[#ededed] text-lg">{userEmail}</div>
                <div className="text-xs text-[#71717a] mt-2">Account Owner</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <Shield size={14} />
            <span>SECURITY</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3b82f6]/10 rounded flex items-center justify-center">
                  <Key size={18} className="text-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">Password</div>
                  <div className="text-xs text-[#71717a]">Last changed recently</div>
                </div>
              </div>
              <div className="text-xs text-[#00e676] flex items-center gap-1">
                <div className="w-2 h-2 bg-[#00e676] rounded-full"></div>
                Configured
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3b82f6]/10 rounded flex items-center justify-center">
                  <Shield size={18} className="text-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">Two-Factor Authentication</div>
                  <div className="text-xs text-[#71717a]">Enhanced security for your account</div>
                </div>
              </div>
              <div className="text-xs text-[#71717a]">Not configured</div>
            </div>
          </div>
        </div>

        {/* Session Information */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <Clock size={14} />
            <span>SESSION INFORMATION</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[#71717a] mb-1">Token Expiry</div>
                <div className="text-sm text-[#ededed]">7 days</div>
              </div>
              <div>
                <div className="text-xs text-[#71717a] mb-1">Account Type</div>
                <div className="text-sm text-[#ededed]">Owner</div>
              </div>
              <div>
                <div className="text-xs text-[#71717a] mb-1">Access Level</div>
                <div className="text-sm text-[#00e676]">Full Access</div>
              </div>
              <div>
                <div className="text-xs text-[#71717a] mb-1">Authentication</div>
                <div className="text-sm text-[#ededed]">JWT-based</div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Reference (for your records) */}
        <div className="quant-card border-[#3b82f6]/30">
          <div className="quant-card-header flex items-center gap-2 bg-[#3b82f6]/10">
            <Database size={14} />
            <span>ACCOUNT CREDENTIALS (FOR YOUR RECORDS)</span>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <div className="text-xs text-[#71717a] uppercase tracking-wider mb-2">Username / Email</div>
              <div className="p-3 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
                <code className="text-sm text-[#22d3ee] font-mono">barrientoswellingtonantonio@gmail.com</code>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#71717a] uppercase tracking-wider mb-2">Password</div>
              <div className="p-3 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
                <code className="text-sm text-[#a1a1aa] font-mono">01230143NYSE@</code>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-sm mt-4">
              <Shield size={14} className="text-[#3b82f6] mt-0.5" />
              <div className="text-xs text-[#a1a1aa]">
                Keep these credentials secure. You can change your password anytime using the "Change Password" option in the sidebar.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== MAIN APP ==============
function App() {
  const { isAuthenticated, loading, userEmail, login, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('modern'); // 'modern', 'wellington', or 'nautical'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <RefreshCw className="animate-spin text-[#3b82f6]" size={32} />
      </div>
    );
  }

  // Unauthenticated users see landing page and login page
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLogin={login} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Authenticated users see the full dashboard
  const modeClass = viewMode === 'wellington' ? 'wellington-mode' : viewMode === 'nautical' ? 'nautical-mode' : '';

  return (
    <div className={`app-container ${modeClass}`}>
      <BrowserRouter>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          viewMode={viewMode}
          setViewMode={setViewMode}
          userEmail={userEmail}
          onLogout={logout}
        />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<HubPage viewMode={viewMode} />} />
            <Route path="/strategies" element={<StrategiesPage viewMode={viewMode} />} />
            <Route path="/sec-filings" element={<SECFilingsPage viewMode={viewMode} />} />
            <Route path="/heatmap" element={<GlobalHeatmapPage viewMode={viewMode} />} />
            <Route path="/quant" element={<QuantDashboard viewMode={viewMode} />} />
            <Route path="/macro" element={<MacroRegime viewMode={viewMode} />} />
            <Route path="/intel" element={<WorldIntel viewMode={viewMode} />} />
            <Route path="/terminal" element={<Terminal viewMode={viewMode} />} />
            <Route path="/research" element={<ResearchQueue viewMode={viewMode} />} />
            <Route path="/approvals" element={<Approvals viewMode={viewMode} />} />
            <Route path="/health" element={<SystemHealth viewMode={viewMode} />} />
            <Route path="/profile" element={<ProfilePage userEmail={userEmail} />} />
            <Route path="/automation-hub" element={<AutomationHubPage viewMode={viewMode} />} />
            <Route path="/automation-v1" element={<AutomationV1 viewMode={viewMode} />} />
            <Route path="/automation-v2" element={<AutomationV2 viewMode={viewMode} />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
