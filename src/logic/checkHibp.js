import CryptoJS from 'crypto-js';

export async function checkHibp(password) {
  // SHA-1 hash the password
  const hash = CryptoJS.SHA1(password).toString().toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();

    // Each line is "SUFFIX:COUNT"
    const lines = text.split('\n');
    const match = lines.find(line => line.startsWith(suffix));

    if (match) {
      const count = parseInt(match.split(':')[1]);
      return { pwned: true, count };
    }

    return { pwned: false, count: 0 };
  } catch (err) {
    console.error('HIBP check failed:', err);
    return { pwned: false, count: 0 }; // fail silently
  }
}