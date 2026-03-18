import React from 'react';
import { CheckCircle, User } from 'lucide-react';

const CompleteProfileBlocker = ({ profile, onContinue }) => {
  const missing = [];
  const v = (value) => (value == null ? '' : String(value).trim());

  if (!v(profile?.username)) missing.push('Username');
  if (!profile?.gender) missing.push('Gender');
  if (!profile?.date_of_birth) missing.push('Date of birth');
  if (!v(profile?.city)) missing.push('City');
  if (!v(profile?.avatar_url)) missing.push('Photo');

  const heightOk = profile?.height != null && v(profile?.height) !== '';
  const weightOk = profile?.weight != null && v(profile?.weight) !== '';
  if (!heightOk) missing.push('Height');
  if (!weightOk) missing.push('Weight');

  const hobbiesVal = profile?.hobbies;
  const hobbiesStr = Array.isArray(hobbiesVal) ? hobbiesVal.join(',') : hobbiesVal;
  const hobbiesOk = hobbiesStr != null && v(hobbiesStr) !== '' && v(hobbiesStr).split(',').filter(Boolean).length > 0;
  if (!hobbiesOk) missing.push('Interests');

  if (!v(profile?.religion)) missing.push('Religion');
  if (!v(profile?.intent)) missing.push('Intent');
  if (!v(profile?.bio)) missing.push('Bio');

  const totalRequiredSteps = 11;
  const completedSteps = Math.max(0, totalRequiredSteps - missing.length);
  const progressPct = Math.min(100, Math.round((completedSteps / totalRequiredSteps) * 100));
  const progressLabel = progressPct >= 75 ? "You're almost there" : 'Complete a few more steps';

  const continueLabel = missing.length > 0 ? 'Continue Profile Setup' : 'Continue';

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-6 pb-20">
      <div className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-rose-400/30">
            <CheckCircle size={42} className="text-rose-300 drop-shadow-lg" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-2">Complete your profile to start matching</h2>
        <p className="text-sm text-white/80 mb-4">{progressLabel}</p>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>{completedSteps} of {totalRequiredSteps} done</span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {missing.length > 0 && (
            <div className="text-xs text-white/50 mt-2">
              {missing.length} required field{missing.length === 1 ? '' : 's'} still need attention
            </div>
          )}
        </div>

        {missing.length > 0 && (
          <div className="text-left bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <p className="text-xs text-white/60 font-bold uppercase tracking-wide mb-3">
              Missing required fields
            </p>
            <ul className="space-y-2">
              {missing.slice(0, 8).map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/85">
                  <span className="mt-0.5 w-2 h-2 bg-rose-400 rounded-full flex-shrink-0" aria-hidden="true" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
            {missing.length > 8 && (
              <p className="text-xs text-white/50 mt-3">And a few more items…</p>
            )}
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-600/40 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <User size={18} />
          {continueLabel}
        </button>
      </div>
    </div>
  );
};

export default CompleteProfileBlocker;

