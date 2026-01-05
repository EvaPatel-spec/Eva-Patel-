
import React, { useState, useEffect, useRef } from 'react';
import { User, DetectionType, HistoryItem, VerificationResult, ReviewItem } from './types';
import Layout from './components/Layout';
import { analyzeContent } from './services/geminiService';
import { 
  Image as ImageIcon, 
  GraduationCap, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldAlert,
  ArrowRight, 
  ChevronLeft, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Code, 
  Mail, 
  PenTool, 
  Search, 
  Sparkles, 
  Globe, 
  Rocket, 
  Activity, 
  Layers, 
  Database, 
  Info, 
  Star, 
  Quote, 
  ChevronRight, 
  Video, 
  Plus, 
  Fingerprint, 
  Lock, 
  Loader2, 
  User as UserIcon, 
  Mic, 
  MicOff,
  AlertTriangle,
  Square,
  CheckSquare,
  Target,
  Eye,
  EyeOff,
  Settings2,
  Camera,
  Save,
  Grid,
  Trash2,
  X,
  FileText,
  FileUp,
  Type as TypeIcon,
  MessageSquareInfo,
  BookOpenCheck
} from 'lucide-react';

const DEFAULT_REVIEWS: ReviewItem[] = [
  { id: '1', name: "Agent K. Sterling", role: "Journalist", comment: "Essential for our newsroom. It catches AI markers that even our best editors missed.", rating: 5, timestamp: Date.now() },
  { id: '2', name: "Prof. Michael H.", role: "Dean of Studies", comment: "The academic detector is frighteningly accurate. It has completely changed how we handle plagiarism.", rating: 5, timestamp: Date.now() },
  { id: '3', name: "Sarah L.", role: "Content Mod", comment: "Finally, a forensics tool that handles metadata AND pixel analysis in one interface. A game changer.", rating: 5, timestamp: Date.now() }
];

