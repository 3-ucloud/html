import { useState, useEffect } from 'react';
import { 
  File, 
  Folder, 
  Upload, 
  Trash2, 
  Pencil, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Settings, 
  Zap, 
  Wifi, 
  Cloud, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function App() {
  // State management
  const [activeTab, setActiveTab] = useState('files');
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({
    driveConnected: true,
    syncPercent: 75,
    encryptEnabled: false
  });
  const [syncEvents, setSyncEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Mock data initialization
  useEffect(() => {
    // Mock file data
    const mockFiles = [
      { id: 'f1', name: 'Project_Doc.pdf', size: 245678, modifiedISO: '2023-08-15T14:30:00Z', sha256: 'a1b2c3d4', encrypted: false, status: 'synced' },
      { id: 'f2', name: 'Vacation_Photos.zip', size: 4589231, modifiedISO: '2023-08-10T09:15:00Z', sha256: 'e5f6g7h8', encrypted: true, status: 'syncing' },
      { id: 'f3', name: 'Budget_Q3.xlsx', size: 189234, modifiedISO: '2023-08-20T11:45:00Z', sha256: 'i9j0k1l2', encrypted: false, status: 'pending' },
      { id: 'f4', name: 'Meeting_Notes.docx', size: 87654, modifiedISO: '2023-08-18T16:20:00Z', sha256: 'm3n4o5p6', encrypted: false, status: 'synced' },
      { id: 'f5', name: 'Secure_Data.enc', size: 321098, modifiedISO: '2023-08-22T08:05:00Z', sha256: 'q7r8s9t0', encrypted: true, status: 'synced' }
    ];
    
    setFiles(mockFiles);
    
    // Simulate SSE events for sync
    const eventInterval = setInterval(() => {
      if (activeTab === 'sync') {
        const events = [
          { type: 'info', message: `Synced ${Math.floor(Math.random() * 10) + 1} files` },
          { type: 'success', message: 'Encryption key verified' },
          { type: 'warning', message: 'Large file detected: Vacation_Photos.zip' },
          { type: 'error', message: 'Network interruption - retrying...' }
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        setSyncEvents(prev => [
          ...prev.slice(-19), 
          { 
            id: Date.now(), 
            timestamp: new Date().toLocaleTimeString(), 
            ...randomEvent 
          }
        ]);
      }
    }, 2500);
    
    return () => clearInterval(eventInterval);
  }, [activeTab]);
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Mock API handlers
  const handleUpload = (event) => {
    const files = Array.from(event.target.files);
    setLoading(true);
    
    setTimeout(() => {
      const newFiles = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        modifiedISO: new Date().toISOString(),
        sha256: Math.random().toString(36).substring(2, 15),
        encrypted: status.encryptEnabled,
        status: 'pending'
      }));
      
      setFiles(prev => [...newFiles, ...prev]);
      setLoading(false);
      setError(null);
    }, 1000);
  };
  
  const handleDelete = (id) => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      setFiles(prev => prev.filter(file => file.id !== id));
      setLoading(false);
    }, 500);
  };
  
  const handleRename = (id, newName) => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      setFiles(prev => prev.map(file => 
        file.id === id ? { ...file, name: newName } : file
      ));
      setLoading(false);
    }, 300);
  };
  
  const handleToggleEncryption = () => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      setStatus(prev => ({ ...prev, encryptEnabled: !prev.encryptEnabled }));
      setFiles(prev => prev.map(file => ({
        ...file,
        encrypted: !status.encryptEnabled
      })));
      setLoading(false);
    }, 800);
  };
  
  const handleStartSync = () => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      setStatus(prev => ({ ...prev, syncPercent: 100 }));
      setLoading(false);
      
      // Reset after sync completes
      setTimeout(() => {
        setStatus(prev => ({ ...prev, syncPercent: 0 }));
      }, 3000);
    }, 1500);
  };
  
  // Render file status badge
  const renderStatusBadge = (status) => {
    const styles = {
      synced: 'bg-green-100 text-green-800',
      syncing: 'bg-blue-100 text-blue-800 animate-pulse',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'synced' && <CheckCircle className="inline w-3 h-3 mr-1" />}
        {status === 'syncing' && <RefreshCw className="inline w-3 h-3 mr-1 animate-spin" />}
        {status}
      </span>
    );
  };
  
  // Render event log
  const renderEventLog = () => {
    return syncEvents.map(event => (
      <div 
        key={event.id} 
        className={`flex items-start p-3 border-l-4 ${
          event.type === 'error' ? 'border-red-500 bg-red-50' :
          event.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
          event.type === 'success' ? 'border-green-500 bg-green-50' :
          'border-blue-500 bg-blue-50'
        }`}
      >
        <div className="flex-shrink-0 mr-2 mt-0.5">
          {event.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
          {event.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
          {event.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
          {event.type === 'info' && <Zap className="w-4 h-4 text-blue-500" />}
        </div>
        <div>
          <p className="text-sm">{event.message}</p>
          <span className="text-xs text-gray-500">{event.timestamp}</span>
        </div>
      </div>
    ));
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 bg-white shadow-lg z-40 transition duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-4 bg-indigo-600 text-white">
          <div className="flex items-center">
            <Cloud className="w-6 h-6 mr-2" />
            <h1 className="text-xl font-bold">Ucloud</h1>
          </div>
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        
        <nav className="mt-5 px-2">
          {[
            { id: 'files', icon: Folder, label: 'Files' },
            { id: 'sync', icon: RefreshCw, label: 'Sync' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <a
              key={item.id}
              href="#"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 transition-colors ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
                setMobileSidebarOpen(false);
              }}
            >
              <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button 
                className="md:hidden text-gray-500"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <h2 className="text-lg font-semibold text-gray-800 capitalize">{activeTab} dashboard</h2>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                  <Zap className={`w-4 h-4 mr-2 ${status.syncPercent > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">{status.syncPercent}%</span>
                </div>
                
                <button 
                  onClick={handleToggleEncryption}
                  className={`p-2 rounded-full ${status.encryptEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  disabled={loading}
                >
                  {status.encryptEnabled ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Your Files</h3>
                  <p className="mt-1 text-sm text-gray-500">All files stored in your private cloud</p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button 
                    onClick={handleStartSync}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Sync Now
                  </button>
                  
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleUpload}
                      multiple
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {files.map((file) => (
                    <li key={file.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                              <File className="w-5 h-5 text-indigo-600" />
                            </div>
                          </div>
                          <div className="ml-4 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <div className="flex flex-wrap items-center mt-1 text-xs text-gray-500">
                              <span>{formatFileSize(file.size)} • </span>
                              <span className="ml-1">{formatDate(file.modifiedISO)}</span>
                              {file.encrypted && (
                                <span className="ml-2 flex items-center bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded">
                                  <Lock className="w-3 h-3 mr-1" /> Encrypted
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {renderStatusBadge(file.status)}
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                const newName = prompt('Enter new name:', file.name);
                                if (newName && newName !== file.name) handleRename(file.id, newName);
                              }}
                              disabled={loading}
                              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(file.id)}
                              disabled={loading}
                              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {files.length === 0 && (
                  <div className="p-12 text-center">
                    <Folder className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by uploading your first file.</p>
                    <div className="mt-6">
                      <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleUpload}
                          multiple
                          disabled={loading}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Sync Tab */}
          {activeTab === 'sync' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Sync Activity</h3>
                  <p className="mt-1 text-sm text-gray-500">Real-time updates from your sync process</p>
                </div>
                
                <div className="h-96 overflow-y-auto p-4 space-y-3">
                  {syncEvents.length > 0 ? (
                    renderEventLog()
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <RefreshCw className="w-12 h-12 mb-4 opacity-50 animate-spin" />
                      <p className="text-center">Waiting for sync events...</p>
                      <p className="text-sm mt-2">Sync will start automatically when files change</p>
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Sync Progress</span>
                        <span className="font-medium">{status.syncPercent}%</span>
                      </div>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${status.syncPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={handleStartSync}
                      disabled={loading || status.syncPercent > 0}
                      className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Force Sync
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage encryption and network settings</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  <div className="px-6 py-5">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        {status.encryptEnabled ? (
                          <Lock className="w-5 h-5 text-green-500" />
                        ) : (
                          <Unlock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">File Encryption</h4>
                            <p className="mt-1 text-sm text-gray-500">
                              {status.encryptEnabled 
                                ? 'All new files will be encrypted with AES-256 before storage' 
                                : 'Files are stored in their original format without encryption'}
                            </p>
                          </div>
                          <button
                            onClick={handleToggleEncryption}
                            disabled={loading}
                            className={`mt-3 sm:mt-0 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm ${
                              status.encryptEnabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                          >
                            {status.encryptEnabled ? 'Disable Encryption' : 'Enable Encryption'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-5">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <Wifi className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">Cloudflare Tunnel</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          Create a secure tunnel to access your cloud from anywhere without port forwarding
                        </p>
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center">
                          <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Cloud className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                placeholder="yourname"
                                disabled
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">.u.cloud</span>
                              </div>
                            </div>
                          </div>
                          <button
                            disabled
                            className="ml-0 sm:ml-3 w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Create Tunnel
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Note: Requires Cloudflare Tunnel installed separately
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-5">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900">Important Notes</h4>
                        <ul className="mt-2 space-y-1 text-sm text-gray-500 list-disc list-inside">
                          <li>Files never leave your device - this is a private cloud solution</li>
                          <li>Encryption password is required to recover files if lost</li>
                          <li>Cloudflare Tunnel requires separate installation of cloudflared</li>
                          <li>Backup your .ucloud_meta.json file for disaster recovery</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
