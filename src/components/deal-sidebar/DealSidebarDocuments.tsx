'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Upload, Trash2, Download, File, FileSpreadsheet, FileImage, Eye, X, ExternalLink } from 'lucide-react';
import { DealDocument } from './types';

interface DealSidebarDocumentsProps {
  dealId: string;
}

// Helper pour formater la taille du fichier
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper pour obtenir l'icône selon le type de fichier
function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  if (mimeType.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />;
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText className="h-5 w-5 text-blue-600" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

// Vérifie si un fichier est prévisualisable
function isPreviewable(mimeType: string): boolean {
  return mimeType.includes('pdf') || mimeType.includes('image');
}

export default function DealSidebarDocuments({ dealId }: DealSidebarDocumentsProps) {
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les documents
  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Upload un fichier
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload le fichier
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Erreur upload');
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress(50);

      // 2. Créer l'entrée document
      const docResponse = await fetch(`/api/deals/${dealId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          fileUrl: uploadData.url,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!docResponse.ok) {
        const error = await docResponse.json();
        throw new Error(error.error || 'Erreur création document');
      }

      setUploadProgress(100);
      await loadDocuments();
    } catch (error) {
      console.error('Erreur upload:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Supprimer un document
  const deleteDocument = async (documentId: string) => {
    if (!confirm('Supprimer ce document ?')) return;

    try {
      const response = await fetch(`/api/deals/${dealId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur suppression');
      }

      await loadDocuments();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  // Handlers drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input pour permettre le même fichier
    e.target.value = '';
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-600" />
          Documents
          {documents.length > 0 && (
            <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          )}
        </span>
      </h3>

      {/* Zone d'upload */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`mb-4 p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
          isDragging
            ? 'border-violet-500 bg-violet-50'
            : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
        />
        <div className="text-center">
          {isUploading ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-violet-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">Upload en cours...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Glissez un fichier ici ou <span className="text-violet-600 font-medium">parcourir</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images (max 25MB)</p>
            </>
          )}
        </div>
      </div>

      {/* Liste des documents */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-gray-400 italic text-center py-4">Chargement...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4">Aucun document</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => isPreviewable(doc.fileType) && setPreviewDoc(doc)}
              className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group ${
                isPreviewable(doc.fileType) ? 'cursor-pointer hover:bg-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(doc.fileType)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.fileSize)} •{' '}
                    {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isPreviewable(doc.fileType) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewDoc(doc);
                    }}
                    className="p-1.5 text-violet-600 hover:bg-violet-100 rounded"
                    title="Voir"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <a
                  href={doc.fileUrl}
                  download={doc.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded"
                  title="Télécharger"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDocument(doc.id);
                  }}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de prévisualisation */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setPreviewDoc(null)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] max-w-6xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                {getFileIcon(previewDoc.fileType)}
                <div>
                  <h3 className="font-semibold text-gray-900 truncate max-w-md">
                    {previewDoc.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(previewDoc.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir
                </a>
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.name}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-hidden bg-gray-100">
              {previewDoc.fileType.includes('pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  className="w-full h-full border-0"
                  title={previewDoc.name}
                />
              ) : previewDoc.fileType.includes('image') ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <File className="h-16 w-16 mb-4" />
                  <p className="text-lg font-medium">Prévisualisation non disponible</p>
                  <p className="text-sm mt-2">
                    Téléchargez le fichier pour le consulter
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
