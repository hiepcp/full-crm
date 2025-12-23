import React, { useEffect, useRef, useState } from 'react';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import { renderAsync } from 'docx-preview';
import { RestCompliancesRepository } from "@infrastructure/repositories/RestCompliancesRepository";
import { GetFileByIdRefUseCase } from "@application/usecases/compliances";
//GetFileByIdRefUseCase
 const repo = new RestCompliancesRepository();
 const getFileByIdRefUseCase = new GetFileByIdRefUseCase(repo);

const FilePreviewer = ({ idFile }) => {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileType, setFileType] = useState('');
  const [pdfUrl, setPdfUrl] = useState(''); // Thêm state cho PDF URL
  const containerRef = useRef(null);
  const wordRef = useRef(null);

  useEffect(() => {
    if (!idFile) {
      setError('No file ID provided');
      return;
    }
    loadFileData();
  }, [idFile]);

  const loadFileData = async () => {
    setLoading(true);
    setError('');

    try {
    const response = await getFileByIdRefUseCase.execute(idFile);        
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load file');
      }

      const { content, contentType, fileName } = response.data;
      setFileData({ content, contentType, fileName });
      
      // Xác định file type từ contentType
      const type = getFileTypeFromContentType(contentType);
      setFileType(type);

      // Render file theo loại
      await renderFile(content, type, contentType);
    } catch (err) {
      console.error('Error loading file:', err);
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeFromContentType = (contentType) => {
    if (contentType.includes('pdf')) return 'pdf';
    if (contentType.includes('sheet') || contentType.includes('excel')) return 'xlsx';
    if (contentType.includes('word') || contentType.includes('document')) return 'docx';
    if (contentType.includes('image')) return 'image';
    return 'unknown';
  };

  const renderFile = async (base64Content, type, _contentType) => {
    try {
      switch (type) {
        case 'pdf':
           await renderPdf(base64Content);
          break;

        case 'xlsx':
          await renderExcel(base64Content);
          break;

        case 'docx':
          await renderWord(base64Content);
          break;

        case 'image':
          // Image cũng dùng data URL trực tiếp
          break;

        default:
          setError('Unsupported file type');
      }
    } catch (err) {
      console.error('Error rendering file:', err);
      setError('Failed to render file');
    }
  };

  const renderPdf = async (base64Content) => {
    try {
      // Convert base64 to blob
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      
      // Revoke old URL nếu có
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      // Tạo object URL mới
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Error rendering PDF:', err);
      throw err;
    }
  };

  const renderExcel = async (base64Content) => {
    if (!window.LuckyExcel) {
      throw new Error('LuckyExcel not loaded. Check CDN in index.html');
    }

    return new Promise((resolve, reject) => {
      try {
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        window.LuckyExcel.transformExcelToLucky(
          bytes,
          (exportJson) => {
            if (!exportJson?.sheets?.length) {
              reject('Empty or invalid Excel file');
              return;
            }

            if (containerRef.current) {
              containerRef.current.innerHTML = '';
            }

            window.luckysheet.create({
              container: 'luckysheet',
              showinfobar: false,
              lang: 'en',
              data: exportJson.sheets,
              title: exportJson.info?.name || fileData?.fileName || 'Excel Preview'
            });

            resolve();
          },
          (err) => {
            console.error('LuckyExcel transform error:', err);
            reject(err);
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  };

  const renderWord = async (base64Content) => {
    try {
      // Convert base64 to blob
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      if (wordRef.current) {
        wordRef.current.innerHTML = '';
        await renderAsync(blob, wordRef.current);
      }
    } catch (err) {
      console.error('Error rendering Word:', err);
      if (wordRef.current) {
        wordRef.current.innerHTML = "<p style='color:red'>Cannot display Word file</p>";
      }
      throw err;
    }
  };

  const getDataUrl = () => {
    if (!fileData) return '';
    return `data:${fileData.contentType};base64,${fileData.content}`;
  };

  return (
    <div style={{ padding: 8 }}>
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" my={2}>
          <CircularProgress size={28} />
          <Typography ml={2}>Loading file...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: 8,
          padding: 8,
          minHeight: 400
        }}
      >
        {!fileData && !loading && !error && (
          <Typography color="text.secondary">No file selected</Typography>
        )}

        {fileType === 'pdf' && fileData && (
          <iframe
            src={getDataUrl()}
            width="100%"
            style={{ border: 'none', height: 'calc(100vh - 140px)' }}            
            title="PDF Preview"
          />
        )}

        {fileType === 'xlsx' && fileData && (
          <div
            id="luckysheet"
            ref={containerRef}
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              minHeight: '87vh',
              width: '100%'
            }}
          />
        )}

        {fileType === 'docx' && fileData && (
          <div
            ref={wordRef}
            style={{
              padding: 16,
              maxHeight: '87vh',
              overflowY: 'auto',
              background: '#fff'
            }}
          />
        )}

        {fileType === 'image' && fileData && (
          <Box display="flex" justifyContent="center" p={2}>
            <img
              src={getDataUrl()}
              alt={fileData.fileName}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          </Box>
        )}

        {fileType === 'unknown' && fileData && (
          <Alert severity="warning">
            Unsupported file type: {fileData.contentType}
          </Alert>
        )}
      </div>
    </div>
  );
};

export default FilePreviewer;