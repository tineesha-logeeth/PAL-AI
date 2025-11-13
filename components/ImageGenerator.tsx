import React, { useRef, useState } from 'react';
import { marked } from 'marked';
import { Image as ImageIcon, Loader2, Sparkles, Download, ArrowRightLeft, UploadCloud, Paperclip, X, AlertTriangle, Settings, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AutoCorrectingTextarea from './AutoCorrectingTextarea';
import { ImageGeneratorState } from '../types';
import { useApiKey } from '../contexts/ApiKeyContext';

interface ImageGeneratorProps {
  state: ImageGeneratorState;
  setState: React.Dispatch<React.SetStateAction<ImageGeneratorState>>;
  onGenerate: (state: ImageGeneratorState) => void;
  onDescribe: (state: ImageGeneratorState) => void;
  setActiveTab: (tab: 'chat' | 'image' | 'tools' | 'history' | 'settings') => void;
}

const LoadingState = () => (
    <div className="absolute inset-0 bg-[var(--bg-card)]/80 flex flex-col justify-center items-center gap-4 transition-opacity duration-300 z-20">
        <Loader2 className="w-12 h-12 text-[var(--accent-color-1)] animate-spin" />
        <p className="text-lg text-[var(--text-primary)] font-medium">Processing your request...</p>
        <p className="text-sm text-[var(--text-secondary)]">This can take a moment.</p>
    </div>
);

const ApiKeyWarning = ({ setActiveTab, error }: { setActiveTab: ImageGeneratorProps['setActiveTab'], error?: string | null }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="bg-[var(--bg-card)] border border-amber-500/30 rounded-2xl p-8 shadow-2xl shadow-amber-500/10 flex flex-col items-center gap-4">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">API Key Required</h2>
            <p className="text-[var(--text-secondary)] max-w-sm">
                 {error || "To use PAL Gen, you'll need a Gemini API key. Get one from Google AI Studio and add it in the settings."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full">
                <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-all"
                >
                    <Key className="w-5 h-5" />
                    Get API Key
                </a>
                <button
                    onClick={() => setActiveTab('settings')}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-all"
                >
                    <Settings className="w-5 h-5" />
                    Go to Settings
                </button>
            </div>
        </div>
    </div>
);

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ state, setState, onGenerate, onDescribe, setActiveTab }) => {
  const { prompt, isLoading, generatedImageUrl, generatedDescription, error, mode, uploadedImage } = state;
  const { isKeySet, apiKeyError, setApiKeyError } = useApiKey();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'create') {
      e.preventDefault();
      handleAction(onGenerate);
    }
  };

  const setPrompt = (newPrompt: string) => {
    setState(prev => ({ ...prev, prompt: newPrompt }));
  };

  const setMode = (newMode: 'create' | 'describe') => {
    setState(prev => ({
        ...prev,
        mode: newMode,
        error: null,
        generatedImageUrl: null, 
        generatedDescription: null,
    }));
  };
  
  const processFile = (file: File | undefined | null) => {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            setState(prev => ({
                ...prev,
                uploadedImage: {
                    data: base64Data,
                    mimeType: file.type,
                    previewUrl: result,
                },
                generatedDescription: null,
                error: null,
            }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
    if(event.target) event.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === 'describe' && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
    }
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if(mode === 'describe') {
        setIsDragging(false);
        processFile(e.dataTransfer.files?.[0]);
    }
  };

  const handleRemoveImage = () => {
    setState(prev => ({ ...prev, uploadedImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleAction = async (action: (state: ImageGeneratorState) => void) => {
    setApiKeyError(null);
    try {
      await action(state);
    } catch (err) {
        if (err instanceof Error && err.message.toLowerCase().includes('api key')) {
            setApiKeyError('Your API key appears to be invalid. Please check it in Settings.');
        }
        // Other errors are handled in App.tsx
    }
  };

  const mainAction = () => {
    if (mode === 'create') {
        handleAction(onGenerate);
    } else {
        handleAction(onDescribe);
    }
  };

  if (!isKeySet || apiKeyError) {
    return <ApiKeyWarning setActiveTab={setActiveTab} error={apiKeyError} />;
  }

  const isButtonDisabled = isLoading || (mode === 'create' && !prompt.trim()) || (mode === 'describe' && !uploadedImage);

  return (
    <div 
        className="flex flex-col h-full p-4 md:p-6 overflow-y-auto relative"
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-2 bg-[var(--bg-main)]/80 flex flex-col justify-center items-center z-30 border-4 border-dashed border-[var(--accent-color-1)] rounded-2xl"
            >
                <UploadCloud className="w-16 h-16 text-[var(--accent-color-1)]" />
                <p className="mt-4 text-xl font-semibold text-[var(--text-primary)]">Drop image to describe</p>
            </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 flex flex-col gap-4 shadow-2xl shadow-[var(--shadow-color)]">
            <div className="flex items-center p-1 rounded-full bg-[var(--bg-input)] border border-[var(--border-secondary)] self-start mb-4">
                {['create', 'describe'].map((m) => (
                    <button key={m} onClick={() => setMode(m as 'create' | 'describe')}
                        className={`relative px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${mode === m ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {mode === m && <motion.div layoutId="mode-pill" className="absolute inset-0 bg-[var(--bg-card)] rounded-full shadow-sm z-0" />}
                        <span className="relative z-10 capitalize">{m}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col">
                    {mode === 'create' ? (
                        <div className="flex flex-col h-full">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create an Image</h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-4">Describe the image you want to create.</p>
                            <AutoCorrectingTextarea value={prompt} setValue={setPrompt} onKeyPress={handleKeyPress}
                                placeholder="e.g., A majestic crystal palace on a floating island..."
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color-1)] focus:outline-none transition-all resize-none placeholder:text-[var(--text-secondary)]"
                                containerClassName="flex-grow w-full min-h-[150px]" rows={6} disabled={isLoading}
                            />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Describe an Image</h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-4">Upload an image to get an AI-powered description.</p>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                {uploadedImage ? (
                                    <div className="relative w-full max-w-xs aspect-square">
                                        <img src={uploadedImage.previewUrl} alt="Upload preview" className="w-full h-full object-contain rounded-lg" />
                                        <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-[var(--bg-card)]/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-full backdrop-blur-sm">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full text-center p-6 border-2 border-dashed border-[var(--border-secondary)] rounded-xl">
                                        <UploadCloud className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-2" />
                                        <p className="text-sm text-[var(--text-primary)] font-semibold">Drag & drop an image here</p>
                                        <p className="text-xs text-[var(--text-secondary)] my-1">or</p>
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 mx-auto text-sm font-medium text-[var(--accent-text)] bg-[var(--accent-color-1)]/10 px-3 py-1.5 rounded-md hover:bg-[var(--accent-color-1)]/20 transition-colors">
                                            <Paperclip className="w-4 h-4" />
                                            Attach File
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

          <button onClick={mainAction} disabled={isButtonDisabled}
            className="w-full mt-auto flex items-center justify-center gap-2 bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-button-primary-hover)] transition-all font-semibold shadow-lg hover:shadow-[var(--shadow-color-accent)]"
          >
            {mode === 'create' ? <Sparkles className="w-5 h-5"/> : <ArrowRightLeft className="w-5 h-5"/>}
            {mode === 'create' ? 'Generate Image' : 'Describe Image'}
          </button>
        </div>
        <div className="bg-[var(--bg-card)]/50 border-2 border-dashed border-[var(--border-primary)] rounded-2xl p-4 relative flex justify-center items-center min-h-[300px] lg:min-h-0">
          {isLoading && <LoadingState />}
          {error && <p className="text-red-500 text-center p-4">{error}</p>}
          {!isLoading && !error && (
            <div className="text-center text-[var(--text-secondary)]">
                {mode === 'create' && !generatedImageUrl && (
                    <>
                        <ImageIcon className="w-16 h-16 mx-auto mb-2 text-[var(--accent-color-1)]" />
                        <p className="font-medium text-[var(--text-primary)]">Your generated image will appear here.</p>
                    </>
                )}
                {mode === 'describe' && !generatedDescription && (
                    <>
                         <ImageIcon className="w-16 h-16 mx-auto mb-2 text-[var(--accent-color-1)]" />
                        <p className="font-medium text-[var(--text-primary)]">The image description will appear here.</p>
                    </>
                )}
            </div>
          )}
          {generatedImageUrl && mode === 'create' && (
            <div className="relative group w-full h-full flex justify-center items-center">
                <motion.img initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
                  src={generatedImageUrl} alt="Generated by PAL AI" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
                 <a href={generatedImageUrl} download="pal-ai-generated-image.png"
                    className="absolute bottom-4 right-4 bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] p-2.5 rounded-full hover:bg-[var(--bg-button-primary-hover)] transition-all shadow-lg hover:shadow-[var(--shadow-color-accent)] opacity-0 group-hover:opacity-100"
                    aria-label="Download Image" title="Download Image">
                    <Download className="w-5 h-5" />
                </a>
            </div>
          )}
          {generatedDescription && mode === 'describe' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm text-[var(--prose-text-color)] p-4 overflow-y-auto w-full h-full">
                <div dangerouslySetInnerHTML={{ __html: marked.parse(generatedDescription) as string }} />
             </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;