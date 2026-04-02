import { Resend } from "resend";

// Lazily initialized so the Resend constructor (which throws on missing key)
// is only called after validateEnv() has already confirmed RESEND_API_KEY exists.
let _client = null;

export function getResend() {
  if (!_client) {
    _client = new Resend(process.env.RESEND_API_KEY);
  }
  return _client;
}
