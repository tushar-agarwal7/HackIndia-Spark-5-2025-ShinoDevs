// components/dashboard/ChallengeCard.jsx
import Link from 'next/link';

export default function ChallengeCard({ challenge, isActive }) {
  // Format currency with 2 decimal places
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Get language name from language code
  const getLanguageName = (code) => {
    const languages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
    
    return languages[code] || code;
  };
  
  // Format proficiency level for display
  const formatProficiencyLevel = (level) => {
    return level.charAt(0) + level.slice(1).toLowerCase();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Card header with language and level */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">
            {getLanguageName(challenge.languageCode)}
          </span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {formatProficiencyLevel(challenge.proficiencyLevel)}
          </span>
        </div>
      </div>
      
      {/* Card body */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{challenge.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{challenge.description}</p>
        
        {/* Challenge details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Duration:</span>
            <span className="font-medium">{challenge.durationDays} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Daily requirement:</span>
            <span className="font-medium">{challenge.dailyRequirement} min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Stake amount:</span>
            <span className="font-medium">{formatCurrency(challenge.stakeAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Potential yield:</span>
            <span className="font-medium text-green-600">+{challenge.yieldPercentage}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Challenge type:</span>
            <span className={`font-medium ${challenge.isHardcore ? 'text-red-600' : 'text-blue-600'}`}>
              {challenge.isHardcore ? 'Hardcore' : 'No-Loss'}
            </span>
          </div>
        </div>
        
        {/* Action button */}
        {isActive ? (
          <Link 
            href={`/dashboard/challenges/${challenge.id}`}
            className="block w-full py-2 text-center   text-white  bg-gradient-to-r from-cyan-500 to-teal-500 hite rounded-md"
          >
            Continue Challenge
          </Link>
        ) : (
          <Link 
            href={`/dashboard/challenges/${challenge.id}`}
            className="block w-full py-2 text-center   bg-gradient-to-r from-cyan-500 to-teal-500   text-white rounded-md "
          >
            View Challenge
          </Link>
        )}
      </div>
    </div>
  );
}
