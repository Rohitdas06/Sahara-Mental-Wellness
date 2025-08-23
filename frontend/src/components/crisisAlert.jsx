import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Heart, X, Shield, ExternalLink, MessageCircle, Users, Clock } from 'lucide-react';

// Purple Heart Logo Component
const PurpleHeartLogo = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#8B5CF6"/>
  </svg>
);

function CrisisAlert({ isVisible, crisisData, onClose, onActionTaken }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionTaken, setActionTaken] = useState(false);

  useEffect(() => {
    if (isVisible && crisisData?.analysis?.urgency === 'critical') {
      setIsExpanded(true);
    }
  }, [isVisible, crisisData]);

  if (!isVisible || !crisisData) return null;

  const { analysis, response } = crisisData;
  const isCritical = analysis?.urgency === 'critical';

  const getAlertTheme = () => {
    const urgency = analysis?.urgency || analysis?.riskLevel || 'default';
    switch (urgency) {
      case 'critical': 
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          header: 'bg-gradient-to-r from-red-500 to-red-600',
          accent: 'text-red-600'
        };
      case 'high': 
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          header: 'bg-gradient-to-r from-orange-500 to-orange-600',
          accent: 'text-orange-600'
        };
      case 'medium': 
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          header: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          accent: 'text-yellow-600'
        };
      default: 
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          header: 'bg-gradient-to-r from-purple-500 to-purple-600',
          accent: 'text-purple-600'
        };
    }
  };

  const theme = getAlertTheme();

  const handleEmergencyCall = (number) => {
    console.log('📞 Emergency call initiated:', number);
    window.open(`tel:${number}`, '_self');
    markActionTaken('emergency_call');
  };

  const markActionTaken = async (action) => {
    console.log('✅ Crisis action taken:', action);
    setActionTaken(true);
    if (onActionTaken) {
      onActionTaken(action);
    }
  };

  const formatMessage = (message) => {
    if (!message) return "Support is available. Please reach out for help.";
    
    return message.split('\n').map((line, index) => {
      if (line.trim() === '') return null;
      
      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <li key={index} className="ml-4 mb-2 text-gray-700 leading-relaxed">
            {line.replace(/^[•\-]\s*/, '')}
          </li>
        );
      }
      
      if (line.includes('🆘') || line.includes('**') || line.includes('💙')) {
        return (
          <h3 key={index} className="font-semibold text-base mt-4 mb-3 text-gray-900 flex items-center">
            <Heart className="w-4 h-4 mr-2 text-purple-500" />
            {line.replace(/\*\*/g, '')}
          </h3>
        );
      }
      
      return (
        <p key={index} className="mb-3 text-base leading-relaxed text-gray-700">
          {line}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
      {/* Modern Card Design */}
      <div className={`w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl ${theme.bg} ${theme.border} border-2 ${isCritical ? 'animate-pulse' : 'animate-in zoom-in-95 duration-300'} overflow-hidden`}>
        
        {/* Beautiful Header */}
        <div className={`${theme.header} text-white p-6 relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                {isCritical ? (
                  <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                ) : (
                  <PurpleHeartLogo className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isCritical ? '🆘 Immediate Support Available' : '💜 Sahara Cares About You'}
                </h1>
                <p className="text-white/90 mt-1 font-medium">
                  {response?.priority || 'Mental Health Support'} • You're Not Alone
                </p>
              </div>
            </div>
            
            {!isCritical && (
              <button
                onClick={() => {
                  console.log('❌ Closing crisis alert');
                  onClose();
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 backdrop-blur-sm"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area with Better Spacing */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] p-6 bg-white">
          
          {/* Main Message Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-start space-x-3 mb-4">
              <div className={`p-2 ${theme.bg} rounded-lg`}>
                <MessageCircle className={`w-5 h-5 ${theme.accent}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  We're Here to Help
                </h2>
                <div className="text-gray-800 leading-relaxed">
                  {response?.message ? formatMessage(response.message) : (
                    <div>
                      <p className="mb-4 text-gray-800">
                        I'm concerned about what you've shared. You don't have to face this alone. 
                        Professional support is available right now.
                      </p>
                      <p className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-blue-600" />
                        24/7 Crisis Support:
                      </p>
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <div className="font-medium text-blue-900">AASRA</div>
                            <div className="text-sm text-blue-700">Emotional support & crisis intervention</div>
                          </div>
                          <div className="text-blue-800 font-mono">+91-22-2754-6669</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <div className="font-medium text-green-900">Sneha India</div>
                            <div className="text-sm text-green-700">Suicide prevention helpline</div>
                          </div>
                          <div className="text-green-800 font-mono">+91-44-2464-0050</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <div>
                            <div className="font-medium text-purple-900">iCall</div>
                            <div className="text-sm text-purple-700">Psychosocial helpline</div>
                          </div>
                          <div className="text-purple-800 font-mono">+91-22-2556-3291</div>
                        </div>
                      </div>
                      <p className="text-gray-700 italic">
                        Your life has value. These trained counselors are here to listen and help.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Actions for Critical Cases */}
          {isCritical && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
                <h3 className="text-xl font-bold mb-4 flex items-center text-red-900">
                  <Phone className="w-6 h-6 mr-3 text-red-600" />
                  Immediate Help Available
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => handleEmergencyCall('+91-22-2754-6669')}
                    className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl group text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">AASRA Crisis Helpline</div>
                        <div className="text-red-100 text-sm">Available 24/7 • Immediate Support</div>
                        <div className="font-mono text-lg mt-1">+91-22-2754-6669</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded-full group-hover:scale-110 transition-transform">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleEmergencyCall('+91-44-2464-0050')}
                    className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl group text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">Sneha India</div>
                        <div className="text-green-100 text-sm">Suicide Prevention • Trained Counselors</div>
                        <div className="font-mono text-lg mt-1">+91-44-2464-0050</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded-full group-hover:scale-110 transition-transform">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cultural Support Section */}
          {response?.culturalSupport && (
            <div className="mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                <h4 className="font-bold text-lg mb-3 text-purple-900 flex items-center">
                  <PurpleHeartLogo className="w-5 h-5 mr-2 text-purple-600" />
                  Understanding Your Context
                </h4>
                <div className="text-purple-800">
                  {formatMessage(response.culturalSupport.message)}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-purple-500" />
              Immediate Self-Care Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {!actionTaken ? (
                <>
                  <button
                    onClick={() => markActionTaken('breathing_exercise')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 text-blue-800 p-4 rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">🧘</span>
                    <span className="font-medium">Breathing</span>
                    <span className="text-xs text-blue-600">Calm your mind</span>
                  </button>
                  
                  <button
                    onClick={() => markActionTaken('find_therapist')}
                    className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 text-green-800 p-4 rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">👨‍⚕️</span>
                    <span className="font-medium">Find Help</span>
                    <span className="text-xs text-green-600">Professional support</span>
                  </button>
                  
                  <button
                    onClick={() => markActionTaken('journal_thoughts')}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 text-purple-800 p-4 rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📝</span>
                    <span className="font-medium">Journal</span>
                    <span className="text-xs text-purple-600">Express yourself</span>
                  </button>
                </>
              ) : (
                <div className="col-span-full flex items-center justify-center space-x-3 text-green-800 bg-green-100 px-6 py-4 rounded-lg border border-green-200">
                  <Heart className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Thank you for taking care of yourself. You're not alone in this.</span>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Details */}
          {!isCritical && analysis && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
              >
                <span>{isExpanded ? 'Hide' : 'Show'} Support Details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              
              {isExpanded && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Risk Assessment: {analysis?.riskLevel || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Support Level: {analysis?.urgency || 'Standard'}</span>
                  </div>
                  {analysis?.triggerWords?.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Keywords detected: {analysis.triggerWords.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
          {isCritical && actionTaken ? (
            <button
              onClick={() => {
                console.log('➡️ Continue conversation');
                onClose();
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Continue Our Conversation
            </button>
          ) : !isCritical ? (
            <div className="space-y-3">
              <button
                onClick={() => {
                  console.log('❌ Close crisis alert');
                  onClose();
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                I'm Ready to Continue
              </button>
              <p className="text-xs text-gray-500">
                Remember: You can always come back to this support information
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default CrisisAlert;
