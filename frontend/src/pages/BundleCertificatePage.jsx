import { useParams, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';
import '@fontsource/great-vibes';
import { GraduationCap } from 'lucide-react';

const BundleCertificatePage = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      try {
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        // Fetch the quiz attempt that has this bundle certificate ID
        const { data } = await axios.get(`${BASE_URL}/quiz/bundle-certificate/${certificateId}`, cfg);
        console.log('Bundle Certificate Data:', data); // Debug log
        console.log('Certificate Status:', data.status); // Debug log
        console.log('Restrict Download:', data.restrictDownload); // Debug log
        setCert(data);
      } catch {
        // Fallback: try to derive from local state or show error
        setCert(null);
        alert('Certificate not found or you do not have access.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [certificateId, user, navigate]);

  // Add screenshot and download protection for bundle certificates
  useEffect(() => {
    if (!cert) return;

    // Check if certificate is revoked or restricted (strict comparison)
    const isRestricted = cert.status === 'revoked' || cert.restrictDownload === true;

    if (isRestricted) {
      const disableRightClick = (e) => {
        e.preventDefault();
        return false;
      };

      const disableKeyboardShortcuts = (e) => {
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          alert('⚠️ Screenshot is disabled for this certificate due to policy violations.');
          return false;
        }
        
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
          e.preventDefault();
          alert('⚠️ Download and print are disabled for this certificate due to policy violations.');
          return false;
        }

        if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()))) {
          e.preventDefault();
          return false;
        }
      };

      const addWatermark = () => {
        const watermarkDiv = document.createElement('div');
        watermarkDiv.id = 'restriction-watermark';
        watermarkDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 0, 0, 0.05);
          pointer-events: none;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 72px;
          font-weight: bold;
          color: rgba(255, 0, 0, 0.15);
          transform: rotate(-45deg);
          user-select: none;
        `;
        watermarkDiv.textContent = cert.status === 'revoked' ? 'REVOKED' : 'RESTRICTED';
        document.body.appendChild(watermarkDiv);
      };

      document.addEventListener('contextmenu', disableRightClick);
      document.addEventListener('keydown', disableKeyboardShortcuts);
      addWatermark();

      return () => {
        document.removeEventListener('contextmenu', disableRightClick);
        document.removeEventListener('keydown', disableKeyboardShortcuts);
        const watermark = document.getElementById('restriction-watermark');
        if (watermark) watermark.remove();
      };
    }
  }, [cert]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', background: '#2a2a3e', color: 'white' }}>
      Loading certificate...
    </div>
  );
  if (!cert) return null;

  const completedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isRestricted = cert.status === 'revoked' || cert.restrictDownload === true;

  return (
    <>
      <div className="no-print" style={{ background: '#1a1a2e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ color: '#fff', background: 'transparent', border: '1px solid #555', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 14 }}>
          ← Back
        </button>
        {isRestricted ? (
          <div style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:6, padding:'8px 24px', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
            🚫 {cert.status === 'revoked' ? 'Certificate Revoked' : 'Download Restricted'}
          </div>
        ) : (
          <button onClick={() => window.print()} style={{ background: '#d4af37', color: '#1e2952', border: 'none', borderRadius: 6, padding: '8px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            ⬇ Download PDF
          </button>
        )}
      </div>

      {isRestricted && (
        <div style={{ background:'#fee2e2', border:'2px solid #dc2626', padding:'16px', margin:'20px', borderRadius:8, textAlign:'center' }}>
          <p style={{ color:'#991b1b', fontWeight:'bold', fontSize:16, marginBottom:8 }}>
            ⚠️ {cert.status === 'revoked' ? 'This certificate has been revoked by the administrator.' : 'Download and screenshot have been restricted due to policy violations.'}
          </p>
          <p style={{ color:'#7f1d1d', fontSize:14 }}>
            {cert.revocationReason || 'Please contact support for more information.'}
          </p>
        </div>
      )}

      <div id="cert-page">
        <div id="cert-box">
          {/* Background SVGs */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '450px', height: '450px', zIndex: 1 }} viewBox="0 0 400 300" preserveAspectRatio="none">
            <path d="M0,0 L0,300 C80,240 180,60 400,0 Z" fill="#001B4B" />
          </svg>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '500px', height: '500px', zIndex: 2, pointerEvents: 'none' }} viewBox="0 0 500 500">
            <path d="M0,450 C120,380 300,100 500,0" fill="none" stroke="#C19B5E" strokeWidth="3" />
            <path d="M0,470 C140,400 330,120 500,20" fill="none" stroke="#C19B5E" strokeWidth="1" />
          </svg>

          <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '450px', height: '450px', zIndex: 1, transform: 'rotate(180deg)' }} viewBox="0 0 400 300" preserveAspectRatio="none">
            <path d="M0,0 L0,300 C80,240 180,60 400,0 Z" fill="#001B4B" />
          </svg>
          <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '500px', height: '500px', zIndex: 2, transform: 'rotate(180deg)', pointerEvents: 'none' }} viewBox="0 0 500 500">
            <path d="M0,450 C120,380 300,100 500,0" fill="none" stroke="#C19B5E" strokeWidth="3" />
            <path d="M0,470 C140,400 330,120 500,20" fill="none" stroke="#C19B5E" strokeWidth="1" />
          </svg>

          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(193, 155, 94, 0.08) 0%, transparent 60%)', zIndex: 1, pointerEvents: 'none' }} />

          {/* Inner Gold Borders */}
          <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: '1px solid #C19B5E', zIndex: 3, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', border: '2px solid #C19B5E', zIndex: 3, pointerEvents: 'none' }} />

          {/* Corner flourish accents */}
          <div style={{ position: 'absolute', top: '22px', left: '22px', color: '#C19B5E', zIndex: 4, transform: 'rotate(135deg)', fontSize: '24px' }}>⚜</div>
          <div style={{ position: 'absolute', top: '22px', right: '22px', color: '#C19B5E', zIndex: 4, transform: 'rotate(-135deg)', fontSize: '24px' }}>⚜</div>
          <div style={{ position: 'absolute', bottom: '22px', left: '22px', color: '#C19B5E', zIndex: 4, transform: 'rotate(45deg)', fontSize: '24px' }}>⚜</div>
          <div style={{ position: 'absolute', bottom: '22px', right: '22px', color: '#C19B5E', zIndex: 4, transform: 'rotate(-45deg)', fontSize: '24px' }}>⚜</div>

          {/* Main Content Box */}
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 60px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '6px' }}>
              <GraduationCap size={28} color="#001B4B" strokeWidth={2} />
              <div style={{ color: '#001B4B', fontSize: '18px', fontWeight: '900', fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>
                OICT SOLUTION COMPANY
              </div>
            </div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '0.5px', marginBottom: '30px', fontFamily: 'Arial, sans-serif' }}>
              Online Learning Platform
            </div>

            <div style={{ color: '#001B4B', fontSize: '34px', fontWeight: 'bold', fontFamily: 'Georgia, serif', letterSpacing: '1px', marginBottom: '20px', textTransform: 'uppercase' }}>
              CERTIFICATE OF COMPLETION
            </div>

            {/* Bundle Badge */}
            <div style={{ background: 'linear-gradient(135deg, #5b21b6, #3730a3)', borderRadius: '30px', padding: '4px 20px', color: 'white', fontWeight: '700', fontSize: '11px', letterSpacing: '2px', marginBottom: '15px', textTransform: 'uppercase' }}>
              📦 Bundle Achievement
            </div>

            <div style={{ color: '#555', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
              THIS IS TO CERTIFY THAT
            </div>

            {/* Name */}
            <div style={{ color: '#001B4B', fontSize: '46px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'bold', marginBottom: '12px', lineHeight: 1, letterSpacing: '1px' }}>
              {cert.studentName}
            </div>

            <div style={{ width: '400px', height: '1.5px', background: '#e0c78f', margin: '0 auto 12px' }} />

            <div style={{ color: '#555', fontSize: '13px', marginBottom: '12px', fontFamily: 'Arial, sans-serif' }}>
              has successfully completed the entire course bundle
            </div>

            {/* Bundle Title */}
            <div style={{ color: '#001B4B', fontSize: '20px', fontWeight: 'bold', fontFamily: 'Georgia, serif', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>
              {cert.bundleTitle}
            </div>

            <div style={{ background: '#001B4B', border: '3px solid #C19B5E', borderRadius: '30px', padding: '5px 25px', color: 'white', fontWeight: 'bold', fontSize: '14px', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontFamily: 'Georgia, serif', letterSpacing: '1px' }}>
              FINAL SCORE: {cert.score}%
            </div>

            {/* Footer Layout */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', marginTop: 'auto' }}>
              
              {/* Left Column */}
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#001B4B', borderBottom: '1.5px solid #d4af37', paddingBottom: '4px', marginBottom: '12px', width: '160px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>DATE OF COMPLETION</div>
                <div style={{ fontSize: '14px', color: '#333', fontFamily: 'Arial, sans-serif', marginBottom: '20px' }}>{completedDate}</div>
                {cert.verificationEnabled !== false && (
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('https://'+(cert.verificationURL || 'oicttutor.com')+'/verify/' + certificateId)}`} alt="QR Code" style={{ width: '70px', height: '70px', margin: '0 auto' }} />
                )}
              </div>

              {/* Center Seal */}
              <div style={{ position: 'relative', width: '110px', height: '110px', marginBottom: '10px' }}>
                <div style={{ position: 'absolute', bottom: '-25px', left: '15px', width: '30px', height: '50px', background: '#002B7F', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)', transform: 'rotate(15deg)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)' }} />
                <div style={{ position: 'absolute', bottom: '-25px', right: '15px', width: '30px', height: '50px', background: '#002B7F', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)', transform: 'rotate(-15deg)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '110px', height: '110px', background: '#C19B5E', clipPath: 'polygon(50% 0%, 61% 10%, 75% 7%, 82% 20%, 96% 25%, 96% 40%, 100% 50%, 96% 60%, 96% 75%, 82% 80%, 75% 93%, 61% 90%, 50% 100%, 39% 90%, 25% 93%, 18% 80%, 4% 75%, 4% 60%, 0% 50%, 4% 40%, 4% 25%, 18% 20%, 25% 7%, 39% 10%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                  <div style={{ width: '85px', height: '85px', background: '#d5b26b', borderRadius: '50%', border: '2px dotted #8a6c31', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="#a07c39">
                       <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#001B4B', borderBottom: '1.5px solid #d4af37', paddingBottom: '4px', marginBottom: '12px', width: '160px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>CERTIFICATE ID</div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#001B4B', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '4px 12px', borderRadius: '6px', display: 'inline-block', marginBottom: '35px', fontFamily: '"Courier New", Courier, monospace', letterSpacing: '1px' }}>ID: {certificateId}</div>
              </div>

            </div>

            {/* NEW: Certificate Signature Section at Bottom */}
            <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #e0c78f', paddingTop: '15px' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#001B4B', marginBottom: '8px', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>
                Certificate Signature
              </div>
              <div style={{ fontFamily: '"Great Vibes", cursive', fontSize: '36px', color: '#001B4B', marginBottom: '5px', lineHeight: '1' }}>
                {cert.signature || 'Administrator'}
              </div>
              <div style={{ width: '200px', height: '1.5px', background: '#001B4B', margin: '0 auto' }} />
            </div>

            {cert.verificationEnabled !== false && (
              <div style={{ marginTop: '20px', fontSize: '10px', color: '#666', fontFamily: 'Arial, sans-serif' }}>
                This certificate can be verified at <strong>{cert.verificationURL || 'oicttutor.com'}</strong>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { background: #2a2a3e; font-family: Arial, sans-serif; }
        #cert-page {
          display: flex; align-items: center; justify-content: center;
          min-height: calc(100vh - 50px); padding: 20px; background: #2a2a3e;
        }
        #cert-box {
          width: 297mm; height: 210mm; background: #fafafc; position: relative;
          overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.01) 0, rgba(0,0,0,0.01) 2px, transparent 2px, transparent 4px);
        }
        @media print {
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4 landscape; margin: 0; }
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          #cert-page { min-height: 0 !important; padding: 0 !important; background: white !important; display: block !important; }
          #cert-box { width: 297mm !important; height: 210mm !important; box-shadow: none !important; page-break-inside: avoid !important; }
        }
      `}</style>
    </>
  );
};

export default BundleCertificatePage;
