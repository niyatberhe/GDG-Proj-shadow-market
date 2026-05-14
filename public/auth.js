const API_URL = '/api'
const loginBtn = document.getElementById('login-btn')
const authModal = document.getElementById('auth-modal')
const closeAuthBtn = document.getElementById('close-auth-btn')
const requestCodeBtn = document.getElementById('request-code-btn')
const verifyCodeBtn = document.getElementById('verify-code-btn')

// If there's an "Enter the Market" control on intro page, make it open auth modal
const enterMarketBtn = document.getElementById('enter-market')
if (enterMarketBtn) enterMarketBtn.addEventListener('click', () => openAuth(true))

function openAuth(open) {
  if (open) authModal.classList.add('modal-active')
  else authModal.classList.remove('modal-active')
}

loginBtn.addEventListener('click', () => openAuth(true))
closeAuthBtn.addEventListener('click', () => openAuth(false))

requestCodeBtn.addEventListener('click', async () => {
  const phone = document.getElementById('auth-phone').value
  if (!phone) return alert('Phone required')
  try {
    const res = await fetch(`${API_URL}/auth/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed')
    alert('Code (dev): ' + data.code)
  } catch (err) {
    alert(err.message)
  }
})

verifyCodeBtn.addEventListener('click', async () => {
  const phone = document.getElementById('auth-phone').value
  const code = document.getElementById('auth-code').value
  if (!phone || !code) return alert('Phone and code required')
  try {
    const res = await fetch(`${API_URL}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed')
    localStorage.setItem('token', data.token)
    localStorage.setItem('userId', data.user.id)
    openAuth(false)
    window.location.href = '/index.html'
  } catch (err) {
    alert(err.message)
  }
})
