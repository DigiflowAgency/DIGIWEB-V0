'use client';

import { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Quote,
  Code,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre contenu ici...',
  minHeight = '300px',
}: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = '', placeholder: string = 'texte') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // Remettre le focus et la sélection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();

      // Insérer le markdown approprié
      if (data.type === 'image') {
        insertText(`![${file.name}](${data.url})`, '\n');
      } else if (data.type === 'video') {
        insertText(`\n<video controls src="${data.url}" class="w-full max-w-2xl rounded-lg"></video>\n`, '\n');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0]; // Prendre le premier fichier

    if (file) {
      // Vérifier que c'est une image ou vidéo
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        uploadFile(file);
      } else {
        alert('Seules les images et vidéos sont acceptées');
      }
    }
  };

  const formatButtons = [
    {
      icon: Heading1,
      label: 'Titre 1',
      action: () => insertText('# ', '\n'),
    },
    {
      icon: Heading2,
      label: 'Titre 2',
      action: () => insertText('## ', '\n'),
    },
    {
      icon: Bold,
      label: 'Gras',
      action: () => insertText('**', '**', 'texte en gras'),
    },
    {
      icon: Italic,
      label: 'Italique',
      action: () => insertText('_', '_', 'texte en italique'),
    },
    {
      icon: List,
      label: 'Liste',
      action: () => insertText('- ', '\n'),
    },
    {
      icon: ListOrdered,
      label: 'Liste numérotée',
      action: () => insertText('1. ', '\n'),
    },
    {
      icon: LinkIcon,
      label: 'Lien',
      action: () => insertText('[', '](https://)', 'texte du lien'),
    },
    {
      icon: Quote,
      label: 'Citation',
      action: () => insertText('> ', '\n'),
    },
    {
      icon: Code,
      label: 'Code',
      action: () => insertText('`', '`', 'code'),
    },
    {
      icon: ImageIcon,
      label: 'Image',
      action: () => fileInputRef.current?.click(),
    },
    {
      icon: VideoIcon,
      label: 'Vidéo',
      action: () => videoInputRef.current?.click(),
    },
  ];

  const renderPreview = (text: string) => {
    // Conversion simple Markdown vers HTML
    const html = text
      // Titres
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />')
      // Gras et italique
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
      // Listes
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      // Citations
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">$1</blockquote>')
      // Code inline
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      // Liens
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
      // Sauts de ligne
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>');

    return `<div class="prose prose-sm max-w-none"><p class="mb-4">${html}</p></div>`;
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden">
      {/* Inputs cachés pour upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Barre d'outils */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center gap-1 flex-wrap">
        {formatButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={button.action}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors group relative"
              title={button.label}
            >
              <Icon className="h-4 w-4 text-gray-600" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {button.label}
              </span>
            </button>
          );
        })}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${
            showPreview
              ? 'bg-violet-100 text-violet-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4" />
              Éditer
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Aperçu
            </>
          )}
        </button>
      </div>

      {/* Zone d'édition / Preview */}
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-8 w-8 text-violet-600 animate-bounce" />
              <p className="text-sm font-semibold text-gray-700">Upload en cours...</p>
            </div>
          </div>
        )}

        {isDragging && !uploading && (
          <div className="absolute inset-0 bg-violet-50 bg-opacity-90 border-4 border-dashed border-violet-400 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-12 w-12 text-violet-600" />
              <p className="text-lg font-semibold text-violet-700">Déposez votre fichier ici</p>
              <p className="text-sm text-violet-600">Images et vidéos acceptées</p>
            </div>
          </div>
        )}

        {showPreview ? (
          <div
            className="p-4 bg-white overflow-y-auto"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-white border-0 focus:outline-none resize-none font-mono text-sm"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* Aide */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center gap-4 flex-wrap">
          <span>💡 Utilisez les boutons ci-dessus pour formater votre texte</span>
          <span>•</span>
          <span>📁 Glissez-déposez des images ou vidéos</span>
          <span>•</span>
          <span><strong>**gras**</strong> → <strong className="font-bold">gras</strong></span>
          <span>•</span>
          <span><em>_italique_</em> → <em className="italic">italique</em></span>
        </div>
      </div>
    </div>
  );
}
