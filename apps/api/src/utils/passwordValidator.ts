// Common passwords list (top 100 most common)
const COMMON_PASSWORDS = new Set([
  'password', '12345678', '123456789', '1234567890', 'qwerty123',
  'password1', 'Password1', 'password123', 'admin123', 'letmein',
  'welcome', 'monkey', '1234567', 'sunshine', 'princess', 'football',
  'iloveyou', '123123', 'dragon', 'baseball', 'superman', 'qwertyuiop',
  'trustno1', 'jordan23', 'harley', 'hunter', 'buster', 'soccer',
  'batman', 'thomas', 'tigger', 'robert', 'access', 'shadow',
  'master', 'jennifer', 'jordan', 'superstar', 'hello', 'michael',
  'charlie', 'michelle', 'jessica', 'pepper', 'daniel', 'hockey',
  'george', 'michelle', 'andrew', 'love', 'summer', 'winter',
  'spring', 'autumn', 'freedom', 'whatever', 'qazwsx', 'ninja',
  'mustang', 'mercedes', 'ferrari', 'lamborghini', 'porsche', 'bmw',
  'toyota', 'honda', 'nissan', 'ford', 'chevrolet', 'volkswagen',
]);

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
  score: number; // 0-100
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 20;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 20;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 20;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 20;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  } else {
    score += 20;
  }

  // Common password check
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowerPassword)) {
    errors.push('Password is too common. Please choose a more unique password');
    score = Math.max(0, score - 30);
  }

  // Length bonus
  if (password.length >= 12) {
    score += 10;
  }
  if (password.length >= 16) {
    score += 10;
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 80 && errors.length === 0) {
    strength = 'strong';
  } else if (score >= 60 && errors.length <= 1) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
    score: Math.min(100, score),
  };
}
