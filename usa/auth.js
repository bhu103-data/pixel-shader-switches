import {supabaseUrl,supabasePublishableKey} from './auth-config.js';

const $=id=>document.getElementById(id);
const auth=$('auth');
const requestForm=$('request-code');
const verifyForm=$('verify-code');
const identity=$('identity');
const code=$('code');
const status=$('status');
let provider;
let mode='login';
let method='email';
let challenge;
let busy=false;

function message(text){status.textContent=text}
function resetChallenge(){
  challenge=undefined;
  requestForm.hidden=false;
  verifyForm.hidden=true;
  code.value='';
}
function setBusy(active){
  busy=active;
  $('send').disabled=active || !provider;
  $('confirm').disabled=active;
  $('change').disabled=active;
  auth.querySelectorAll('[data-mode],[data-method]').forEach(button=>{button.disabled=active});
}
function showSession(session){
  const signedIn=Boolean(session);
  $('signed-in').hidden=!signedIn;
  auth.hidden=signedIn;
  $('guest').hidden=signedIn;
}
auth.addEventListener('click',event=>{
  const choice=event.target.closest('[data-mode],[data-method]');
  if(!choice || busy) return;
  const {mode:nextMode,method:nextMethod}=choice.dataset;
  if(nextMode) mode=nextMode;
  if(nextMethod && nextMethod!==method){
    method=nextMethod;
    identity.value='';
  }
  resetChallenge();
  identity.type=method==='email'?'email':'tel';
  identity.autocomplete=method==='email'?'email':'tel';
  identity.placeholder=method==='email'?'name@example.com':'+1 212 555 0123';
  $('identity-label').textContent=method==='email'?'邮箱':'手机号（含国家区号）';
  auth.querySelectorAll('[data-mode],[data-method]').forEach(button=>{
    const selected=button.dataset.mode===mode || button.dataset.method===method;
    button.setAttribute('aria-pressed',String(selected));
  });
  if(provider) message('');
});
requestForm.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!provider || busy) return;
  const emailMode=method==='email';
  const address=emailMode?identity.value.trim():identity.value.replace(/[\s()-]/g,'');
  if(!emailMode && !/^\+[1-9]\d{7,14}$/.test(address)){
    message('请输入带国家区号的手机号，例如 +12125550123。');
    identity.focus();
    return;
  }

  setBusy(true);
  try{
    const {error}=await provider.auth.signInWithOtp({
      [method]:address,
      options:{shouldCreateUser:mode==='register'}
    });
    if(error) throw error;
    challenge={method,address};
    requestForm.hidden=true;
    verifyForm.hidden=false;
    message(emailMode?'请查看邮件并输入验证码。':'请查看短信并输入验证码。');
    code.focus();
  }catch{
    message('暂时无法发送验证码。请核对信息、稍后重试，或以访客身份进入。');
  }finally{
    setBusy(false);
  }
});
verifyForm.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!provider || !challenge || busy) return;
  setBusy(true);
  try{
    const {method:channel,address}=challenge;
    const {data,error}=await provider.auth.verifyOtp({
      [channel]:address,
      token:code.value.trim(),
      type:channel==='email'?'email':'sms'
    });
    if(error || !data.session) throw error || new Error('Missing session');
    location.assign(new URL('./scene.html',location.href));
  }catch{
    message('验证码无效或已过期。请检查后重试，或返回重新获取。');
    code.focus();
  }finally{
    setBusy(false);
  }
});
$('change').addEventListener('click',()=>{
  resetChallenge();
  message('');
  identity.focus();
});
$('logout').addEventListener('click',async()=>{
  if(!provider) return;
  $('logout').disabled=true;
  try{
    const {error}=await provider.auth.signOut({scope:'local'});
    if(error) throw error;
    resetChallenge();
    showSession(null);
    message('已退出登录。');
  }catch{
    message('暂时无法退出，请稍后重试。');
  }finally{
    $('logout').disabled=false;
  }
});
async function connect(){
  if(!/^https:\/\/[a-z\d-]+\.supabase\.co\/?$/i.test(supabaseUrl)
    || !supabasePublishableKey.startsWith('sb_publishable_')) return;
  message('正在连接账户服务…');
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm');
    provider=createClient(supabaseUrl,supabasePublishableKey);
    const {data,error}=await provider.auth.getSession();
    if(error) throw error;
    showSession(data.session);
    identity.disabled=false;
    setBusy(false);
    message('');
  }catch{
    provider=undefined;
    message('账户服务暂时无法连接，可先以访客身份体验。');
  }
}
connect();
