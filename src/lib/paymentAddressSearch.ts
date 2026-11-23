export const STELLAR_PUBLIC_KEY_RE = /^G[A-Z0-9]{55}$/;

export function validateWalletAddress(value: string): string | null {
  const address = value.trim();
  if (!address) return null;
  if (!STELLAR_PUBLIC_KEY_RE.test(address)) {
    return 'Enter a valid Stellar public key (G followed by 55 uppercase letters or digits).';
  }
  return null;
}

export function matchesWalletAddress(
  payment: { toAddress: string | null },
  walletAddress: string
): boolean {
  const address = walletAddress.trim();
  if (!STELLAR_PUBLIC_KEY_RE.test(address)) return true;
  return (payment.toAddress ?? '').trim() === address;
}
