
import React, { useState } from 'react';
import { User } from '../types';
import { 
  LogOut, 
  Home, 
  History, 
  ShieldCheck, 
  Search,
  CheckCircle,
  Globe,
  Cpu,
  Image as ImageIcon,
  Activity,
  Info,
  Star,
  Menu,
  X,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, onRefresh, isRefreshing, children, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home, category: 'Main Menu' },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'history', label: 'Forensic History', icon: History },
    { id: 'truth', label: 'Truth Engine', icon: Globe, category: 'Detection Labs' },
    { id: 'ai-lab', label: 'AI Detector', icon: Cpu },
    { id: 'media', label: 'Media Forensics', icon: ImageIcon },
    { id: 'about', label: 'About Us', icon: Info, category: 'Platform' },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/90 backdrop-blur-md z-[60] transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={`w-72 h-full bg-[#0a0a0a] border-r border-blue-900/30 p-8 flex flex-col transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg shiny-blue flex items-center justify-center">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <span className="font-black text-sm tracking-widest uppercase">Vericheck</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {navItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                {item.category && (
                  <div className={`text-[9px] font-black text-gray-700 uppercase tracking-widest mb-2 ml-2 ${idx > 0 ? 'mt-6' : ''}`}>
                    {item.category}
                  </div>
                )}
                <button 
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <item.icon size={18} />
                  <span className="font-bold text-sm">{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </nav>

          <button 
            onClick={onLogout}
            className="mt-10 flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} />
            <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 glass-panel border-r border-blue-900/30 flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl shiny-blue flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter leading-none">VERI</h1>
              <span className="text-[8px] font-black tracking-[0.3em] text-blue-500 uppercase">Check</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                {item.category && (
                  <div className={`text-[10px] font-black text-gray-800 uppercase tracking-[0.2em] mb-4 ml-2 ${idx > 0 ? 'mt-8' : ''}`}>
                    {item.category}
                  </div>
                )}
                <button 
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'hover:bg-white/5 text-gray-500'}`}
                >
                  <item.icon size={18} />
                  <span className="font-bold text-sm">{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-blue-900/30">
          <div className="bg-blue-900/10 rounded-2xl p-4 border border-blue-500/10 mb-6">
            <div className="flex items-center gap-3 mb-2">
               <Activity size={12} className="text-blue-500" />
               <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Platform Pulse</span>
            </div>
            <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[94%] shadow-[0_0_10px_#3b82f6]"></div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-red-500/10 text-red-500 transition-all border border-transparent hover:border-red-500/30"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-black flex flex-col">
        {/* Top Header - Mobile Optimized */}
        <header className="sticky top-0 z-50 glass-panel px-4 lg:px-10 py-3 lg:py-5 border-b border-blue-900/20 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3 lg:gap-6">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="lg:hidden p-2 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/10"
             >
               <Menu size={20} />
             </button>
             
             {/* Profile in top left corner - Clickable Shortcut to Profile Settings */}
             <div 
              className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
              onClick={() => setActiveTab('profile')}
             >
               <div className="relative">
                  <div className="w-9 h-9 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl border-2 border-blue-500/40 overflow-hidden p-0.5 group-hover:border-blue-400 transition-colors">
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-[8px] lg:rounded-[14px]" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-2.5 h-2.5 lg:w-4 lg:h-4 rounded-full border-2 lg:border-4 border-black"></div>
               </div>
               <div className="hidden sm:block">
                  <p className="text-[8px] lg:text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1 group-hover:text-blue-400 transition-colors">Authenticated</p>
                  <h2 className="font-black text-sm lg:text-xl text-white tracking-tight leading-none group-hover:text-blue-100 transition-colors">{user.username}</h2>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden md:flex items-center bg-black/60 border border-blue-900/40 rounded-xl lg:rounded-2xl px-4 py-2 lg:px-6 lg:py-3 gap-3 group focus-within:border-blue-500 transition-all">
              <Search size={16} className="text-gray-600 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                className="bg-transparent border-none outline-none text-xs lg:text-sm w-32 lg:w-64 text-white font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2 lg:gap-6">
              {/* Refresh Button - Accessible Anywhere */}
              <button 
                onClick={onRefresh}
                className="p-2 lg:p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-all group active:scale-90"
                title="Refresh Module"
              >
                <RefreshCw size={20} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>

              <div className="flex items-center gap-2 lg:gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[7px] lg:text-[9px] font-black text-gray-700 uppercase leading-none">Reputation</span>
                  <span className="text-blue-400 font-black text-xs lg:text-sm">{user.reputation}%</span>
                </div>
                <div className="hidden xs:block px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-[8px] lg:text-[10px] font-black tracking-widest">
                  VIP
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto w-full flex-1">
          {children}
        </div>

        {/* Subtle Cyberpunk Overlay for Atmosphere */}
        <div className="hidden lg:block fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none"></div>
      </main>
    </div>
  );
};

export default Layout;
