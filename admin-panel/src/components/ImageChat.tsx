import React, { useState, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';

// Use relative URL when on admin panel so the proxy forwards to backend; otherwise direct backend
const getChatImageUrl = () =>
  typeof window !== 'undefined' && window.location.port === '3005'
    ? '/api/admin/ai/chat-image'
    : 'https://thrift-shop-backend-production.up.railway.appapi/admin/ai/chat-image';

interface ImageChatProps {
  authToken: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ImageChat: React.FC<ImageChatProps> = ({ authToken }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotifications();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      showError('Error', 'Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
      setMessages([]);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!imageBase64) {
      showError('Error', 'Please upload an image first');
      return;
    }
    const userText = message.trim() || 'What do you see in this image? Describe it in detail.';
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setMessage('');
    setLoading(true);

    try {
      // Build previous messages for context (assistant replies are plain text)
      const previousMessages = messages.map(m => ({
        role: m.role,
        content: m.role === 'assistant' ? m.content : m.content
      }));

      const response = await fetch(getChatImageUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          image: imageBase64,
          message: userText,
          messages: previousMessages
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        showSuccess('Success', 'AI replied');
      } else {
        const msg = data.error === 'Route not found'
          ? 'Route not found. Restart the backend (port 5001) and rebuild the admin panel, then try again.'
          : (data.error || 'Image chat failed');
        showError('Error', msg);
        setMessages(prev => prev.slice(0, -1)); // Remove the user message we just added
      }
    } catch (err) {
      console.error(err);
      showError('Error', 'Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setMessages([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Image Chat</h1>
        <p className="text-gray-600 mt-1">
          Upload an image and ask anything — like ChatGPT Vision on your site. Describe items, condition, style, etc.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & preview */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your image</h2>
          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
              <span className="text-gray-600">Drop an image or click to upload</span>
            </label>
          ) : (
            <div className="relative">
              <img src={imagePreview} alt="Upload" className="w-full rounded-lg object-contain max-h-64 bg-gray-100" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ask about this image</h2>
          <div className="flex-1 min-h-[200px] max-h-[320px] overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 && !loading && (
              <p className="text-gray-500 text-sm">e.g. &quot;What is this?&quot;, &quot;What condition is it in?&quot;, &quot;Describe the style.&quot;</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2 ${
                    m.role === 'user'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl px-4 py-2 text-gray-500 text-sm">
                  <i className="fas fa-spinner fa-spin mr-2"></i> Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about this image..."
              className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              disabled={!imageBase64 || loading}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!imageBase64 || loading}
              className="px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageChat;
