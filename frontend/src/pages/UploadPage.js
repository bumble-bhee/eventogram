import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { uploadMedia } from '../api';
import API from '../api';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'VIEWER') {
      toast.error('Viewers cannot upload media');
      navigate(`/events/${eventId}`);
    }
  }, [user]);

  const onDrop = useCallback(accepted => {
    const previews = accepted.map(file =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setFiles(prev => [...prev, ...previews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    multiple: true,
    maxFiles: 100,
    maxSize: 50 * 1024 * 1024
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Load face detection models silently
  const ensureModelsLoaded = async () => {
    if (modelsLoaded) return;
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.log('Face models not loaded, skipping face tagging');
    }
  };

  // Scan a photo for faces and return descriptors
  const scanFacesInPhoto = async (file) => {
    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        const reader = new FileReader();
        reader.onload = (e) => { image.src = e.target.result; };
        reader.readAsDataURL(file);
      });

      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({
          inputSize: 608,
          scoreThreshold: 0.4
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections.map(d => Array.from(d.descriptor));
    } catch (err) {
      console.log('Face scan failed for file:', file.name);
      return [];
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    setUploading(true);

    try {
      // Step 1 — Upload files to S3
      // Upload in batches of 5 to avoid timeout
      const BATCH_SIZE = 10;
      const allUploadedMedia = [];

      toast.loading(`Uploading ${files.length} file(s)...`);

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const formData = new FormData();
        batch.forEach(file => formData.append('media', file));
        formData.append('isPublic', isPublic);

        const batchRes = await uploadMedia(eventId, formData);
        allUploadedMedia.push(...batchRes.data.media);

        toast.dismiss();
        toast.loading(`Uploaded ${Math.min(i + BATCH_SIZE, files.length)} of ${files.length} files...`);
      }

      toast.dismiss();
      toast.success(`${files.length} file(s) uploaded!`);
      const uploadRes = { data: { media: allUploadedMedia } };

      // Step 2 — Scan faces and tag users automatically
      toast.loading('Scanning faces for auto-tagging...');
      await ensureModelsLoaded();

      const uploadedMedia = uploadRes.data.media;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const media = uploadedMedia[i];
        if (!media) continue;

        const faceDescriptors = await scanFacesInPhoto(file);
        console.log(`Found ${faceDescriptors.length} face(s) in ${file.name}`);

        if (faceDescriptors.length > 0) {
          await API.post('/face/tag-faces', {
            mediaId: media.id,
            faceDescriptors
          });
          console.log(`Tagged faces in photo ${media.id}`);
        }
      }

      toast.dismiss();
      toast.success('Face tagging complete!');
      navigate(`/events/${eventId}`);
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>📤 Upload Media</h1>
        <p style={styles.sub}>Photos will be automatically scanned for face recognition</p>

        <div {...getRootProps()} style={{
          ...styles.dropzone,
          borderColor: isDragActive ? '#a78bfa' : '#3d3d3d',
          background: isDragActive ? '#1e1040' : '#111'
        }}>
          <input {...getInputProps()} />
          <div style={styles.dropContent}>
            <div style={styles.dropIcon}>📁</div>
            {isDragActive
              ? <p style={styles.dropText}>Drop files here!</p>
              : <p style={styles.dropText}>Drag & drop files here, or click to select</p>
            }
            <p style={styles.dropHint}>Supports JPG, PNG, GIF, MP4, MOV • Max 50MB per file • Up to 100 files</p>
          </div>
        </div>

        {files.length > 0 && (
          <div style={styles.previewSection}>
            <h3 style={styles.previewTitle}>{files.length} file(s) selected</h3>
            <div style={styles.previewGrid}>
              {files.map((file, i) => (
                <div key={i} style={styles.previewItem}>
                  {file.type.startsWith('image/') ? (
                    <img src={file.preview} alt={file.name} style={styles.previewImg} />
                  ) : (
                    <div style={styles.videoPreview}>🎥</div>
                  )}
                  <p style={styles.previewName}>{file.name.slice(0, 15)}...</p>
                  <button onClick={() => removeFile(i)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.options}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox" checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            Make photos public
          </label>
        </div>

        <div style={styles.infoBox}>
          🧠 After upload, photos are automatically scanned for faces. Anyone who has registered their face in their profile will be automatically tagged.
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          style={{
            ...styles.uploadBtn,
            opacity: (uploading || files.length === 0) ? 0.6 : 1
          }}
        >
          {uploading ? '⏳ Uploading & scanning faces...' : `📤 Upload ${files.length} File(s)`}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '40px 20px'
  },
  box: {
    background: '#1a1a1a', borderRadius: '16px', border: '1px solid #2d2d2d',
    padding: '40px', width: '100%', maxWidth: '600px'
  },
  title: { fontSize: '1.8rem', color: '#a78bfa', marginBottom: '6px', textAlign: 'center' },
  sub: { color: '#888', textAlign: 'center', marginBottom: '28px', fontSize: '14px' },
  dropzone: {
    border: '2px dashed', borderRadius: '12px', padding: '40px',
    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '20px'
  },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  dropIcon: { fontSize: '3rem' },
  dropText: { color: '#ddd', fontSize: '16px', fontWeight: '600' },
  dropHint: { color: '#666', fontSize: '12px' },
  previewSection: { marginBottom: '20px' },
  previewTitle: { color: '#a78bfa', fontSize: '14px', marginBottom: '12px' },
  previewGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  previewItem: { position: 'relative', width: '80px' },
  previewImg: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' },
  videoPreview: {
    width: '80px', height: '80px', background: '#2d2d2d', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
  },
  previewName: { fontSize: '10px', color: '#888', textAlign: 'center', marginTop: '4px' },
  removeBtn: {
    position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626',
    color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px',
    cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  options: { marginBottom: '16px' },
  checkLabel: { display: 'flex', alignItems: 'center', color: '#aaa', fontSize: '14px', cursor: 'pointer' },
  infoBox: {
    background: '#1e1040', border: '1px solid #2d1b69', borderRadius: '8px',
    padding: '12px 16px', color: '#a78bfa', fontSize: '13px',
    lineHeight: '1.6', marginBottom: '20px'
  },
  uploadBtn: {
    width: '100%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    color: 'white', border: 'none', borderRadius: '10px', padding: '14px',
    fontSize: '16px', fontWeight: '700', cursor: 'pointer'
  }
};

export default UploadPage;