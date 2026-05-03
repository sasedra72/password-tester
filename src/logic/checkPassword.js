import zxcvbn from 'zxcvbn';

const SUBS = { a: '@', e: '3', o: '0', i: '1', s: '$', l: '1' };

function normalize(str) {
  return str.toLowerCase().split('').map(c => SUBS[c] || c).join('');
}

function reverse(str) {
  return str.split('').reverse().join('');
}

function contains(password, token) {
  if (!token || token.length < 3) return false;
  return password.includes(token);
}

function variants(str) {
  const lower = str.toLowerCase();
  const subbed = normalize(str);
  return [...new Set([lower, subbed, reverse(lower), reverse(subbed)])];
}

function onlyFirstLetterCapitalized(password) {
  if (!/[A-Z]/.test(password)) return false;
  const upperPositions = [...password].map((c, i) => /[A-Z]/.test(c) ? i : -1).filter(i => i >= 0);
  return upperPositions.length === 1 && upperPositions[0] === 0;
}

function endsWithTwoNumbers(password) {
  return /\d{2}$/.test(password);
}

function specialOnlyAtEnd(password) {
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (!hasSpecial) return false;
  const withoutLast = password.slice(0, -1);
  const lastChar = password.slice(-1);
  return /[^A-Za-z0-9]/.test(lastChar) && /^[A-Za-z0-9]+$/.test(withoutLast);
}

