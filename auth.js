import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const form = document.querySelector('#auth-form');
const status = document.querySelector('#auth-status');
const submit = document.querySelector('#auth-submit');
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const heading = document.querySelector('#auth-heading');
const agreement = document.querySelector('#signup-agreement');
const acceptTerms = document.querySelector('#acceptTerms');
const termsVersion = '2026-11-14';
let mode = 'signin';
function setStatus(message, error = false) { status.textContent = message; status.style.color = error ? '#a12d2d' : '#204e3c'; }
function setMode(next) {
  mode = next;
  heading.textContent = next === 'signup' ? 'Create your account' : next === 'reset' ? 'Reset your password' : 'Welcome back';
  submit.textContent = next === 'signup' ? 'Create account' : next === 'reset' ? 'Send reset email' : 'Sign in';
  agreement.hidden = next !== 'signup';
  acceptTerms.required = next === 'signup';
  if (next !== 'signup') acceptTerms.checked = false;
  password.hidden = next === 'reset';
  password.required = next !== 'reset';
  setStatus('');
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
form.addEventListener('submit', async event => {
  event.preventDefault(); submit.disabled = true; setStatus('Working…');
  try {
    const address = email.value.trim();
    const redirectTo = new URL('./board.html', location.href).href;
    let result;
    if (mode === 'signup') {
      if (!acceptTerms.checked) throw Error('Please accept the Terms of Service before creating an account.');
      result = await supabase.auth.signUp({email:address,password:password.value,options:{
        emailRedirectTo:redirectTo,
        data:{terms_accepted_at:new Date().toISOString(),terms_version:termsVersion}
      }});
    }
    else if (mode === 'reset') result = await supabase.auth.resetPasswordForEmail(address,{redirectTo:new URL('./reset-password.html',location.href).href});
    else result = await supabase.auth.signInWithPassword({email:address,password:password.value});
    if (result.error) throw result.error;
    if (mode === 'signin') location.assign('./board.html');
    else setStatus(mode === 'signup' ? 'Check your email to confirm your account before signing in.' : 'If that address has an account, a password reset email is on its way.');
  } catch (error) { setStatus(error.message || 'Something went wrong.', true); }
  finally { submit.disabled = false; }
});
supabase.auth.getSession().then(({data})=>{if(data.session) location.replace('./board.html');});
