import React from 'react';

const PasswordStrengthIndicator = ({ password = '' }) => {
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, level: 'none', color: 'gray', text: '' };
    
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };

    Object.values(checks).forEach(check => {
      if (check) score++;
    });

    let level = 'weak';
    let color = 'red';
    let text = 'Weak';

    if (score >= 4) {
      level = 'strong';
      color = 'green';
      text = 'Strong';
    } else if (score >= 3) {
      level = 'good';
      color = 'blue';
      text = 'Good';
    } else if (score >= 2) {
      level = 'fair';
      color = 'yellow';
      text = 'Fair';
    }

    return { score, level, color, text, checks };
  };

  const strength = calculateStrength(password);

  if (strength.score === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 bg-${strength.color}-500`}
            style={{
              width: `${(strength.score / 5) * 100}%`,
              backgroundColor: strength.color === 'red' ? '#ef4444' : 
                               strength.color === 'yellow' ? '#eab308' : 
                               strength.color === 'blue' ? '#3b82f6' : 
                               '#22c55e'
            }}
          />
        </div>
        <span className={`text-sm font-medium text-${strength.color}-600`} style={{color: strength.color === 'red' ? '#dc2626' : 
                               strength.color === 'yellow' ? '#ca8a04' : 
                               strength.color === 'blue' ? '#1d4ed8' : 
                               '#16a34a'}}>
          {strength.text}
        </span>
      </div>
      
      <div className="mt-2 text-xs space-y-1">
        <div className={strength.checks.length ? 'text-green-600' : 'text-gray-400'}>
          ✓ At least 8 characters
        </div>
        <div className={strength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}>
          ✓ Uppercase letters (A-Z)
        </div>
        <div className={strength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}>
          ✓ Lowercase letters (a-z)
        </div>
        <div className={strength.checks.numbers ? 'text-green-600' : 'text-gray-400'}>
          ✓ Numbers (0-9)
        </div>
        <div className={strength.checks.special ? 'text-green-600' : 'text-gray-400'}>
          ✓ Special characters (!@#$%^&*, etc.)
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
