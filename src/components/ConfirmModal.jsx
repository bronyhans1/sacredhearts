const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type }) => {
  // If modal is closed, return nothing
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-white mb-2 text-center">{title}</h2>
            <p className="text-gray-300 text-sm mb-6 text-center">{message}</p>
            
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-bold hover:bg-gray-700 transition">Cancel</button>
                <button 
                    onClick={handleConfirm}
                    className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg transition ${
                      type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                >
                    Confirm
                </button>
            </div>
      </div>
    </div>
  );
};

export default ConfirmModal;