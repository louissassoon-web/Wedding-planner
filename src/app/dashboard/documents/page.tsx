"use client";

import { useState } from "react";
import { Plus, FileText, Folder, Upload, MoreHorizontal, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  name: string;
  folder: string;
  size: string;
  uploadedAt: string;
}

const folders = ["Contracts", "Inspiration", "Quotes", "Receipts", "Other"];

const initialDocuments: Document[] = [];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const filteredDocuments =
    selectedFolder === "all"
      ? documents
      : documents.filter((d) => d.folder === selectedFolder);

  const folderCounts = folders.reduce((acc, folder) => {
    acc[folder] = documents.filter((d) => d.folder === folder).length;
    return acc;
  }, {} as Record<string, number>);

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Documents</h1>
          <p className="mt-1 text-muted-foreground">
            Store and organize your wedding documents
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop files here, or click to browse
                </p>
                <Input type="file" className="mt-4" />
              </div>
              <div className="space-y-2">
                <Label>Folder</Label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {folders.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsUploadDialogOpen(false)}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card
          className={`cursor-pointer transition-colors ${
            selectedFolder === "all" ? "border-primary bg-primary/5" : "hover:bg-accent"
          }`}
          onClick={() => setSelectedFolder("all")}
        >
          <CardContent className="pt-6 text-center">
            <Folder className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 font-medium">All Files</p>
            <p className="text-sm text-muted-foreground">{documents.length} files</p>
          </CardContent>
        </Card>
        {folders.map((folder) => (
          <Card
            key={folder}
            className={`cursor-pointer transition-colors ${
              selectedFolder === folder ? "border-primary bg-primary/5" : "hover:bg-accent"
            }`}
            onClick={() => setSelectedFolder(folder)}
          >
            <CardContent className="pt-6 text-center">
              <Folder className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 font-medium">{folder}</p>
              <p className="text-sm text-muted-foreground">
                {folderCounts[folder] || 0} files
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedFolder === "all" ? "All Documents" : selectedFolder}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your first document to get started.
              </p>
              <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-3 hover:bg-accent/50 px-2 rounded"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.size} • {doc.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem>Move to folder</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
