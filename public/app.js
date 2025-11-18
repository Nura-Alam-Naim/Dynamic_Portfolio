
const $ = sel => document.querySelector(sel);
const registerPanel = $('#register-form');
const loginPanel = $('#login-form');
const notLogged = $('#not-logged');
const portfolioArea = $('#portfolio-area');
const btnLogin = $('#btn-login');
const btnRegister = $('#btn-register');
const btnLogout = $('#btn-logout');

function show(id) { if (id) id.classList.remove('hidden'); }
function hide(id) { if (id) id.classList.add('hidden'); }

btnRegister.addEventListener('click', () => { show(registerPanel); hide(loginPanel); });
btnLogin.addEventListener('click', () => { show(loginPanel); hide(registerPanel); });

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data),
    credentials: 'include' 
  });
  const j = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: j };
}

async function getJSON(url) {
  const res = await fetch(url, { credentials: 'include' });
  const j = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: j };
}

document.getElementById('reg-submit').addEventListener('click', async () => {
  const email = $('#reg-email').value.trim();
  const password = $('#reg-password').value;
  if (!email || !password) return alert('Provide email and password');
  const r = await postJSON('/api/register', { email, password });
  if (r.ok) {
    alert('Registered and logged in!');
    initAfterAuth();
  } else {
    alert(r.body.error || `Error (${r.status})`);
  }
});

document.getElementById('login-submit').addEventListener('click', async () => {
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  if (!email || !password) return alert('Provide email and password');
  const r = await postJSON('/api/login', { email, password });
  if (r.ok) {
    alert('Logged in!');
    initAfterAuth();
  } else {
    alert(r.body.error || `Error (${r.status})`);
  }
});

btnLogout.addEventListener('click', async () => {
  await postJSON('/api/logout', {});
  location.reload();
});

async function initAfterAuth() {
  hide(registerPanel); hide(loginPanel); hide(notLogged);
  show(portfolioArea); show(btnLogout);
  hide(btnLogin); hide(btnRegister);


  const res = await getJSON('/api/portfolio');
  if (res.status === 200 && res.body.portfolio) fillForm(res.body.portfolio);
}

function fillForm(p) {
  $('#full_name').value = p.full_name || '';
  $('#contact').value = p.contact || '';
  $('#bio').value = p.bio || '';
  $('#soft_skills').value = p.soft_skills || '';
  $('#technical_skills').value = p.technical_skills || '';
  $('#academics').value = p.academics || '';
  $('#experience').value = p.experience || '';
  $('#projects').value = p.projects || '';
  if (p.photo_base64) {
    currentPhoto = p.photo_base64;
    renderPreview();
  }
}

let currentPhoto = null;
$('#photo').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentPhoto = reader.result; 
  };
  reader.readAsDataURL(file);
});

$('#btn-preview').addEventListener('click', () => renderPreview());

function renderPreview() {
  const preview = $('#preview');
  const p = {
    full_name: $('#full_name').value,
    contact: $('#contact').value,
    bio: $('#bio').value,
    soft: $('#soft_skills').value,
    tech: $('#technical_skills').value,
    academics: $('#academics').value,
    exp: $('#experience').value,
    proj: $('#projects').value,
    photo: currentPhoto
  };
  preview.innerHTML = `
    <div class="preview-header">
      ${p.photo ? `<img src="${p.photo}" alt="photo" />` : `<div style="width:110px;height:110px;border-radius:10px;background:#081222;display:flex;align-items:center;justify-content:center;color:#75818b">No Photo</div>`}
      <div>
        <div class="preview-title">${p.full_name || 'Your Name'}</div>
        <div style="color:var(--muted)">${p.contact || ''}</div>
        <div style="margin-top:8px">${p.bio || ''}</div>
      </div>
    </div>
    <div class="preview-section"><strong>Soft Skills:</strong> ${p.soft || ''}</div>
    <div class="preview-section"><strong>Technical Skills:</strong> ${p.tech || ''}</div>
    <div class="preview-section"><strong>Academics:</strong><pre style="white-space:pre-wrap">${p.academics || ''}</pre></div>
    <div class="preview-section"><strong>Experience:</strong><pre style="white-space:pre-wrap">${p.exp || ''}</pre></div>
    <div class="preview-section"><strong>Projects / Publications:</strong><pre style="white-space:pre-wrap">${p.proj || ''}</pre></div>
  `;
}

$('#btn-save').addEventListener('click', async () => {
  const payload = {
    full_name: $('#full_name').value,
    contact: $('#contact').value,
    photo_base64: currentPhoto,
    bio: $('#bio').value,
    soft_skills: $('#soft_skills').value,
    technical_skills: $('#technical_skills').value,
    academics: $('#academics').value,
    experience: $('#experience').value,
    projects: $('#projects').value
  };
  const res = await postJSON('/api/portfolio', payload);
  if (res.ok) alert('Saved!');
  else alert(res.body.error || `Error (${res.status})`);
});

$('#btn-pdf').addEventListener('click', async () => {
  renderPreview();

  const original = document.getElementById('preview');

  
  const clone = original.cloneNode(true);

  
  clone.style.background = '#ffffff';
  clone.style.color = '#111111';
  clone.style.fontFamily = '"Poppins", Arial, sans-serif';
  clone.style.padding = '24px';
  clone.style.width = '100%';
  clone.style.boxShadow = 'none';

  // make images & headers clear
  clone.querySelectorAll('img').forEach(img => {
    img.style.border = '2px solid #056839';
    img.style.borderRadius = '10px';
  });
  clone.querySelectorAll('.preview-title').forEach(t => {
    t.style.color = '#056839';
    t.style.fontWeight = '700';
  });
  clone.querySelectorAll('strong').forEach(s => {
    s.style.color = '#056839';
    s.style.fontWeight = '600';
  });
  clone.querySelectorAll('pre').forEach(p => {
    p.style.background = '#fafafa';
    p.style.color = '#222';
    p.style.padding = '4px 8px';
    p.style.borderRadius = '4px';
  });

  
  const temp = document.createElement('div');
  temp.style.background = '#ffffff';
  temp.style.padding = '20px';
  temp.appendChild(clone);
  document.body.appendChild(temp);

  await new Promise(r => setTimeout(r, 300));

  const opt = {
    margin: 15,
    filename: 'portfolio.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };

  await html2pdf().set(opt).from(temp).save();

  document.body.removeChild(temp);
});


(async function checkSession() {
  try {
    const res = await getJSON('/api/portfolio');
    if (res.status === 200) initAfterAuth();
    else {
      show(btnLogin); show(btnRegister);
      hide(btnLogout);
      show(notLogged);
    }
  } catch (e) {
    show(btnLogin); show(btnRegister);
    hide(btnLogout);
    show(notLogged);
  }
})();
