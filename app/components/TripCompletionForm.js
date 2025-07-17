'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TripCompletionForm({ trip, onComplete }) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signature, setSignature] = useState('');
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set up canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#3B5B63';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Clear canvas with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get signature as base64
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    
    // Check if signature is empty (all white)
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let isSignatureEmpty = true;
    
    for (let i = 0; i < pixels.length; i += 4) {
      // Check if any pixel is not white
      if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
        isSignatureEmpty = false;
        break;
      }
    }
    
    if (isSignatureEmpty) {
      alert('Please provide your signature');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update trip with feedback and signature
      const { error } = await supabase
        .from('trips')
        .update({
          status: 'completed',
          driver_feedback: feedback,
          driver_signature: signatureData,
          trip_completed_at: new Date().toISOString(),
          actual_dropoff_time: new Date().toISOString()
        })
        .eq('id', trip.id);
      
      if (error) throw error;
      
      // Call the onComplete callback
      onComplete();
      
    } catch (error) {
      console.error('Error completing trip:', error);
      alert('Failed to complete trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[#3B5B63] dark:text-[#84CED3] mb-4">
          Trip Completion
        </h3>
        
        {/* Trip Summary */}
        <div className="bg-[#F5F7F8] dark:bg-[#1E1E1E] p-4 rounded-lg mb-4">
          <p className="text-sm text-[#3B5B63]/70 dark:text-white/70">
            <strong>From:</strong> {trip.pickup_address}
          </p>
          <p className="text-sm text-[#3B5B63]/70 dark:text-white/70 mt-1">
            <strong>To:</strong> {trip.destination_address}
          </p>
        </div>
      </div>

      {/* Driver Feedback */}
      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-[#3B5B63] dark:text-white mb-2">
          How did the trip go? Any notes or issues to report?
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-[#84CED3] focus:border-[#84CED3] bg-white dark:bg-[#1E1E1E] text-[#3B5B63] dark:text-white"
          placeholder="E.g., Smooth trip, client was ready on time, no issues..."
        />
      </div>

      {/* Signature Pad */}
      <div>
        <label className="block text-sm font-medium text-[#3B5B63] dark:text-white mb-2">
          Driver Signature (Required)
        </label>
        <div className="border-2 border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-40 touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <button
          type="button"
          onClick={clearSignature}
          className="mt-2 text-sm text-[#84CED3] hover:text-[#84CED3]/80"
        >
          Clear Signature
        </button>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => onComplete(false)}
          className="px-4 py-2 text-sm font-medium text-[#3B5B63] dark:text-white bg-[#F5F7F8] dark:bg-[#3B5B63] rounded-md hover:bg-[#F5F7F8]/80 dark:hover:bg-[#3B5B63]/80"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Complete Trip'}
        </button>
      </div>
    </form>
  );
}