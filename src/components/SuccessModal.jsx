import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="sm-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="sm-card" onClick={(e) => e.stopPropagation()}>
                <div className="sm-icon-ring">
                    <svg className="sm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                <h2 className="sm-title">{title}</h2>
                <p className="sm-message">{message}</p>

                <button className="sm-btn" onClick={onClose}>OK</button>
            </div>
        </div>
    );
};

export default SuccessModal;
