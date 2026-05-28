import React from 'react';

interface CustomerAvatarCardProps {
  isSpeaking: boolean;
  stage: string;
  customerName?: string;
}

export function CustomerAvatarCard({
  isSpeaking,
  stage,
  customerName = "AI Customer"
}: CustomerAvatarCardProps) {
  // Use absolute paths assuming they are in public folder
  const idleImage = "/avatars/customer-idle.png";
  const speakingImage = "/avatars/customer-speaking.png";

  const currentImage = isSpeaking ? speakingImage : idleImage;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative group p-6 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/50 opacity-50 pointer-events-none" />

      {/* Avatar Container */}
      <div className="relative z-10 w-48 h-48 sm:w-56 sm:h-56 mb-4">
        {/* Animated Ring for Speaking State */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 opacity-60 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute inset-[-8px] rounded-full border-[6px] border-orange-400/30 animate-pulse" />
          </>
        )}

        {/* Avatar Image Profile */}
        <div className={`
          relative w-full h-full rounded-full overflow-hidden border-4 bg-gray-100 z-10 shadow-inner
          transition-all duration-500
          ${isSpeaking ? 'border-orange-500 scale-[1.02] shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'border-gray-200'}
        `}>
          <img
            src={currentImage}
            alt="AI Customer"
            className={`
              w-full h-full object-cover transition-transform duration-500
              ${isSpeaking ? 'scale-105 origin-bottom' : ''}
              ${!isSpeaking ? 'animate-[bounce_3s_ease-in-out_infinite]' : ''}
            `}
            // Adjust the bounce keyframes if you want a custom bob, but standard bounce handles vertical movement.
            // Using tailwind standard bounce or we can add arbitrary styles.
            style={!isSpeaking ? { animation: "float 4s ease-in-out infinite" } : { animation: "bob 0.5s ease-in-out infinite alternate" }}
          />
        </div>

        {/* Status Badge Over Avatar */}
        <div className={`
          absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-xs font-bold shadow-lg
          transition-colors duration-300 border-2
          ${isSpeaking
            ? 'bg-orange-600 text-white border-white'
            : 'bg-white text-gray-700 border-gray-200'
          }
        `}>
          {isSpeaking ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Speaking
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Listening
            </span>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="relative z-10 text-center w-full mt-2">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{customerName}</h3>

        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded uppercase tracking-wider">
            Stage
          </span>
          <span className={`
            px-3 py-1 text-xs font-bold rounded-full capitalize shadow-sm
            ${stage === 'early' ? 'bg-blue-100 text-blue-800 border border-blue-200' : ''}
            ${stage === 'mid' ? 'bg-purple-100 text-purple-800 border border-purple-200' : ''}
            ${stage === 'closing' ? 'bg-orange-100 text-orange-800 border border-orange-200' : ''}
            ${stage === 'closed' ? 'bg-green-100 text-green-800 border border-green-200' : ''}
            ${!['early', 'mid', 'closing', 'closed'].includes(stage) ? 'bg-gray-100 text-gray-800 border border-gray-200' : ''}
          `}>
            {stage}
          </span>
        </div>
      </div>

      {/* Add inline styles for custom animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bob {
          0% { transform: scale(1.05) translateY(0px); }
          100% { transform: scale(1.05) translateY(-2px); }
        }
      `}} />
    </div>
  );
}
