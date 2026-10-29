import React from 'react';
import { ShieldCheck, X, ExternalLink, CheckCircle } from 'lucide-react';

export default function AttributionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <ShieldCheck size={22} className="text-accent" />
            <h2>Terms of Use & API Attribution</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="compliance-card">
            <div className="compliance-header">
              <CheckCircle size={18} className="text-accent" />
              <strong>100% Free, Keyless & Legal Architecture</strong>
            </div>
            <p>
              This application requires <strong>no API keys, user credentials, or secret tokens</strong>.
              All audio previews and catalog metadata are retrieved directly from official open public endpoints.
            </p>
          </div>

          <div className="source-detail-section">
            <h3>Connected Public Data Sources</h3>

            <div className="source-item">
              <h4>1. YouTube Music Audio Streams</h4>
              <p>
                Used to deliver full audio streams with background and lock screen playback.
              </p>
              <ul>
                <li><strong>Terms Compliance:</strong> Audio streams are strictly streamed in-memory via the HTML5 audio element. Streams are never recorded, downloaded, or cached to local disk.</li>
                <li><strong>Attribution:</strong> Track metadata and audio streams are fetched dynamically from open web audio endpoints for non-commercial personal listening.</li>
              </ul>
            </div>

            <div className="source-item">
              <h4>2. Internet Archive (Archive.org)</h4>
              <p>
                Used to provide full audio recordings from open cultural and public-domain audio collections.
              </p>
              <ul>
                <li><strong>Terms Compliance:</strong> Content accessed under Creative Commons, Public Domain, or Open Archive licenses according to each collection's rights statements.</li>
                <li><strong>Attribution:</strong> Audio files hosted by the Internet Archive.</li>
              </ul>
            </div>

            <div className="source-item">
              <h4>3. Deezer Open Public API</h4>
              <p>
                Available as a fallback adapter for search metadata and 30s previews where supported.
              </p>
            </div>
          </div>

          <div className="clean-room-notice">
            <strong>Clean Room Design Notice:</strong> This project contains zero Spotify proprietary code,
            CSS stylesheets, fonts, private tokens, or reverse-engineered binaries. All visual interfaces and
            logic are original implementations.
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-done-btn" onClick={onClose}>
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