export function checkPassword(password, userInfo, hibpPwned = false) {
  const {
    fullName = '',
    dob = '',
    email = '',
    country = '',
    city = '',
    phone = '',
    petName = '',
  } = userInfo;

  if (!password) return { issues: [], score: 0, breakdown: null };

  const pwd = password.toLowerCase();
  const issues = [];

  // ── zxcvbn first so we can use it throughout ──
  const zResult = zxcvbn(password, [
    fullName, email, country, city, petName,
  ].filter(Boolean));

  // ── 1. Common / keyboard / guessable ──
  if (zResult.score === 0) {
    issues.push({ type: 'critical', message: 'This password is extremely common or easy to guess.' });
  }

  // ── 2. Repeated characters ──
  if (/(.)\1{2,}/.test(pwd)) {
    issues.push({ type: 'weak', message: 'Password contains repeated characters (e.g. aaa, 111).' });
  }

  // ── 3. First letter only capitalized ──
  if (onlyFirstLetterCapitalized(password)) {
    issues.push({ type: 'weak', message: '⚠️ Only your first letter is capitalized — this is a very common pattern.' });
  }

  // ── 4. Ends with two numbers ──
  if (endsWithTwoNumbers(password)) {
    issues.push({ type: 'weak', message: '⚠️ Your password ends with two numbers — this is predictable (e.g. Password12).' });
  }

  // ── 5. Special character only at end ──
  if (specialOnlyAtEnd(password)) {
    issues.push({ type: 'weak', message: '⚠️ Adding a special character only at the end is a known weak pattern.' });
  }

  // ── 6. Full Name ──
  if (fullName) {
    const nameParts = fullName.trim().split(' ').filter(p => p.length >= 3);
    for (const part of nameParts) {
      if (variants(part).some(v => contains(pwd, v))) {
        issues.push({ type: 'personal', message: `Password contains your name "${part}".` });
        break;
      }
    }
  }

  // ── 7. Date of Birth ──
  if (dob) {
    const [year, month, day] = dob.split('-');
    const dobTokens = [
      year, month, day,
      `${day}${month}${year}`,
      `${month}${day}${year}`,
      `${day}${month}`,
      `${year.slice(2)}`,
    ];
    for (const token of dobTokens) {
      if (token && token.length >= 3 && pwd.includes(token)) {
        issues.push({ type: 'personal', message: 'Password contains your date of birth.' });
        break;
      }
    }
  }

  // ── 8. Email ──
  if (email) {
    const emailUser = email.split('@')[0];
    if (variants(emailUser).some(v => contains(pwd, v))) {
      issues.push({ type: 'personal', message: 'Password contains your email username.' });
    }
  }

  // ── 9. Country ──
  if (country) {
    if (variants(country).some(v => contains(pwd, v))) {
      issues.push({ type: 'personal', message: 'Password contains your country name.' });
    }
  }

  // ── 10. City ──
  if (city) {
    if (variants(city).some(v => contains(pwd, v))) {
      issues.push({ type: 'personal', message: 'Password contains your city name.' });
    }
  }

  // ── 11. Phone ──
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const phoneParts = [digits, digits.slice(-4), digits.slice(-6)];
    for (const part of phoneParts) {
      if (part.length >= 4 && pwd.includes(part)) {
        issues.push({ type: 'personal', message: 'Password contains your phone number.' });
        break;
      }
    }
  }

  // ── 12. Pet name ──
  if (petName) {
    if (variants(petName).some(v => contains(pwd, v))) {
      issues.push({ type: 'personal', message: "Password contains your pet's name." });
    }
  }

  // ── 13. Combined fields ──
  if (dob && fullName) {
    const year = dob.split('-')[0];
    const firstName = fullName.split(' ')[0].toLowerCase();
    if (pwd.includes(`${firstName}${year}`) || pwd.includes(`${year}${firstName}`)) {
      issues.push({ type: 'personal', message: 'Password combines your name and birth year.' });
    }
  }

  // ── 14. zxcvbn feedback ──
  if (zResult.feedback.warning) {
    issues.push({ type: 'weak', message: `⚠️ ${zResult.feedback.warning}` });
  }
  zResult.feedback.suggestions.forEach(s => {
    issues.push({ type: 'weak', message: `💡 ${s}` });
  });

  // ────────────────────────────────────────────
  // 5-CATEGORY SCORING (each 0-2, total 0-10)
  // ────────────────────────────────────────────

  const len = password.length;
  const hasPersonalIssue = issues.some(i => i.type === 'personal');
  const hasCriticalIssue = issues.some(i => i.type === 'critical');

  // ── CATEGORY 1: Length / Passphrase (0-2) ──
  const separatedWords = password.split(/[\s\-_.]+/).filter(w => w.length >= 3);
  const dictWords = zResult.sequence.filter(s => s.pattern === 'dictionary');
  const isPassphrase = separatedWords.length >= 3 || dictWords.length >= 3;

  let lengthScore = 0;
  if (isPassphrase)   lengthScore = 2;
  else if (len >= 13) lengthScore = 2;
  else if (len >= 7)  lengthScore = 1;
  else                lengthScore = 0;

  // ── CATEGORY 2: Character Variety (0-2) ──
  const hasRealUpper   = /[A-Z]/.test(password) && !onlyFirstLetterCapitalized(password);
  const hasLower       = /[a-z]/.test(password);
  const hasNumber      = /[0-9]/.test(password) && !endsWithTwoNumbers(password);
  const hasRealSpecial = /[^A-Za-z0-9]/.test(password) && !specialOnlyAtEnd(password);

  const typeCount = [hasRealUpper, hasLower, hasNumber, hasRealSpecial].filter(Boolean).length;

  let varietyScore = 0;
  if (typeCount === 4)     varietyScore = 2;
  else if (typeCount >= 2) varietyScore = 1;
  else                     varietyScore = 0;

  // ── CATEGORY 3: Personal Info (0-2) ──
  const optionalFieldsFilled = !!(city && phone && petName);
  let personalScore = 0;
  if (hasPersonalIssue)           personalScore = 0;
  else if (!optionalFieldsFilled) personalScore = 1;
  else                            personalScore = 2;

  // ── CATEGORY 4: Breach / Common (0-2) ──
  let breachScore = 0;
  if (hibpPwned || hasCriticalIssue) breachScore = 0;
  else                               breachScore = 2;

  // ── CATEGORY 5: Pattern / Entropy — zxcvbn drives this (0-2) ──
  const weakPatternIssues = issues.filter(i =>
    i.type === 'weak' && (
      i.message.includes('first letter') ||
      i.message.includes('ends with two') ||
      i.message.includes('special character only')
    )
  ).length;

  let patternScore = 0;
  if (zResult.score >= 3 && weakPatternIssues === 0)  patternScore = 2;
  else if (zResult.score >= 2)                        patternScore = 1;
  else                                                patternScore = 0;

  // ── Total ──
  const total = lengthScore + varietyScore + personalScore + breachScore + patternScore;

  const breakdown = {
    length:   lengthScore,
    variety:  varietyScore,
    personal: personalScore,
    breach:   breachScore,
    pattern:  patternScore,
  };

  return { issues, score: Math.min(10, total), breakdown };
}