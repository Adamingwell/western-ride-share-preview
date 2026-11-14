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
const signupProfile = document.querySelector('#signup-profile');
const fullName = document.querySelector('#fullName');
const phone = document.querySelector('#phone');
const termsVersion = '2026-11-14';
let mode = 'signin';
function setStatus(message, error = false) { status.textContent = message; status.style.color = error ? '#a12d2d' : '#204e3c'; }
function showSignupGuidance() {
  setStatus('If this email is eligible for registration, check your inbox for a confirmation link. Already registered? ');
  const signin = document.createElement('button');
  signin.type = 'button';
  signin.textContent = 'Sign in';
  signin.className = 'auth-inline-action';
  signin.addEventListener('click', () => setMode('signin'));
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Reset password';
  reset.className = 'auth-inline-action';
  reset.addEventListener('click', () => setMode('reset'));
  status.append(signin, document.createTextNode(' or '), reset, document.createTextNode('.'));
}
function setMode(next) {
  mode = next;
  heading.textContent = next === 'signup' ? 'Create your account' : next === 'reset' ? 'Reset your password' : 'Welcome back';
  submit.textContent = next === 'signup' ? 'Create account' : next === 'reset' ? 'Send reset email' : 'Sign in';
  agreement.hidden = next !== 'signup';
  signupProfile.hidden = next !== 'signup';
  fullName.required = next === 'signup';
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
      const name = fullName.value.trim().replace(/\s+/g,' ');
      const phoneValue = phone.value.trim();
      if(name.length < 2 || name.length > 120) throw Error('Enter your full name (2–120 characters).');
      if(phoneValue && (!/^[+0-9(). -]{7,25}$/.test(phoneValue))) throw Error('Enter a valid phone number or leave it blank.');
      result = await supabase.auth.signUp({email:address,password:password.value,options:{
        emailRedirectTo:redirectTo,
        data:{full_name:name,phone:phoneValue||null,terms_accepted_at:new Date().toISOString(),terms_version:termsVersion}
      }});
    }
    else if (mode === 'reset') result = await supabase.auth.resetPasswordForEmail(address,{redirectTo:new URL('./reset-password.html',location.href).href});
    else result = await supabase.auth.signInWithPassword({email:address,password:password.value});
    if (result.error) throw result.error;
    if (mode === 'signin') location.assign('./board.html');
    else if (mode === 'signup') showSignupGuidance();
    else setStatus('If that address has an account, a password reset email is on its way.');
  } catch (error) {
    if (mode === 'signup' && /already registered|already exists|user already registered/i.test(error.message || '')) showSignupGuidance();
    else setStatus(error.message || 'Something went wrong.', true);
  }
  finally { submit.disabled = false; }
});
supabase.auth.getSession().then(({data})=>{if(data.session) location.replace('./board.html');});
