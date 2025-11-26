export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  percentage: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // Calculate score based on requirements met
  const requirementsMet = Object.values(requirements).filter(Boolean).length;
  const lengthBonus = password.length >= 16 ? 1 : 0;
  
  let score = 0;
  let label = '';
  let color = '';
  let percentage = 0;

  if (requirementsMet === 0 || password.length < 8) {
    score = 0;
    label = 'Very Weak';
    color = 'hsl(var(--destructive))';
    percentage = 20;
  } else if (requirementsMet <= 2) {
    score = 1;
    label = 'Weak';
    color = 'hsl(0 84% 60%)';
    percentage = 40;
  } else if (requirementsMet === 3) {
    score = 2;
    label = 'Fair';
    color = 'hsl(38 92% 50%)';
    percentage = 60;
  } else if (requirementsMet === 4) {
    score = 3;
    label = 'Good';
    color = 'hsl(142 76% 36%)';
    percentage = 80;
  } else if (requirementsMet === 5 && lengthBonus === 1) {
    score = 4;
    label = 'Strong';
    color = 'hsl(142 86% 28%)';
    percentage = 100;
  } else {
    score = 3;
    label = 'Good';
    color = 'hsl(142 76% 36%)';
    percentage = 80;
  }

  return {
    score,
    label,
    color,
    percentage,
    requirements,
  };
}
