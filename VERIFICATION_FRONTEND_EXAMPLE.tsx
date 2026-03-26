// Email & Phone Verification Component Example
// Copy this to your frontend and customize as needed

import { useState } from 'react';

export default function VerificationForm() {
  const [step, setStep] = useState<'input' | 'verify' | 'complete'>('input');
  const [method, setMethod] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Send verification code
  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const body = method === 'email' 
        ? { email, method, type: 'registration' }
        : { phone, method, type: 'registration' };

      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      setSuccess(data.message);
      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify code
  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const body = method === 'email'
        ? { email, code, method }
        : { phone, code, method };

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      setSuccess(data.message);
      setStep('complete');
      
      // Now you can proceed with registration
      // handleRegister(email, password, code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    setCode('');
    await handleSendCode();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Verify Your Account</h2>

      {/* Step 1: Choose method and enter email/phone */}
      {step === 'input' && (
        <div className="space-y-4">
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Verification Method
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 px-4 rounded ${
                  method === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                📧 Email
              </button>
              <button
                onClick={() => setMethod('sms')}
                className={`flex-1 py-2 px-4 rounded ${
                  method === 'sms'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                📱 SMS
              </button>
              <button
                onClick={() => setMethod('whatsapp')}
                className={`flex-1 py-2 px-4 rounded ${
                  method === 'whatsapp'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                💬 WhatsApp
              </button>
            </div>
          </div>

          {/* Email Input */}
          {method === 'email' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Phone Input */}
          {(method === 'sms' || method === 'whatsapp') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSendCode}
            disabled={loading || (method === 'email' ? !email : !phone)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      )}

      {/* Step 2: Enter verification code */}
      {step === 'verify' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              We sent a 6-digit code to
            </p>
            <p className="font-medium">
              {method === 'email' ? email : phone}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 border rounded-lg text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Code expires in 10 minutes
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            onClick={handleResendCode}
            disabled={loading}
            className="w-full py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Didn't receive code? Resend
          </button>

          <button
            onClick={() => setStep('input')}
            className="w-full py-2 text-gray-600 hover:text-gray-700 text-sm"
          >
            ← Change {method === 'email' ? 'email' : 'phone number'}
          </button>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'complete' && (
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h3 className="text-xl font-bold text-green-600">
            Verification Complete!
          </h3>
          <p className="text-gray-600">
            Your {method === 'email' ? 'email' : 'phone number'} has been verified.
          </p>
          <button
            onClick={() => {
              // Proceed to next step (e.g., complete registration)
              console.log('Proceed to registration');
            }}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Continue to Registration
          </button>
        </div>
      )}
    </div>
  );
}

// Usage in your registration flow:
/*
import VerificationForm from './VerificationForm';

function RegistrationPage() {
  return (
    <div>
      <VerificationForm />
    </div>
  );
}
*/
