import { useState } from 'react';

const InputModal = ({ isOpen, onClose, onSubmit, title, placeholder, showCategorySelect, categories, selectedCategory, onCategoryChange }) => {
  const [inputVal, setInputVal] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (showCategorySelect && !selectedCategory) {
        alert("Please select a category.");
        return;
    }
    onSubmit(inputVal);
    setInputVal("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">{title}</h2>
            
            {showCategorySelect && categories && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select 
                        value={selectedCategory || ''}
                        onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white [&>option]:bg-gray-800 [&>option]:text-white"
                    >
                        <option value="">Select a category...</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            )}
            
            <textarea 
                autoFocus
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" 
                rows="4"
                placeholder={placeholder}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
                <button 
                    onClick={handleSubmit}
                    className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-rose-700 transition"
                >
                    Submit
                </button>
            </div>
        </div>
    </div>
  );
};

export default InputModal;