const PRESET_AVATARS = [
  'Circuit', 'Neural', 'Vault', 'Cyber', 'Data', 'Pulse', 'Node', 'Grid', 'Logic', 'Flash', 'Ghost', 'Vector'
];

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Auth State
  const [authName, setAuthName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile Edit State
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileView, setProfileView] = useState<'upload' | 'gallery'>('gallery');

  // Model State
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Review Form States
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Input States
  const [aiTextContent, setAiTextContent] = useState('');
  const [factTextContent, setFactTextContent] = useState('');
  const [aiDetectType, setAiDetectType] = useState<DetectionType>(DetectionType.ACADEMIC);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [aiInputMode, setAiInputMode] = useState<'text' | 'file'>('text');
  const [uploadedDoc, setUploadedDoc] = useState<{data: string, name: string, type: string} | null>(null);
  
  // Result States
  const [analysisResult, setAnalysisResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('fake_detect_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setEditUsername(parsed.username);
      setEditAvatar(parsed.avatar);
      setIsAuthenticated(true);
      setHasStarted(true);
      setActiveTab('home');
      resetInputs();
    }
    const savedHistory = localStorage.getItem('fake_detect_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedReviews = localStorage.getItem('vericheck_user_reviews');
    if (savedReviews) {
      setReviews([...DEFAULT_REVIEWS, ...JSON.parse(savedReviews)]);
    } else {
      setReviews(DEFAULT_REVIEWS);
    }
  }, []);

  const resetInputs = () => {
    setAiTextContent('');
    setFactTextContent('');
    setFilePreview(null);
    setSelectedFileName('');
    setAnalysisResult(null);
    setIsListening(false);
    setUploadedDoc(null);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    resetInputs();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Safari.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFactTextContent(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable microphone permissions in your settings.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current = initSpeechRecognition();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error('Failed to start recognition', e);
          setIsListening(false);
        }
      }
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);

    setTimeout(() => {
      const finalUsername = authName.trim() || (isSignUp ? 'New_Agent_77' : 'Forensic_Agent_01');
      const newUser: User = {
        username: finalUsername,
        email: 'integrity@vault.ai',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${finalUsername}`,
        reputation: isSignUp ? 100.0 : 98.4
      };
      setUser(newUser);
      setEditUsername(newUser.username);
      setEditAvatar(newUser.avatar);
      setIsAuthenticated(true);
      setIsAuthLoading(false);
      setShowGreeting(true);
      
      if (rememberMe) {
        localStorage.setItem('fake_detect_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('fake_detect_user');
      }
      
      setActiveTab('home');
    }, 2000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsProfileSaving(true);
    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        username: editUsername,
        avatar: editAvatar
      };
      setUser(updatedUser);
      localStorage.setItem('fake_detect_user', JSON.stringify(updatedUser));
      setIsProfileSaving(false);
      alert("Profile telemetry updated successfully.");
    }, 1500);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
        setProfileView('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPresetAvatar = (seed: string) => {
    setEditAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  const confirmLogout = () => {
    setIsAuthenticated(false);
    setShowGreeting(false);
    setUser(null);
    setHasStarted(false);
    setShowExitModal(false);
    localStorage.removeItem('fake_detect_user');
    resetInputs();
  };

  const addToHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('fake_detect_history', JSON.stringify(newHistory));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReview: ReviewItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: user?.username || "Guest Operator",
      role: "Certified Operator",
      comment: newReviewComment.trim() || "Positive verification rating submitted without detailed notes.",
      rating: newReviewRating,
      timestamp: Date.now()
    };

    const userOnlyReviews = reviews.filter(r => !DEFAULT_REVIEWS.find(dr => dr.id === r.id));
    const updatedUserReviews = [...userOnlyReviews, newReview];
    localStorage.setItem('vericheck_user_reviews', JSON.stringify(updatedUserReviews));
    setReviews([...DEFAULT_REVIEWS, ...updatedUserReviews]);
    
    setNewReviewComment('');
    setNewReviewRating(5);
    setShowReviewForm(false);
  };

  const normalizeConfidence = (val: number) => {
    if (val <= 1 && val > 0) return Math.round(val * 100);
    return Math.round(val);
  };

  const processAnalysis = async (type: DetectionType, input: string) => {
    if (!input.trim() && !filePreview && !uploadedDoc) return;

    setIsLoading(true);
    setAnalysisResult(null);

    let contentInput: any = input;
    
    // Handle specific file inputs
    if (type === DetectionType.IMAGE && filePreview) {
      contentInput = { data: filePreview.split(',')[1], mimeType: 'image/jpeg' };
    } else if (aiInputMode === 'file' && uploadedDoc) {
      contentInput = input || `Document Analysis: ${uploadedDoc.name}`;
    }

    try {
      const result = await analyzeContent(type, contentInput, selectedModel);
      setAnalysisResult(result);
      
      addToHistory({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        type,
        input: input.length > 30 ? input.substring(0, 30) + '...' : (input || selectedFileName || uploadedDoc?.name || 'Media Analysis'),
        result: result.status,
        confidence: normalizeConfidence(result.confidence),
        explanation: result.analysis
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMediaSelection = () => {
    setFilePreview(null);
    setSelectedFileName('');
    setAnalysisResult(null);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (file.type === 'text/plain') {
          setAiTextContent(event.target?.result as string);
        }
        setUploadedDoc({
          data: event.target?.result as string,
          name: file.name,
          type: file.type
        });
      };
      
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  };

  const ResultDisplay = ({ result }: { result: VerificationResult }) => (
    <div className="mt-8 glass-panel rounded-2xl p-6 lg:p-8 glow-border animate-in slide-in-from-top-4 duration-500 border-l-4 border-l-blue-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            result.status.includes('TRUE') || result.status.includes('HUMAN') 
            ? 'bg-green-500/10 text-green-400 border-green-500/30' 
            : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>{result.status.replace('_', ' ')}</span>
          <h4 className="text-3xl lg:text-4xl font-black mt-4 text-white">
            {normalizeConfidence(result.confidence)}% <span className="text-sm lg:text-lg font-normal text-gray-500">Certainty</span>
          </h4>
        </div>
        <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center shadow-2xl ${
          result.status.includes('TRUE') || result.status.includes('HUMAN') ? 'bg-green-500/20 text-green-500 shadow-green-500/10' : 'bg-red-500/20 text-red-500 shadow-red-500/10'
        }`}>
          {result.status.includes('TRUE') || result.status.includes('HUMAN') ? <CheckCircle size={32} className="lg:w-12 lg:h-12" /> : <XCircle size={32} className="lg:w-12 lg:h-12" />}
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 lg:p-5 bg-black/40 rounded-xl border border-white/5 relative">
          <div className="absolute -left-1 top-4 w-1 h-12 bg-blue-500 rounded-full"></div>
          <p className="text-gray-300 leading-relaxed italic text-sm lg:text-lg">"{result.analysis}"</p>
        </div>
        
        {result.metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {Object.entries(result.metrics).map(([key, val]) => (
              <div key={key} className="p-4 bg-blue-900/10 rounded-xl border border-blue-500/10">
                <p className="text-[9px] text-gray-500 uppercase font-black mb-1">{key}</p>
                <p className="text-xs text-blue-400 font-bold truncate">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl lg:text-4xl font-black text-white">Operational Dashboard</h2>
              <p className="text-blue-400 font-bold text-[10px] lg:text-sm tracking-widest uppercase">Select an Analysis Module to Begin</p>
            </div>

            <div className="glass-panel p-6 lg:p-10 rounded-[30px] lg:rounded-[40px] glow-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={120} className="text-blue-500" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-2">
                    <Activity size={32} className="lg:w-10 lg:h-10" />
                  </div>
                  <h3 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase">Forensic Scan Intensity</h3>
                  <p className="text-gray-500 text-sm lg:text-lg max-w-md">Your active neural throughput across all detection modules. High activity correlates with increased platform reputation.</p>
                </div>
                <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-[24px] lg:rounded-[30px] border border-blue-500/20 shadow-2xl min-w-[200px]">
                  <span className="text-7xl lg:text-9xl font-black text-blue-500 leading-none drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">{history.length}</span>
                  <span className="text-[10px] lg:text-xs font-black text-blue-400 uppercase tracking-[0.3em] mt-2">TOTAL SCANS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[
                { id: 'truth', label: 'Truth Engine', icon: Globe, desc: 'Verify news and social claims.', color: 'blue' },
                { id: 'ai-lab', label: 'AI Detector', icon: Cpu, desc: 'Audit student papers and code.', color: 'purple' },
                { id: 'media', label: 'Media Forensics', icon: ImageIcon, desc: 'Upload photos/videos for scan.', color: 'green' }
              ].map(card => (
                <div key={card.id} className="glass-panel p-6 lg:p-8 rounded-3xl glow-border border-l-4 border-l-blue-500 group cursor-pointer transition-all hover:bg-white/5 active:scale-95" onClick={() => { setActiveTab(card.id); resetInputs(); }}>
                  <div className={`w-12 h-12 lg:w-14 lg:h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform`}>
                    <card.icon size={28} className="lg:w-8 lg:h-8" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold mb-2">{card.label}</h3>
                  <p className="text-gray-500 text-xs lg:text-sm mb-6">{card.desc}</p>
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] lg:text-xs uppercase tracking-widest">
                    Launch Module <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
               <div className="glass-panel p-6 lg:p-8 rounded-[30px] lg:rounded-[40px] glow-border">
                  <h4 className="text-lg lg:text-xl font-bold mb-6 flex items-center gap-3"><Activity className="text-blue-500" /> Platform Metrics</h4>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                        <span>Analysis Success Rate</span>
                        <span className="text-blue-500">99.8%</span>
                      </div>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[99.8%] shadow-[0_0_10px_#3b82f6]"></div>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="glass-panel p-6 lg:p-8 rounded-[30px] lg:rounded-[40px] glow-border">
                  <h4 className="text-lg lg:text-xl font-bold mb-6 flex items-center gap-3"><Database className="text-blue-500" /> Archival Logs</h4>
                  <div className="space-y-4">
                    {history.slice(0, 3).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${item.result.includes('TRUE') ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                            {item.result.includes('TRUE') ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          </div>
                          <span className="text-[10px] font-medium truncate">{item.input}</span>
                        </div>
                      </div>
                    ))}
                    {history.length === 0 && <p className="text-center text-[10px] text-gray-700 py-6 italic">No forensic logs found.</p>}
                  </div>
               </div>
            </div>
          </div>
        );

      case 'truth':
        return (
          <div className="max-w-4xl mx-auto space-y-8 lg:space-y-10 animate-in slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => { setActiveTab('home'); resetInputs(); }}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors font-black text-[10px] uppercase tracking-widest mb-4"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
            <div className="text-center space-y-3 lg:space-y-4">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-2"><Globe size={32} className="lg:w-10 lg:h-10" /></div>
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase">Truth Engine</h2>
              <p className="text-gray-500 text-sm lg:text-lg">Paste claims or use Voice-to-Text for instant validation.</p>
            </div>
            
            <div className="glass-panel p-6 lg:p-10 rounded-[30px] lg:rounded-[40px] glow-border relative">
               <div className="relative group">
                 <textarea 
                    value={factTextContent}
                    onChange={(e) => setFactTextContent(e.target.value)}
                    placeholder="Enter statement (e.g., 'A local mayor resigned today amid scandal')..."
                    className="w-full h-40 lg:h-48 bg-black/60 border border-blue-900/40 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-sm lg:text-lg text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none mb-6 placeholder:text-gray-700"
                  />
                  <button 
                    onClick={toggleListening}
                    className={`absolute right-4 bottom-10 p-4 rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/40'}`}
                    title={isListening ? "Stop Listening" : "Start Voice Input"}
                  >
                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
               </div>
                
                <button 
                  onClick={() => processAnalysis(DetectionType.TEXT, factTextContent)}
                  disabled={isLoading || !factTextContent}
                  className="w-full shiny-blue py-4 lg:py-6 rounded-xl lg:rounded-2xl font-black text-base lg:text-xl disabled:opacity-50 flex items-center justify-center gap-3 lg:gap-4 transition-all"
                >
                  {isLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Search size={20} className="lg:w-6 lg:h-6"/> INITIATE TRUTH SCAN</>}
                </button>
                {analysisResult && <ResultDisplay result={analysisResult} />}
            </div>
          </div>
        );

      case 'ai-lab':
        return (
          <div className="max-w-4xl mx-auto space-y-8 lg:space-y-10 animate-in slide-in-from-bottom-8 duration-500">
             <button 
              onClick={() => { setActiveTab('home'); resetInputs(); }}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors font-black text-[10px] uppercase tracking-widest mb-4"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
            <div className="text-center space-y-3 lg:space-y-4">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-2"><Cpu size={32} className="lg:w-10 lg:h-10" /></div>
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase">AI Detector</h2>
              <p className="text-gray-500 text-sm lg:text-lg">Audit student papers or documents for AI generation markers.</p>
            </div>

            <div className="glass-panel p-6 lg:p-10 rounded-[30px] lg:rounded-[40px] glow-border">
               <div className="mb-10">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">
                    <Settings2 size={14} /> Neural Configuration
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button 
                      onClick={() => setSelectedModel('gemini-3-flash-preview')}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedModel === 'gemini-3-flash-preview' ? 'shiny-blue border-blue-500 text-white' : 'border-white/5 bg-white/5 text-gray-500 hover:text-gray-300'}`}
                    >
                      Flash (Optimized)
                    </button>
                    <button 
                      onClick={() => setSelectedModel('gemini-3-pro-preview')}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedModel === 'gemini-3-pro-preview' ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'border-white/5 bg-white/5 text-gray-500 hover:text-gray-300'}`}
                    >
                      Pro (Deep Analysis)
                    </button>
                  </div>
                  <p className="text-center text-[9px] text-gray-600 mt-4 uppercase tracking-widest font-bold">
                    {selectedModel === 'gemini-3-flash-preview' ? 'Sub-second inference for standard documents.' : 'Deep contextual reasoning for complex or obfuscated text.'}
                  </p>
               </div>

               <div className="flex flex-wrap gap-2 lg:gap-3 mb-10 justify-center">
                  {[
                    { id: DetectionType.ACADEMIC, icon: GraduationCap, label: 'Papers' },
                    { id: DetectionType.CODE, icon: Code, label: 'Source Code' },
                    { id: DetectionType.EMAILS, icon: Mail, label: 'Email Scan' },
                    { id: DetectionType.CREATIVE, icon: PenTool, label: 'Literature' }
                  ].map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setAiDetectType(item.id)}
                      className={`flex items-center gap-2 lg:gap-3 px-4 py-2.5 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl transition-all border font-bold uppercase text-[9px] lg:text-xs tracking-widest ${aiDetectType === item.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/5 text-gray-600 hover:bg-white/5'}`}
                    >
                      <item.icon size={14} className="lg:w-4 lg:h-4" /> {item.label}
                    </button>
                  ))}
                </div>

                {/* AI Input Mode Toggle */}
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-8 max-w-sm mx-auto">
                  <button 
                    onClick={() => setAiInputMode('text')}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${aiInputMode === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-400'}`}
                  >
                    <TypeIcon size={14} /> Direct Paste
                  </button>
                  <button 
                    onClick={() => setAiInputMode('file')}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${aiInputMode === 'file' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-400'}`}
                  >
                    <FileUp size={14} /> Upload Doc
                  </button>
                </div>

                {aiInputMode === 'text' ? (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <textarea 
                      value={aiTextContent}
                      onChange={(e) => setAiTextContent(e.target.value)}
                      placeholder="Paste student submission, essay, or email for AI detection..."
                      className="w-full h-48 lg:h-64 bg-black/60 border border-blue-900/40 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-sm lg:text-lg text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none mb-6 placeholder:text-gray-700"
                    />
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300 mb-6 space-y-8">
                    {/* Document Guidance Section */}
                    <div className="p-4 lg:p-6 bg-purple-900/5 border border-purple-500/10 rounded-2xl flex flex-col sm:flex-row gap-6 items-start">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 text-purple-400 font-black text-[10px] uppercase tracking-widest">
                            <FileText size={14} /> Doc Guidance
                          </div>
                          <ul className="text-[11px] lg:text-xs text-gray-400 space-y-1 list-disc list-inside">
                            <li>Formats: <span className="text-purple-400 font-bold">PDF, DOCX, TXT</span></li>
                            <li>Max File Size: <span className="text-purple-400 font-bold">10 MB</span> per document</li>
                            <li>Language: Optimized for <span className="text-purple-400 font-bold">English</span> text</li>
                          </ul>
                        </div>
                        <div className="w-px h-16 bg-purple-900/20 hidden sm:block"></div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                            <BookOpenCheck size={14} /> Integrity Tips
                          </div>
                          <ul className="text-[11px] lg:text-xs text-gray-400 space-y-1 list-disc list-inside">
                            <li>Ensure text is <span className="text-blue-400 font-bold">selectable/readable</span></li>
                            <li>Minimum <span className="text-blue-400 font-bold">250 words</span> for high accuracy</li>
                            <li>Analyze <span className="text-blue-400 font-bold">entire chapters</span> for better profiling</li>
                          </ul>
                        </div>
                    </div>

                    <div className="relative border-2 border-dashed border-blue-900/30 rounded-2xl lg:rounded-[30px] p-10 lg:p-16 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 group">
                      <input 
                        type="file" 
                        accept=".pdf,.docx,.doc,.txt" 
                        onChange={handleDocUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      
                      {uploadedDoc ? (
                        <div className="space-y-4">
                          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30 shadow-xl group-hover:scale-110 transition-transform">
                            <FileText size={32} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm lg:text-lg">{uploadedDoc.name}</p>
                            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-1">Ready for Neural Audit</p>
                          </div>
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUploadedDoc(null); }}
                            className="flex items-center gap-2 mx-auto text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} /> Remove File
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                            <Upload size={28} />
                          </div>
                          <div>
                            <p className="text-lg lg:text-xl font-bold text-white uppercase tracking-tighter">Submit Student Document</p>
                            <p className="text-gray-600 text-[10px] lg:text-xs mt-1">Upload PDF, DOCX, or TXT for deep analysis.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => processAnalysis(aiDetectType, aiTextContent)}
                  disabled={isLoading || (aiInputMode === 'text' ? !aiTextContent : !uploadedDoc)}
                  className="w-full shiny-blue py-4 lg:py-6 rounded-xl lg:rounded-2xl font-black text-base lg:text-xl disabled:opacity-50 flex items-center justify-center gap-3 lg:gap-4 transition-all"
                >
                  {isLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Layers size={20} className="lg:w-6 lg:h-6"/> RUN INTEGRITY AUDIT</>}
                </button>
                {analysisResult && <ResultDisplay result={analysisResult} />}
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="max-w-4xl mx-auto space-y-8 lg:space-y-10 animate-in slide-in-from-bottom-8 duration-500">
             <button 
              onClick={() => { setActiveTab('home'); resetInputs(); }}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors font-black text-[10px] uppercase tracking-widest mb-4"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
            <div className="text-center space-y-3 lg:space-y-4">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-2"><ImageIcon size={32} className="lg:w-10 lg:h-10" /></div>
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase">Media Forensics</h2>
              <p className="text-gray-500 text-sm lg:text-lg">Direct upload of image and video assets for manipulation scan.</p>
            </div>

            <div className="glass-panel p-6 lg:p-10 rounded-[30px] lg:rounded-[40px] glow-border">
               <div className="relative border-2 border-dashed border-blue-900/30 rounded-2xl lg:rounded-[30px] p-8 lg:p-20 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer mb-6">
                  {!filePreview && (
                    <input type="file" accept="image/*,video/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFileName(file.name);
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFilePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setFilePreview('VIDEO_UPLOADED'); 
                        }
                      }
                    }} className="absolute inset-0 opacity-0 cursor-pointer" />
                  )}
                  
                  {filePreview ? (
                    <div className="space-y-4 lg:space-y-6 text-center relative group/preview">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          clearMediaSelection();
                        }}
                        className="absolute -top-4 -right-4 lg:-top-8 lg:-right-8 p-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-all z-20 group-hover/preview:scale-110 active:scale-95"
                        title="Quick Remove"
                      >
                        <X size={20} />
                      </button>
                      {filePreview === 'VIDEO_UPLOADED' ? (
                        <div className="w-24 h-24 lg:w-32 lg:h-32 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-blue-500/50">
                           <Video size={48} className="text-blue-500" />
                        </div>
                      ) : (
                        <img src={filePreview} alt="Preview" className="max-h-48 lg:max-h-80 mx-auto rounded-xl shadow-lg border border-blue-500/20" />
                      )}
                      <div>
                        <p className="text-blue-400 font-black uppercase text-[10px] tracking-widest truncate max-w-xs mx-auto">{selectedFileName}</p>
                        <p className="text-gray-500 text-[9px] mt-1 font-bold uppercase tracking-widest">Asset Ready for Analysis</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 lg:space-y-6">
                      <div className="w-16 h-16 lg:w-24 lg:h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Upload className="text-blue-500 lg:w-12 lg:h-12" size={32} />
                      </div>
                      <div>
                        <p className="text-lg lg:text-2xl font-bold text-white">Upload Asset</p>
                        <p className="text-gray-600 text-[10px] lg:text-xs">Drag and drop photos or videos (PNG, JPEG, MP4).</p>
                      </div>
                    </div>
                  )}
               </div>

               <div className="mb-8 p-4 lg:p-6 bg-blue-900/5 border border-blue-500/10 rounded-2xl flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest">
                      <ImageIcon size={14} /> Image Guidance
                    </div>
                    <ul className="text-[11px] lg:text-xs text-gray-400 space-y-1 list-disc list-inside">
                      <li>Formats: JPEG, PNG, WEBP</li>
                      <li>Max File Size: <span className="text-blue-400 font-bold">20 MB</span></li>
                    </ul>
                  </div>
                  <div className="w-px h-16 bg-blue-900/20 hidden sm:block"></div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-purple-500 font-black text-[10px] uppercase tracking-widest">
                      <Video size={14} /> Video Guidance
                    </div>
                    <ul className="text-[11px] lg:text-xs text-gray-400 space-y-1 list-disc list-inside">
                      <li>Formats: MP4, MOV</li>
                      <li>Max File Size: <span className="text-purple-400 font-bold">100 MB</span></li>
                    </ul>
                  </div>
               </div>
               
               {filePreview && (
                  <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in duration-300">
                    <button 
                      onClick={() => processAnalysis(DetectionType.IMAGE, 'Visual Asset Check')} 
                      disabled={isLoading} 
                      className="flex-1 shiny-blue py-4 lg:py-6 rounded-xl lg:rounded-2xl font-black text-base lg:text-xl disabled:opacity-50 flex items-center justify-center gap-3 lg:gap-4 transition-all"
                    >
                      {isLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <><ShieldAlert size={20} className="lg:w-6 lg:h-6"/> INITIATE FORENSIC SCAN</>}
                    </button>
                    <button 
                      onClick={clearMediaSelection}
                      disabled={isLoading}
                      className="px-8 py-4 lg:py-6 rounded-xl lg:rounded-2xl font-black text-base lg:text-xl border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
                    >
                      <Trash2 size={20} /> <span className="uppercase tracking-widest text-[12px] lg:text-base">Clear selection</span>
                    </button>
                  </div>
               )}
               {analysisResult && <ResultDisplay result={analysisResult} />}
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-500 pb-20">
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-4"><Star size={40} /></div>
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase">Operator Reviews</h2>
              <p className="text-gray-500 text-sm lg:text-lg">Add your evaluation of the platform. Detailed notes are optional.</p>
            </div>

            <div className="flex justify-center mb-10">
              <button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-3 px-8 py-3.5 shiny-blue rounded-xl font-black text-xs uppercase tracking-widest transition-transform hover:scale-105 active:scale-95"
              >
                {showReviewForm ? <XCircle size={18} /> : <Plus size={18} />}
                {showReviewForm ? 'Cancel Submission' : 'Submit Review'}
              </button>
            </div>

            {showReviewForm && (
              <div className="glass-panel p-8 rounded-[30px] glow-border animate-in slide-in-from-top-4 duration-500">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><PenTool className="text-blue-500" /> Platform Assessment</h3>
                <form handleReviewSubmit={handleReviewSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Accuracy Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className={`p-1 transition-all ${newReviewRating >= star ? 'text-blue-500' : 'text-gray-800 hover:text-blue-900'}`}
                        >
                          <Star size={32} fill={newReviewRating >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Comments (Optional)</label>
                    <textarea 
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Share detailed feedback or leave blank to submit rating only..."
                      className="w-full h-32 bg-black/60 border border-blue-900/40 rounded-2xl p-6 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder:text-gray-700"
                    />
                  </div>
                  <button type="submit" className="w-full shiny-blue py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[1.01] transition-all">
                    Finalize Assessment
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {reviews.map((rev) => (
                <div key={rev.id} className="glass-panel p-6 lg:p-8 rounded-[30px] glow-border relative group hover:scale-[1.02] transition-transform">
                  <Quote className="absolute top-4 right-6 text-white/5 w-12 h-12" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(rev.rating)].map((_, i) => <Star key={i} size={12} className="fill-blue-500 text-blue-500" />)}
                  </div>
                  <p className="text-gray-300 italic mb-6 leading-relaxed text-xs lg:text-sm">"{rev.comment}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold uppercase text-[10px]">{rev.name[0]}</div>
                    <div>
                      <h4 className="font-bold text-white text-xs lg:text-sm">{rev.name}</h4>
                      <p className="text-[9px] text-gray-500 uppercase font-black">{rev.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-white/5 pb-8 gap-4">
              <div>
                <h3 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter">Forensic Logs</h3>
                <p className="text-gray-500 text-sm lg:text-lg mt-2">Complete audit trail of past neural detections.</p>
              </div>
              <button 
                onClick={() => { setHistory([]); localStorage.removeItem('fake_detect_history'); }}
                className="px-6 py-2 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-500/10 transition-all tracking-widest"
              >
                Clear Archive
              </button>
            </div>

            <div className="grid gap-4 lg:gap-6 pb-12">
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className="glass-panel p-6 lg:p-8 rounded-[24px] lg:rounded-[30px] flex flex-col md:flex-row items-center justify-between glow-border hover:border-blue-500/40 transition-all group relative overflow-hidden">
                   <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.result.includes('TRUE') || item.result.includes('HUMAN') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="flex items-center gap-6 w-full">
                    <div className={`shrink-0 p-4 lg:p-6 rounded-[18px] lg:rounded-[24px] shadow-xl ${item.result.includes('TRUE') || item.result.includes('HUMAN') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {item.type === DetectionType.ACADEMIC ? <GraduationCap size={24} /> : item.type === DetectionType.IMAGE ? <ImageIcon size={24} /> : <Globe size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest px-1.5 py-0.5 bg-blue-500/10 rounded-md">{item.type}</span>
                        <span className="text-[8px] font-bold text-gray-700 uppercase">{new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h5 className="font-bold text-white text-base lg:text-xl truncate pr-4">{item.input}</h5>
                      <p className="text-gray-400 text-[10px] lg:text-xs mt-1 italic">Scan Result: {item.result.replace('_', ' ')} ({item.confidence}%)</p>
                      <p className="text-gray-500 text-[10px] lg:text-xs mt-1 line-clamp-1">"{item.explanation}"</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center glass-panel rounded-[30px] opacity-30 border-dashed border-gray-800">
                  <Clock size={48} className="mx-auto text-gray-700 mb-4" />
                  <p className="text-lg lg:text-xl font-black text-gray-500 uppercase tracking-widest">Log Empty</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-500 pb-20">
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-4"><UserIcon size={40} /></div>
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase">Profile Settings</h2>
              <p className="text-gray-500 text-sm lg:text-lg">Update your operator credentials and visual ID.</p>
            </div>

            <div className="glass-panel p-8 lg:p-12 rounded-[40px] glow-border">
              <form onSubmit={handleUpdateProfile} className="space-y-10">
                <div className="flex flex-col items-center gap-8">
                  <div className="w-full flex flex-col items-center gap-6">
                    <div className="relative group mb-4">
                      <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-[30px] lg:rounded-[40px] border-4 border-blue-500/30 overflow-hidden relative shadow-2xl">
                        <img src={editAvatar} alt="Profile Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                           <Sparkles size={32} className="text-white animate-pulse" />
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 lg:w-14 lg:h-14 shiny-blue rounded-2xl flex items-center justify-center shadow-lg">
                        <Fingerprint size={20} className="text-white lg:w-7 lg:h-7" />
                      </div>
                    </div>

                    <div className="w-full flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-2">
                      <button 
                        type="button"
                        onClick={() => setProfileView('gallery')}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${profileView === 'gallery' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-400'}`}
                      >
                        <Grid size={14} /> Avatar Gallery
                      </button>
                      <button 
                        type="button"
                        onClick={() => setProfileView('upload')}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${profileView === 'upload' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-400'}`}
                      >
                        <Camera size={14} /> Upload ID
                      </button>
                    </div>

                    {profileView === 'gallery' ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 lg:gap-4 animate-in fade-in duration-300">
                        {PRESET_AVATARS.map((seed) => {
                          const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                          return (
                            <button
                              key={seed}
                              type="button"
                              onClick={() => selectPresetAvatar(seed)}
                              className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${editAvatar === url ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] bg-blue-500/10' : 'border-white/5 bg-black/40'}`}
                            >
                              <img src={url} alt={seed} className="w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="w-full animate-in slide-in-from-top-4 duration-300">
                         <label className="w-full h-32 lg:h-40 border-2 border-dashed border-blue-900/30 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group">
                            <Upload className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-blue-500 transition-colors">Import External Image</p>
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                         </label>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-600 uppercase font-black tracking-[0.2em]">OPERATOR BIOMETRICS</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Operator Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500/50" size={18} />
                      <input 
                        type="text" 
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full bg-black/40 border border-blue-900/40 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Operator Name"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isProfileSaving}
                  className="w-full shiny-blue py-5 rounded-2xl font-black text-base lg:text-xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isProfileSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> SYNC CREDENTIALS</>}
                </button>
              </form>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-500 pb-20">
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-4"><Info size={40} /></div>
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase">Vericheck Labs</h2>
              <p className="text-gray-500 text-sm lg:text-lg">Specialized tools for a world of deepfakes and AI fraud.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="glass-panel p-6 lg:p-8 rounded-[30px] glow-border">
                <h3 className="text-lg lg:text-xl font-bold mb-4 flex items-center gap-2"><ShieldCheck className="text-blue-500" /> Defense Grid</h3>
                <p className="text-gray-400 leading-relaxed text-xs lg:text-sm">
                  Our system cross-references billions of data points to ensure that viral news and claims are vetted before they cause harm.
                </p>
              </div>
              <div className="glass-panel p-6 lg:p-8 rounded-[30px] glow-border">
                <h3 className="text-lg lg:text-xl font-bold mb-4 flex items-center gap-2"><Zap className="text-blue-500" /> Neural Scanning</h3>
                <p className="text-gray-400 leading-relaxed text-xs lg:text-sm">
                  We use advanced linguistic markers and forensic pixel noise patterns to catch AI-generated content that looks perfect to humans.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.15),transparent_70%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{backgroundImage: 'radial-gradient(#1e40af 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        
        <div className="z-10 text-center space-y-8 max-w-4xl">
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-3xl shiny-blue flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-pulse">
              <ShieldCheck size={40} className="text-white lg:w-12 lg:h-12" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-xl md:text-3xl font-black tracking-widest text-white leading-none uppercase">
              VERI <span className="text-blue-500">CHECK.</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-xl font-medium tracking-wide max-w-2xl mx-auto leading-relaxed px-4">
              Verify reality with military-grade neural analysis. Unmask deepfakes, validate claims, and catch AI fraud instantly.
            </p>
          </div>

          <button 
            onClick={() => setHasStarted(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 lg:px-10 lg:py-5 font-black text-lg lg:text-xl text-white transition-all duration-300 bg-blue-600 rounded-2xl hover:bg-blue-500 active:scale-95 shadow-[0_0_40px_rgba(59,130,246,0.4)]"
          >
            <span className="relative flex items-center gap-4">
              GET STARTED <Rocket size={20} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 lg:p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-blue-600/10 rounded-full blur-[100px] lg:blur-[150px]"></div>
        <div className="z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6 lg:space-y-10 text-center lg:text-left">
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl shiny-blue flex items-center justify-center">
                <ShieldCheck size={28} className="text-white lg:w-9 lg:h-9" />
              </div>
              <h1 className="text-xl lg:text-3xl font-black tracking-tighter uppercase">Vericheck <span className="text-blue-500">AI</span></h1>
            </div>
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-4xl lg:text-6xl font-black leading-tight text-white">{isSignUp ? 'Enroll' : 'Secure'} <span className="text-blue-500">Forensics</span> Terminal.</h2>
              <p className="text-gray-500 text-sm lg:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                {isSignUp ? 'Enroll as a new forensic operator to access the Vericheck truth network.' : 'Establish your secure uplink to the global disinformation defense system.'}
              </p>
            </div>
          </div>

          <div className="glass-panel p-8 lg:p-12 rounded-[30px] lg:rounded-[40px] border-blue-500/20 shadow-2xl relative overflow-hidden">
            {isAuthLoading && (
              <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-blue-500/20 flex items-center justify-center">
                    <Loader2 size={40} className="text-blue-500 animate-spin" />
                  </div>
                  <Fingerprint className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500/50" size={24} />
                </div>
                <h3 className="text-xl font-black text-white mt-8 tracking-widest uppercase">Establishing Secure Uplink</h3>
                <p className="text-blue-400 font-bold text-[10px] mt-2 tracking-widest uppercase animate-pulse">Bypassing local nodes • Encrypting Handshake</p>
              </div>
            )}
            
            <div className="flex mb-8 bg-black/40 p-1.5 rounded-2xl border border-white/5">
              <button 
                onClick={() => { setIsSignUp(false); setShowPassword(false); }}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all ${!isSignUp ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-400'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsSignUp(true); setShowPassword(false); }}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all ${isSignUp ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-400'}`}
              >
                Sign Up
              </button>
            </div>

            <h3 className="text-xl lg:text-2xl font-bold mb-6 text-white">{isSignUp ? 'Enrollment Portal' : 'Operator Portal'}</h3>
            <form onSubmit={handleAuthSubmit} className="space-y-6 lg:space-y-8">
              <div className="space-y-2 lg:space-y-3">
                <label className="text-[9px] lg:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Operator Display Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={18} />
                  <input 
                    type="text" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder={isSignUp ? "New_Agent_Name" : "Forensic_Agent_01"} 
                    className="w-full bg-black/80 border border-blue-900/50 rounded-xl lg:rounded-2xl pl-12 pr-5 py-3.5 lg:py-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white font-medium text-sm lg:text-base" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2 lg:space-y-3">
                <label className="text-[9px] lg:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="w-full bg-black/80 border border-blue-900/50 rounded-xl lg:rounded-2xl pl-12 pr-12 py-3.5 lg:py-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white text-sm lg:text-base" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div 
                className="flex items-center gap-3 cursor-pointer group select-none"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className="text-blue-500">
                  {rememberMe ? <CheckSquare size={20} className="fill-blue-500/10" /> : <Square size={20} className="text-gray-700" />}
                </div>
                <span className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Save login details on this device</span>
              </div>

              <button type="submit" className="w-full shiny-blue py-4 lg:py-5 rounded-xl lg:rounded-2xl font-black text-base lg:text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20 uppercase">
                {isSignUp ? 'Enroll Now' : 'Establish Uplink'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (showGreeting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent_70%)]"></div>
        <div className="z-10 text-center space-y-8 lg:space-y-12 max-w-2xl animate-in zoom-in-95 duration-700 px-4">
           <div className="relative inline-block">
              <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full"></div>
              <div className="relative w-24 h-24 lg:w-32 lg:h-32 mx-auto rounded-full border-4 border-blue-500/20 p-1.5">
                 <img src={user?.avatar} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 w-8 h-8 lg:w-10 lg:h-10 shiny-blue rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                 <Sparkles size={16} className="text-white lg:w-5 lg:h-5" />
              </div>
           </div>

           <div className="space-y-3 lg:space-y-4">
              <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-tight">Hello, <br/><span className="text-blue-500">{user?.username}</span></h2>
              <div className="h-1 w-16 lg:w-24 bg-blue-500 mx-auto rounded-full"></div>
              <p className="text-gray-500 text-sm lg:text-xl font-medium tracking-wide">Authorization complete. Vericheck terminal is at your command.</p>
           </div>

           <button 
             onClick={() => { setShowGreeting(false); setActiveTab('home'); resetInputs(); }}
             className="group shiny-blue px-8 py-4 lg:px-10 lg:py-5 rounded-xl lg:rounded-2xl font-black text-base lg:text-xl flex items-center gap-3 lg:gap-4 mx-auto hover:scale-105 active:scale-95 transition-all"
           >
             ACCESS DASHBOARD <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform lg:w-6 lg:h-6" />
           </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout 
        user={user!} 
        onLogout={() => setShowExitModal(true)} 
        onRefresh={handleGlobalRefresh}
        isRefreshing={isRefreshing}
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          resetInputs();
        }}
      >
        {renderContent()}
      </Layout>

      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-md p-8 lg:p-10 rounded-[40px] border-red-500/20 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20 text-red-500">
               <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter mb-4">Exit Terminal?</h3>
            <p className="text-gray-500 font-medium mb-10">Do you want to exit the application and end your session?</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowExitModal(false)}
                className="py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
              >
                No, Stay
              </button>
              <button 
                onClick={confirmLogout}
                className="py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 hover:bg-red-500 transition-all"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
