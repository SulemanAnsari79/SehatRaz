/**
 * Password Validation Utility
 * Provides strong password validation and strength checking
 */

export const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChar: true
};

export const validatePasswordStrength = (password) => {
  const issues = [];

  if (!password) {
    return { isValid: false, score: 0, issues: ['Password is required'] };
  }

  if (password.length < passwordRules.minLength) {
    issues.push(`Password must be at least ${passwordRules.minLength} characters long`);
  }

  if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter (A-Z)');
  }

  if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter (a-z)');
  }

  if (passwordRules.requireNumbers && !/\d/.test(password)) {
    issues.push('Password must contain at least one number (0-9)');
  }

  if (passwordRules.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('Password must contain at least one special character (!@#$%^&*, etc.)');
  }

  // Calculate strength score
  let score = 0;
  if (password.length >= passwordRules.minLength) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  const isValid = issues.length === 0;

  return {
    isValid,
    score: Math.min(score, 100),
    issues,
    strength: score < 30 ? 'weak' : score < 60 ? 'fair' : score < 80 ? 'good' : 'strong'
  };
};

export const getPasswordRequirements = () => {
  return {
    minLength: passwordRules.minLength,
    requireUppercase: passwordRules.requireUppercase,
    requireLowercase: passwordRules.requireLowercase,
    requireNumbers: passwordRules.requireNumbers,
    requireSpecialChar: passwordRules.requireSpecialChar,
    examples: [
      "Strong: MyPassword@2024",
      "Strong: Secure#Pass123",
      "Weak: password123",
      "Weak: 12345678"
    ]
  };
};
