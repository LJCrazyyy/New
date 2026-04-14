'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  category: string;
}

export function StudentDocuments() {
  const documents: Document[] = [
    {
      id: '1',
      name: 'Official_Transcript_2024.pdf',
      type: 'PDF',
      uploadDate: 'March 8, 2024',
      size: '2.4 MB',
      category: 'Academic',
    },
    {
      id: '2',
      name: 'Certificate_Web_Development.pdf',
      type: 'PDF',
      uploadDate: 'February 20, 2024',
      size: '1.8 MB',
      category: 'Certificate',
    },
    {
      id: '3',
      name: 'Scholarship_Application_2024.docx',
      type: 'DOCX',
      uploadDate: 'January 15, 2024',
      size: '850 KB',
      category: 'Application',
    },
    {
      id: '4',
      name: 'Recommendation_Letter.pdf',
      type: 'PDF',
      uploadDate: 'December 10, 2023',
      size: '1.2 MB',
      category: 'Letter',
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Academic':
        return 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50';
      case 'Certificate':
        return 'bg-green-900/30 text-green-200 hover:bg-green-900/50';
      case 'Application':
        return 'bg-purple-900/30 text-purple-200 hover:bg-purple-900/50';
      case 'Letter':
        return 'bg-amber-900/30 text-amber-200 hover:bg-amber-900/50';
      default:
        return 'bg-gray-700/30 text-gray-200 hover:bg-gray-700/50';
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <div>
              <CardTitle>Documents & Uploads</CardTitle>
              <CardDescription>Manage your documents and certifications</CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-900/50 hover:bg-gray-900/80 transition"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-gray-400">{doc.uploadDate}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">{doc.size}</span>
                      <span className="text-gray-500">•</span>
                      <Badge className={getCategoryColor()}>{doc.category}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No documents uploaded yet</p>
        )}
      </CardContent>
    </Card>
  );
}
