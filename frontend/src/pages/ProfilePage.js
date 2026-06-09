import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { updateAvatar, saveFaceDescriptor, findMyPhotos } from '../api';
import { useAuth } from '../context/AuthContext';
import PhotoCard from '../components/PhotoCard';
import toast from 'react-hot-toast';
import API from '../api';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [myPhotos, setMyPhotos] = useState([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [checkingFace, setCheckingFace] = useState(true);

  // Check if face is already registered on page load
  useEffect(() => {
    checkFaceRegistered();
  }, []);

  const checkFaceRegistered = async () => {
    try {
      // Try to find photos — if it works, face is registered
      // If 404, face not registered yet
      const res = await API.get('/face/check-descriptor');
      if (res.data.exists) {
        setFaceRegistered(true);
      }
    } catch (err) {
      // 404 means no face registered yet — that's fine
      setFaceRegistered(false);
    } finally {
      setCheckingFace(false);
    }
  };

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      toast.success('Face recognition models loaded!');
    } catch (err) {
      console.error('Model load error:', err);
      toast.error('Failed to load face recognition models');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSelfieSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const processSelfie = async () => {
    if (!selfieFile) return toast.error('Please select a selfie first');
    if (!modelsLoaded) return toast.error('Please load AI models first');
    setProcessing(true);
    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        const reader = new FileReader();
        reader.onload = (e) => { image.src = e.target.result; };
        reader.readAsDataURL(selfieFile);
      });

      console.log('Image loaded:', img.width, 'x', img.height);

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
          inputSize: 608,
          scoreThreshold: 0.4
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('No face detected! Please use a clear front-facing selfie.');
        setProcessing(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      console.log('Descriptor extracted:', descriptor.length, 'values');

      // Upload selfie as avatar
      const formData = new FormData();
      formData.append('avatar', selfieFile);
      const avatarRes = await updateAvatar(formData);

      // Save descriptor to backend
      await saveFaceDescriptor({
        descriptor,
        selfieUrl: avatarRes.data.user.avatar
      });

      login(localStorage.getItem('token'), avatarRes.data.user);
      setAvatarPreview(avatarRes.data.user.avatar);
      setFaceRegistered(true);
      toast.success('✅ Face registered successfully! You can now find your photos.');
    } catch (err) {
      console.error('Face processing error:', err);
      toast.error(err.response?.data?.message || 'Face processing failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return toast.error('Please select an image');
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await updateAvatar(formData);
      login(localStorage.getItem('token'), res.data.user);
      setAvatarPreview(res.data.user.avatar);
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFindPhotos = async () => {
    try {
      const res = await findMyPhotos();
      setMyPhotos(res.data.photos);
      setPhotosLoaded(true);
      toast.success(`Found ${res.data.count} photo(s)!`);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Please register your face first');
      } else {
        toast.error('Failed to find photos');
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>👤 My Profile</h1>

      <div style={styles.grid}>

        {/* Left — Profile Info */}
        <div style={styles.card}>
          <div style={styles.avatarSection}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 style={styles.userName}>{user?.name}</h2>
              <span style={styles.roleBadge}>{user?.role}</span>
              <p style={styles.userEmail}>{user?.email}</p>
            </div>
          </div>

          <div style={styles.divider} />

          <h3 style={styles.sectionTitle}>📷 Update Profile Picture</h3>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              setAvatarFile(e.target.files[0]);
              setAvatarPreview(URL.createObjectURL(e.target.files[0]));
            }}
            style={styles.fileInput}
          />
          <button
            onClick={handleAvatarUpload}
            disabled={!avatarFile || uploadingAvatar}
            style={{ ...styles.btn, opacity: (!avatarFile || uploadingAvatar) ? 0.5 : 1 }}
          >
            {uploadingAvatar ? '⏳ Uploading...' : '📤 Upload Profile Picture'}
          </button>
        </div>

        {/* Right — Face Recognition */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>🧠 Face Recognition</h3>

          {/* Already Registered Banner */}
          {!checkingFace && faceRegistered && (
            <div style={styles.registeredBanner}>
              ✅ Your face is already registered! You can find your photos below.
              <button
                onClick={() => setFaceRegistered(false)}
                style={styles.reregisterBtn}
              >
                Re-register face
              </button>
            </div>
          )}

          {/* Registration Steps — only show if not registered */}
          {!checkingFace && !faceRegistered && (
            <>
              <p style={styles.helpText}>
                Register your face once so Eventogram can automatically find all photos of you from every event.
              </p>

              {/* Step 1 */}
              <div style={styles.step}>
                <div style={styles.stepNum}>1</div>
                <div style={styles.stepBody}>
                  <p style={styles.stepTitle}>Load AI Models</p>
                  <p style={styles.stepDesc}>Required before processing your face</p>
                  <button
                    onClick={loadModels}
                    disabled={modelsLoaded || loadingModels}
                    style={{
                      ...styles.btn,
                      background: modelsLoaded ? '#166534' : 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                    }}
                  >
                    {loadingModels ? '⏳ Loading...' : modelsLoaded ? '✅ Models Ready!' : '🤖 Load AI Models'}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div style={styles.step}>
                <div style={styles.stepNum}>2</div>
                <div style={styles.stepBody}>
                  <p style={styles.stepTitle}>Upload Your Selfie</p>
                  <p style={styles.stepDesc}>Use a clear, well-lit front-facing photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieSelect}
                    style={styles.fileInput}
                  />
                  {selfiePreview && (
                    <img src={selfiePreview} alt="selfie" style={styles.selfiePreview} />
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div style={styles.step}>
                <div style={styles.stepNum}>3</div>
                <div style={styles.stepBody}>
                  <p style={styles.stepTitle}>Register Your Face</p>
                  <p style={styles.stepDesc}>AI extracts your unique 128-point face fingerprint and saves it permanently</p>
                  <button
                    onClick={processSelfie}
                    disabled={!modelsLoaded || !selfieFile || processing}
                    style={{
                      ...styles.btn,
                      opacity: (!modelsLoaded || !selfieFile || processing) ? 0.5 : 1
                    }}
                  >
                    {processing ? '⏳ Analyzing face...' : '🧠 Register My Face'}
                  </button>
                </div>
              </div>
            </>
          )}

          {checkingFace && (
            <p style={styles.checking}>Checking face registration status...</p>
          )}
        </div>
      </div>

      {/* Find My Photos */}
      <div style={styles.findSection}>
        <div style={styles.findHeader}>
          <div>
            <h2 style={styles.findTitle}>🔍 Find My Photos</h2>
            <p style={styles.findDesc}>
              Searches all event photos for your face using AI matching
            </p>
          </div>
          <button onClick={handleFindPhotos} style={styles.findBtn}>
            🔍 Find My Photos
          </button>
        </div>

        {photosLoaded && myPhotos.length === 0 && (
          <div style={styles.empty}>
            No photos found yet. Make sure you have registered your face and photos have been uploaded.
          </div>
        )}

        {myPhotos.length > 0 && (
          <>
            <p style={styles.photoCount}>✅ {myPhotos.length} photo(s) found</p>
            <div style={styles.photosGrid}>
              {myPhotos.map(photo => (
                <PhotoCard key={photo.id} media={photo} eventId={photo.eventId} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
  pageTitle: {
    fontSize: '2rem', fontWeight: '700', marginBottom: '28px',
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' },
  card: { background: '#1a1a1a', borderRadius: '16px', border: '1px solid #2d2d2d', padding: '28px' },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #7c3aed', flexShrink: 0 },
  avatarPlaceholder: {
    width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2rem', fontWeight: '700', color: 'white'
  },
  userName: { fontSize: '1.3rem', color: '#fff', fontWeight: '700', marginBottom: '4px' },
  roleBadge: {
    display: 'inline-block', background: '#2d1b69', color: '#a78bfa',
    padding: '2px 10px', borderRadius: '20px', fontSize: '12px', marginBottom: '6px'
  },
  userEmail: { color: '#888', fontSize: '13px' },
  divider: { borderTop: '1px solid #2d2d2d', margin: '20px 0' },
  sectionTitle: { color: '#a78bfa', fontSize: '1rem', fontWeight: '700', marginBottom: '14px' },
  helpText: { color: '#888', fontSize: '13px', lineHeight: '1.7', marginBottom: '20px' },
  fileInput: {
    background: '#111', border: '1px solid #3d3d3d', borderRadius: '8px',
    color: '#aaa', padding: '8px', fontSize: '13px', width: '100%', marginBottom: '10px'
  },
  btn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    border: 'none', borderRadius: '8px', padding: '10px 20px',
    fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%'
  },
  registeredBanner: {
    background: '#14532d', border: '1px solid #166534', borderRadius: '10px',
    padding: '16px', color: '#86efac', fontSize: '14px', lineHeight: '1.6',
    display: 'flex', flexDirection: 'column', gap: '10px'
  },
  reregisterBtn: {
    background: 'transparent', border: '1px solid #86efac', color: '#86efac',
    padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
    fontSize: '12px', alignSelf: 'flex-start'
  },
  step: {
    display: 'flex', gap: '14px', marginBottom: '20px',
    paddingBottom: '20px', borderBottom: '1px solid #2d2d2d'
  },
  stepNum: {
    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: '700', fontSize: '13px'
  },
  stepBody: { flex: 1 },
  stepTitle: { color: '#fff', fontWeight: '700', fontSize: '14px', marginBottom: '3px' },
  stepDesc: { color: '#888', fontSize: '12px', marginBottom: '10px' },
  selfiePreview: {
    width: '90px', height: '90px', borderRadius: '8px',
    objectFit: 'cover', marginTop: '8px', border: '2px solid #7c3aed', display: 'block'
  },
  checking: { color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px' },
  findSection: { background: '#1a1a1a', borderRadius: '16px', border: '1px solid #2d2d2d', padding: '28px' },
  findHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
  },
  findTitle: { fontSize: '1.4rem', color: '#fff', fontWeight: '700', marginBottom: '6px' },
  findDesc: { color: '#888', fontSize: '14px' },
  findBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    border: 'none', borderRadius: '10px', padding: '12px 24px',
    fontSize: '14px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap'
  },
  empty: { textAlign: 'center', color: '#888', padding: '30px', background: '#111', borderRadius: '8px', fontSize: '14px' },
  photoCount: { color: '#a78bfa', fontSize: '14px', marginBottom: '16px' },
  photosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }
};

export default ProfilePage;